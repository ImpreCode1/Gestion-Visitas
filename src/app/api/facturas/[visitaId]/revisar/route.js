import { NextResponse } from "next/server";
import { PrismaClient, EstadoVisita, EstadoFactura } from "@prisma/client";
import { resolverUsuario } from "../../../../../lib/currentUser";

const prisma = new PrismaClient();

/**
 * Revisa la factura de una visita (aprobada o rechazada por notas de crédito).
 *
 * La validación JWT por sesión está deshabilitada (PRY-19). La identidad se
 * resuelve con `resolverUsuario` (cabecera X-User-Email o fallback).
 *
 * @async
 * @param {Request} req - Objeto de la solicitud HTTP entrante.
 * @param {Object} context - Contexto de la ruta.
 * @param {Promise<{visitaId: string}>} context.params - Promesa con el id de la visita.
 * @returns {Promise<Response>} Respuesta JSON con la factura y visita actualizadas.
 */
export async function POST(req, { params }) {
  try {
    const { visitaId } = await params;

    const usuario = await resolverUsuario(req);
    if (!usuario) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    if (usuario.role !== "notas_credito") {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
    }

    const { decision, comentario } = await req.json();

    if (decision !== "aprobada" && decision !== "rechazada") {
      return NextResponse.json(
        { error: "La decisión debe ser 'aprobada' o 'rechazada'" },
        { status: 400 }
      );
    }

    const factura = await prisma.factura.findUnique({
      where: { visitaId },
      include: { visita: true },
    });

    if (!factura) {
      return NextResponse.json(
        { error: "Factura no encontrada para esta visita" },
        { status: 404 }
      );
    }

    if (factura.estado !== EstadoFactura.pendiente) {
      return NextResponse.json(
        { error: "La factura ya fue revisada" },
        { status: 409 }
      );
    }

    const [facturaActualizada, visitaActualizada] = await prisma.$transaction(async (tx) => {
      const f = await tx.factura.update({
        where: { visitaId },
        data: {
          estado: decision,
          revisadoPorId: usuario.id,
          fechaRevision: new Date(),
          comentarioRevision: comentario || null,
        },
      });

      const v = await tx.visita.update({
        where: { id: visitaId },
        data: {
          estado: decision === "aprobada" ? EstadoVisita.completada : EstadoVisita.en_legalizacion,
        },
      });

      return [f, v];
    });

    return NextResponse.json(
      { success: true, factura: facturaActualizada, visita: visitaActualizada },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error al revisar factura:", err);
    return NextResponse.json({ error: "Error al revisar factura" }, { status: 500 });
  }
}
