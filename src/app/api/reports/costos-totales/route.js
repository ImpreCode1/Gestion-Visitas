/**
 * @fileoverview Endpoint para obtener los costos totales y promedio de todas las facturas.
 * Utiliza agregaciones de Prisma para calcular la suma y el promedio del campo `montoTotal`.
 */

import { PrismaClient } from "@prisma/client";

// Inicializa Prisma Client para acceder a la base de datos
const prisma = new PrismaClient();

export async function GET() {
  // Calcula la suma total y el promedio de los montos registrados en facturas
  const totals = await prisma.factura.aggregate({
    _sum: { montoTotal: true },
    _avg: { montoTotal: true },
  });

  // Devuelve el total y el promedio (si no hay registros, retorna 0)
  return Response.json({
    total: totals._sum.montoTotal || 0,
    promedio: totals._avg.montoTotal || 0,
  });
}
