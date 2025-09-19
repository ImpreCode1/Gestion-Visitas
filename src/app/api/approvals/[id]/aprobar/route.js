import { NextResponse } from "next/server";
import { PrismaClient, EstadoVisita } from "@prisma/client";

const prisma = new PrismaClient();

// Handler para la ruta POST /api/approvals/[id]/aprobar
export async function POST(req, context) {
  try {
    const { params } = context;
    const { comentario } = await req.json();

    // 🔹 Marcar la aprobación como "aprobada"
    const aprobacion = await prisma.aprobacion.update({
      where: { id: parseInt(params.id) },
      data: {
        estado: "aprobado",
        comentario,
        updatedAt: new Date(),
      },
      include: {
        visita: {
          include: {
            aprobaciones: true,
          },
        },
      },
    });

    const visita = aprobacion.visita;
    const aprobaciones = visita.aprobaciones;

    // 🔹 Caso 1: si solo requiere una aprobación
    if (aprobaciones.length === 1) {
      if (aprobaciones[0].estado === "aprobado") {
        await prisma.visita.update({
          where: { id: visita.id },
          data: { estado: EstadoVisita.aprobada },
        });
      }
    } else {
      // 🔹 Caso 2: requiere varias aprobaciones
      const todasAprobadas = aprobaciones.every((a) => a.estado === "aprobado");

      if (todasAprobadas) {
        await prisma.visita.update({
          where: { id: visita.id },
          data: { estado: EstadoVisita.aprobada },
        });
      }
    }

    return NextResponse.json(aprobacion);
  } catch (err) {
    console.error("❌ Error al aprobar:", err);
    return NextResponse.json({ error: "Error al aprobar" }, { status: 500 });
  }
}
