import { NextResponse } from "next/server";
import { PrismaClient, EstadoAprobacion, EstadoVisita } from "@prisma/client";
import { resolverUsuario } from "../../../../../lib/currentUser";

const prisma = new PrismaClient();

/**
 * Rechaza la solicitud de aprobación de una visita.
 *
 * La validación JWT por sesión está deshabilitada (PRY-19). La identidad del
 * usuario se resuelve con `resolverUsuario` (cabecera X-User-Email o fallback).
 *
 * @async
 * @param {Request} req - Objeto de la solicitud HTTP entrante.
 * @param {Object} context - Contexto de la ruta.
 * @param {Promise<{id: string}>} context.params - Promesa con el id de la aprobación.
 * @returns {Promise<Response>} Respuesta JSON con la aprobación actualizada.
 */
export async function POST(req, { params }) {
  try {
    const { id } = await params;

    const usuario = await resolverUsuario(req);
    if (!usuario) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { comentario } = await req.json();

    const aprobacion = await prisma.aprobacion.findUnique({
      where: { id },
      include: { visita: true },
    });

    if (!aprobacion) {
      return NextResponse.json({ error: "Aprobación no encontrada" }, { status: 404 });
    }

    if (aprobacion.estado !== EstadoAprobacion.pendiente) {
      return NextResponse.json({ error: "La aprobación ya fue procesada" }, { status: 400 });
    }

    const [updated] = await prisma.$transaction(async (tx) => {
      const updated = await tx.aprobacion.update({
        where: { id },
        data: {
          estado: EstadoAprobacion.rechazado,
          comentario: comentario || null,
        },
      });

      await tx.historialAprobacion.create({
        data: {
          aprobacionId: id,
          usuarioId: usuario.id,
          estadoAnterior: EstadoAprobacion.pendiente,
          estadoNuevo: EstadoAprobacion.rechazado,
          comentario: comentario || null,
        },
      });

      if (aprobacion.rol === "vicepresidencia") {
        const afectadas = await tx.aprobacion.findMany({
          where: {
            visitaId: aprobacion.visitaId,
            rol: { in: ["tiquetes", "transporte"] },
            estado: EstadoAprobacion.pendiente,
          },
        });

        if (afectadas.length > 0) {
          await tx.aprobacion.updateMany({
            where: {
              id: { in: afectadas.map((a) => a.id) },
            },
            data: { estado: EstadoAprobacion.rechazado },
          });

          await tx.historialAprobacion.createMany({
            data: afectadas.map((a) => ({
              aprobacionId: a.id,
              usuarioId: usuario.id,
              estadoAnterior: a.estado,
              estadoNuevo: EstadoAprobacion.rechazado,
              comentario: "Rechazo en cascada por vicepresidencia",
            })),
          });
        }
      }

      await tx.visita.update({
        where: { id: aprobacion.visitaId },
        data: { estado: EstadoVisita.rechazada },
      });

      return [updated];
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (err) {
    console.error("Error al rechazar:", err);
    return NextResponse.json({ error: "Error al rechazar" }, { status: 500 });
  }
}
