import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient(); 
// Cliente de Prisma para interactuar con la base de datos

// Handler para la ruta POST /api/aprobaciones/[id]
// Actualiza una aprobación específica y la marca como "rechazada"
export async function POST(req, { params }) {
  try {
    // Obtenemos el comentario enviado en el body de la petición
    const { comentario } = await req.json();

    // Actualizamos la aprobación correspondiente al ID de la URL
    const aprobacion = await prisma.aprobacion.update({
      where: { id: parseInt(params.id) }, // ID tomado de los parámetros de la ruta
      data: {
        estado: "rechazado",    // Se cambia el estado a "rechazado"
        comentario,             // Se guarda el comentario proporcionado
        updatedAt: new Date(),  // Se actualiza la fecha de modificación
      },
    });

    // Retornamos la aprobación actualizada en formato JSON
    return NextResponse.json(aprobacion);
  } catch (err) {
    // Si ocurre un error, se muestra en consola y se devuelve un 500
    console.error(err);
    return NextResponse.json({ error: "Error al rechazar" }, { status: 500 });
  }
}
