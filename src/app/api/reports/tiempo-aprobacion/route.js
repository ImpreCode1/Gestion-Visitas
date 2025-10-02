// app/api/reportes/tiempo-aprobacion/route.js
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();


export async function GET() {
  const aprobaciones = await prisma.aprobacion.findMany({
    where: { estado: "aprobado" },
    include: { visita: true },
  });

  const tiempos = {};

  aprobaciones.forEach(a => {
    const diff = (a.fecha - a.visita.createdAt) / (1000 * 60 * 60 * 24); // en días
    if (!tiempos[a.rol]) tiempos[a.rol] = [];
    tiempos[a.rol].push(diff);
  });

  const promedio = Object.entries(tiempos).map(([rol, diffs]) => ({
    rol,
    promedioDias: diffs.reduce((a, b) => a + b, 0) / diffs.length,
  }));

  return Response.json(promedio);
}
