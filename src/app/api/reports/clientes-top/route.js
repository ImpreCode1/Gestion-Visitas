/**
 * @fileoverview Endpoint para obtener los 5 clientes con más visitas registradas.
 * Agrupa las visitas por cliente usando Prisma y devuelve los resultados ordenados
 * de mayor a menor cantidad de visitas.
 */

import { PrismaClient } from "@prisma/client";

// Inicializa el cliente de Prisma para interactuar con la base de datos
const prisma = new PrismaClient();

export async function GET() {
  // Agrupa las visitas por cliente y cuenta cuántas tiene cada uno
  const clientes = await prisma.visita.groupBy({
    by: ["cliente"],
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: 5, // Limita el resultado a los 5 primeros clientes
  });

  // Devuelve los resultados formateados como JSON
  return Response.json(
    clientes.map((c) => ({
      cliente: c.cliente,
      visitas: c._count.id,
    }))
  );
}
