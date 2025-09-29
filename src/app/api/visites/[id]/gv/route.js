import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function PATCH(req, context) {
  try {
    const { params } = await context;
    const { id } = params;

    const { gastos_viaje } = await req.json();

    if (!gastos_viaje) {
      return NextResponse.json(
        { error: "El campo gastos_viaje es requerido" },
        { status: 400 }
      );
    }

    const visita = await prisma.visita.update({
      where: { id: parseInt(id, 10) },
      data: { gastos_viaje },
      include: {
        gerente: true,
        facturas: true,
        aprobaciones: true,
      },
    });

    return NextResponse.json({ ok: true, visita });
  } catch (error) {
    console.error("Error actualizando gastos_viaje:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
