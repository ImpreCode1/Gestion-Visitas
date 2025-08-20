import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs"; // 👈 no olvides importar bcrypt

const prisma = new PrismaClient();

// GET obtener usuarios
export async function GET() {
  const users = await prisma.user.findMany();
  return NextResponse.json(users);
}

// POST crear un nuevo usuario
export async function POST(req) {
  try {
    const body = await req.json();
    console.log("Body recibido:", body); // 👈 usa la variable, no lo leas otra vez

    const { name, email, role, phone, position } = body;

    if (!name || !email) {
      return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 });
    }

    // Contraseña por defecto
    const defaultPassword = "Impre1234";
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role,
        position,
        phone,
        changePassword: true
      },
    });

    const { password, ...userWithoutPass } = user;
    return NextResponse.json(userWithoutPass, { status: 201 });
  } catch (error) {
    console.error("Error creando usuario:", error);
    return NextResponse.json({ error: "Error en el servidor" }, { status: 500 });
  }
}
