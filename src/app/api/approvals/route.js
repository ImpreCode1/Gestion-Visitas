import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET /api/aprobaciones
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);

    const estado = searchParams.get("estado");
    const q = searchParams.get("q") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const perPage = parseInt(searchParams.get("perPage") || "10");

    const skip = (page - 1) * perPage;

    const where = {};

    if (estado && estado !== "todos") {
      where.estado = estado;
    }

    if (q.length > 0) {
      where.OR = [
        { visita: { is: { cliente: { contains: q } } } },
        { visita: { is: { ciudad: { contains: q } } } },
        { visita: { is: { gerente: { name: { contains: q } } } } },
      ];
    }

    const total = await prisma.aprobacion.count({ where });

    const rows = await prisma.aprobacion.findMany({
      where,
      skip,
      take: perPage,
      orderBy: { createdAt: "desc" },
      include: {
        visita: {
          include: {
            gerente: true,
          },
        },
        aprobador: true,
      },
    });

    return NextResponse.json({
      rows,
      total,
      page,
      perPage,
    });
  } catch (err) {
    console.error("❌ Error en GET /api/aprobaciones:", err);
    return NextResponse.json(
      { error: "Error al obtener aprobaciones" },
      { status: 500 }
    );
  }
}
