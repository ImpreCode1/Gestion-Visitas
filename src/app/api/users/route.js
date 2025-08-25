import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs"; // 👈 no olvides importar bcrypt

const prisma = new PrismaClient();

// GET obtener usuarios
export async function GET() {
  const users = await prisma.user.findMany();
  return NextResponse.json(users);
}

