import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient(); 
// Cliente de Prisma para interactuar con la base de datos

// Handler para la ruta POST /api/aprobaciones/[id]
// Este endpoint actualiza una aprobación específica, marcándola como "aprobada".
export async function POST(req, { params }) {
  try {
    // Extraemos el comentario enviado en el cuerpo de la petición
    const { comentario } = await req.json();

    // Actualizamos la aprobación correspondiente al ID recibido en la URL
    const aprobacion = await prisma.aprobacion.update({
      where: { id: parseInt(params.id) }, // ID tomado de los parámetros de la ruta
      data: {
        estado: "aprobado",       // Se cambia el estado a "aprobado"
        comentario,               // Se guarda el comentario proporcionado
        updatedAt: new Date(),    // Se actualiza la fecha de modificación
      },
    });

    // Retornamos la aprobación ya actualizada en formato JSON
    return NextResponse.json(aprobacion);
  } catch (err) {
    // Si ocurre un error, lo mostramos en consola y devolvemos un 500
    console.error(err);
    return NextResponse.json(
      { error: "Error al aprobar" }, 
      { status: 500 }
    );
  }
}
