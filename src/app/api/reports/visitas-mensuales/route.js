/**
 * @fileoverview Endpoint para obtener el número de visitas programadas y completadas por mes.
 * Agrupa las visitas según el mes y año de la fecha de ida (`fecha_ida`),
 * generando métricas mensuales para reportes de desempeño o visualización en dashboards.
 */

import { PrismaClient } from "@prisma/client";

// Inicializa Prisma Client para las consultas a la base de datos
const prisma = new PrismaClient();

export async function GET() {
  // Obtiene todas las visitas con su fecha de ida y estado actual
  const data = await prisma.visita.findMany({
    select: { fecha_ida: true, estado: true },
  });

  // Estructura auxiliar para agrupar por mes/año
  const conteo = {};

  data.forEach((v) => {
    // Crea una clave con formato "Año-Mes"
    const key = `${v.fecha_ida.getFullYear()}-${v.fecha_ida.getMonth() + 1}`;

    // Inicializa el registro del mes si no existe
    if (!conteo[key])
      conteo[key] = { mes: key, programadas: 0, completadas: 0 };

    // Incrementa el total de visitas programadas
    conteo[key].programadas++;

    // Incrementa las completadas si la visita está finalizada
    if (v.estado === "completada") conteo[key].completadas++;
  });

  // Devuelve el resumen mensual como arreglo
  return Response.json(Object.values(conteo));
}
