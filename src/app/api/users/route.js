import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient(); // Inicializamos Prisma

// Endpoint GET para obtener todos los usuarios
export async function GET() {
  // Obtenemos todos los usuarios de la base de datos
  const users = await prisma.user.findMany();

  // Retornamos los usuarios en formato JSON
  return NextResponse.json(users);
}
