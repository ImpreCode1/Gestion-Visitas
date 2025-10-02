// app/api/reportes/visitas-por-mes/route.js
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  const data = await prisma.visita.findMany({
    select: { fecha_ida: true, estado: true },
  });

  // agrupamos por mes/año
  const conteo = {};
  data.forEach(v => {
    const key = `${v.fecha_ida.getFullYear()}-${v.fecha_ida.getMonth() + 1}`;
    if (!conteo[key]) conteo[key] = { mes: key, programadas: 0, completadas: 0 };
    conteo[key].programadas++;
    if (v.estado === "completada") conteo[key].completadas++;
  });

  return Response.json(Object.values(conteo));
}
