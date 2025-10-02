// app/api/reportes/clientes-top/route.js
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  const clientes = await prisma.visita.groupBy({
    by: ["cliente"],
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: 5,
  });

  return Response.json(clientes.map(c => ({
    cliente: c.cliente,
    visitas: c._count.id,
  })));
}
