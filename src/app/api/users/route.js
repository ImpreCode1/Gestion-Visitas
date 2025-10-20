/**
 * @fileoverview Endpoint para obtener la lista completa de usuarios registrados en el sistema.
 * Utiliza Prisma ORM para consultar la base de datos y devolver los resultados en formato JSON.
 */

import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient(); // Inicializa el cliente de Prisma para interactuar con la base de datos

export async function GET() {
  // Consulta todos los usuarios existentes en la tabla 'user'
  const users = await prisma.user.findMany();

  // Retorna la lista completa de usuarios en formato JSON
  return NextResponse.json(users);
}
