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

    await jwtVerify(token, JWT_SECRET);

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

    const updated = await prisma.aprobacion.update({
      where: { id },
      data: {
        estado: EstadoAprobacion.rechazado,
        comentario: comentario || null,
      },
    });

    if (aprobacion.rol === "vicepresidencia") {
      await prisma.aprobacion.updateMany({
        where: {
          visitaId: aprobacion.visitaId,
          rol: { in: ["tiquetes", "transporte"] },
          estado: EstadoAprobacion.pendiente,
        },
        data: { estado: EstadoAprobacion.rechazado },
      });
    }

    await prisma.visita.update({
      where: { id: aprobacion.visitaId },
      data: { estado: EstadoVisita.rechazada },
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (err) {
    console.error("Error al rechazar:", err);
    return NextResponse.json({ error: "Error al rechazar" }, { status: 500 });
  }
}
