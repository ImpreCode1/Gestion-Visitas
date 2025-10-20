/**
 * @fileoverview Endpoint para calcular el promedio de duración de las visitas.
 * Obtiene todas las visitas registradas y calcula la diferencia promedio en días
 * entre las fechas de ida y regreso.
 */

import { PrismaClient } from "@prisma/client";

// Inicializa el cliente de Prisma para interactuar con la base de datos
const prisma = new PrismaClient();

export async function GET() {
  // Obtiene las fechas de ida y regreso de todas las visitas
  const visitas = await prisma.visita.findMany({
    select: { fecha_ida: true, fecha_regreso: true },
  });

  // Si no existen visitas registradas, devuelve promedio 0
  if (!visitas.length) return Response.json({ promedio: 0 });

  // Calcula el total de días sumando la diferencia entre fecha de regreso e ida
  const totalDias = visitas.reduce((acc, v) => {
    const diff =
      (new Date(v.fecha_regreso) - new Date(v.fecha_ida)) /
      (1000 * 60 * 60 * 24); // Diferencia expresada en días
    return acc + diff;
  }, 0);

  // Calcula el promedio de duración de las visitas
  const promedio = totalDias / visitas.length;

  // Devuelve el promedio en formato JSON
  return Response.json({ promedio });
}
