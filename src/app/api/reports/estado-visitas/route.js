/**
 * @fileoverview Endpoint para obtener la distribución de visitas según su estado.
 * Agrupa las visitas por el campo `estado` y devuelve el número total de registros en cada uno.
 */

import { PrismaClient } from "@prisma/client";

// Inicializa Prisma Client para consultas a la base de datos
const prisma = new PrismaClient();

export async function GET() {
  // Agrupa las visitas por estado y cuenta cuántas hay en cada categoría
  const estados = await prisma.visita.groupBy({
    by: ["estado"],
    _count: { id: true },
  });

  // Formatea los resultados en un arreglo con pares estado/valor
  const data = estados.map((e) => ({
    estado: e.estado,
    value: e._count.id,
  }));

  // Devuelve la información en formato JSON
  return Response.json(data);
}
