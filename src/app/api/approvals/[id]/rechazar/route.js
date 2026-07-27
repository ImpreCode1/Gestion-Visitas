import { NextResponse } from "next/server";
import { PrismaClient, EstadoAprobacion, EstadoVisita } from "@prisma/client";
import { jwtVerify } from "jose";

const prisma = new PrismaClient();
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

export async function POST(req, context) {
  const params = await context.params;

  try {
    const id = parseInt(params.id);

    const token = req.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { payload } = await jwtVerify(token, JWT_SECRET);

    const usuario = await prisma.user.findFirst({
      where: { email: payload.email, deletedAt: null },
    });
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
