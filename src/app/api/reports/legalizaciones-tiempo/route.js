// app/api/reportes/legalizaciones-tiempo/route.js
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();


export async function GET() {
  const facturas = await prisma.factura.findMany({
    include: { visita: true },
  });

  let enTiempo = 0;
  let total = facturas.length;

  facturas.forEach(f => {
    const limite = new Date(f.visita.fecha_regreso);
    limite.setDate(limite.getDate() + 3);
    if (f.createdAt <= limite) enTiempo++;
  });

  return Response.json({
    total,
    enTiempo,
    porcentaje: total > 0 ? (enTiempo / total) * 100 : 0,
  });
}
