/**
 * @fileoverview Endpoints para la gestión individual de usuarios.
 * Incluye la obtención de un usuario por ID (ignorando los eliminados) 
 * y la actualización de sus datos en la base de datos.
 */

import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

// Inicializamos Prisma y lo almacenamos globalmente para evitar múltiples instancias en modo desarrollo
const prisma = globalThis.__prismaClient || new PrismaClient();
if (!globalThis.__prismaClient) globalThis.__prismaClient = prisma;

/**
 * Obtiene un usuario por su ID, siempre que no esté marcado como eliminado.
 *
 * @async
 * @param {Request} request - Objeto de la solicitud HTTP.
 * @param {Object} params - Parámetros de la ruta.
 * @param {string} params.id - ID del usuario a consultar.
 * @returns {Promise<Response>} Respuesta JSON con el usuario encontrado o un mensaje de error.
 */
export async function GET(request, { params }) {
  const { id } = await params;
  const userId = parseInt(id, 10);

  // Validación básica del ID
  if (Number.isNaN(userId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  try {
    // Busca el usuario por ID, ignorando los eliminados (deletedAt != null)
    const user = await prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
    });

    if (!user)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

/**
 * Actualiza los datos de un usuario específico por su ID.
 * Ignora el campo `id` en el cuerpo de la petición para evitar errores de modificación de clave primaria.
 *
 * @async
 * @param {Request} request - Objeto de la solicitud HTTP con los datos a actualizar.
 * @param {Object} params - Parámetros de la ruta.
 * @param {string} params.id - ID del usuario a actualizar.
 * @returns {Promise<Response>} Respuesta JSON con el usuario actualizado o un mensaje de error.
 */
export async function PUT(request, { params }) {
  const { id } = await params;
  const userId = parseInt(id, 10);

  // Validación básica del ID
  if (Number.isNaN(userId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const data = await request.json();
  delete data.id; // Evita la modificación del ID

  try {
    // Actualiza el usuario en la base de datos
    const user = await prisma.user.update({ where: { id: userId }, data });
    return NextResponse.json(user);
  } catch (error) {
    console.error("Error updating user:", error);

    // Error Prisma P2025 → registro no encontrado
    if (error?.code === "P2025")
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
