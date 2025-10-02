import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function GET() {
  const visitas = await prisma.visita.findMany({
    select: { fecha_ida: true, fecha_regreso: true },
  });

  if (!visitas.length) return Response.json({ promedio: 0 });

  const totalDias = visitas.reduce((acc, v) => {
    const diff =
      (new Date(v.fecha_regreso) - new Date(v.fecha_ida)) /
      (1000 * 60 * 60 * 24); // diferencia en días
    return acc + diff;
  }, 0);

  const promedio = totalDias / visitas.length;

  return Response.json({ promedio });
}
