import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client"
const prisma = new PrismaClient();

export async function POST(req, { params }) {
  try {
    const { comentario } = await req.json();

    const aprobacion = await prisma.aprobacion.update({
      where: { id: parseInt(params.id) },
      data: {
        estado: "rechazado",
        comentario,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(aprobacion);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Error al rechazar" }, { status: 500 });
  }
}
