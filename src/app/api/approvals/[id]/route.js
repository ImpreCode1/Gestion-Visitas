import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client"
const prisma = new PrismaClient();

export async function GET(req, { params }) {
  try {
    const aprobacion = await prisma.aprobacion.findUnique({
      where: { id: parseInt(params.id) },
    });

    if (!aprobacion) {
      return NextResponse.json({ error: "No encontrada" }, { status: 404 });
    }

    return NextResponse.json(aprobacion);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Error al obtener aprobación" }, { status: 500 });
  }
}
