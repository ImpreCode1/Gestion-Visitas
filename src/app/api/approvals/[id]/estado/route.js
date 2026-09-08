import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Devuelve el estado de una aprobación.
 *
 * La validación JWT por sesión está deshabilitada (PRY-19), por lo que el
 * endpoint queda abierto sin verificación de token.
 *
 * @async
 * @param {Request} req - Objeto de la solicitud HTTP entrante.
 * @param {Object} context - Contexto de la ruta.
 * @param {Promise<{id: string}>} context.params - Promesa con el id de la aprobación.
 * @returns {Promise<Response>} Respuesta JSON con el estado de la aprobación.
 */
export async function GET(req, { params }) {
  try {
    const { id } = await params;

    const aprobacion = await prisma.aprobacion.findUnique({
      where: { id: parseInt(id) },
      select: { estado: true },
    });

    if (!aprobacion)
      return NextResponse.json({ error: "No encontrada" }, { status: 404 });

    return NextResponse.json({ estado: aprobacion.estado });
  } catch (err) {
    console.error("Error al verificar estado:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
