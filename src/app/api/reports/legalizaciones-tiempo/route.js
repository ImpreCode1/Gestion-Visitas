/**
 * @fileoverview Endpoint para calcular el porcentaje de legalizaciones realizadas a tiempo.
 * Se consideran "a tiempo" las facturas subidas dentro de los 3 días posteriores
 * a la fecha de regreso registrada en la visita.
 */

import { PrismaClient } from "@prisma/client";

// Inicializa el cliente de Prisma para consultar la base de datos
const prisma = new PrismaClient();

export async function GET() {
  // Obtiene todas las facturas junto con la información de su visita asociada
  const facturas = await prisma.factura.findMany({
    include: { visita: true },
  });

  let enTiempo = 0;
  const total = facturas.length;

  // Recorre las facturas y verifica si cada una fue cargada dentro del límite de 3 días
  facturas.forEach((f) => {
    const limite = new Date(f.visita.fecha_regreso);
    limite.setDate(limite.getDate() + 3); // Fecha límite permitida para subir facturas

    if (f.createdAt <= limite) enTiempo++; // Contabiliza las legalizaciones en tiempo
  });

  // Calcula el porcentaje de cumplimiento
  return Response.json({
    total,
    enTiempo,
    porcentaje: total > 0 ? (enTiempo / total) * 100 : 0,
  });
}
