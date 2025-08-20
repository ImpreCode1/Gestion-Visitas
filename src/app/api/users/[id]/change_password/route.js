import { NextResponse } from "next/server";
import bcryptjs from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function PUT(request, context) {
  const params = await context.params; // 👈 await necesario
  const id = parseInt(params.id, 10);

  if (Number.isNaN(id)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  const { password } = await request.json();

  if (!password || typeof password !== "string" || password.length < 8) {
    return NextResponse.json({ error: "Contraseña inválida" }, { status: 400 });
  }

  try {
    const hashed = bcryptjs.hashSync(password, 10);

    const user = await prisma.user.update({
      where: { id },
      data: { password: hashed, changePassword: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    if (error.code === "P2025") {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }
    return NextResponse.json({ error: "Error al actualizar contraseña" }, { status: 500 });
  }
}
