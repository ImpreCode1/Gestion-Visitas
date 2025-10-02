// app/api/reportes/estado-visitas/route.js
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  const estados = await prisma.visita.groupBy({
    by: ["estado"],
    _count: { id: true },
  });

  const data = estados.map(e => ({
    estado: e.estado,
    value: e._count.id,
  }));

  return Response.json(data);
}
