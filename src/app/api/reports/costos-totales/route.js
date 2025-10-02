// app/api/reportes/costos-totales/route.js
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  const totals = await prisma.factura.aggregate({
    _sum: { montoTotal: true },
    _avg: { montoTotal: true },
  });

  return Response.json({
    total: totals._sum.montoTotal || 0,
    promedio: totals._avg.montoTotal || 0,
  });
}
