import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { jwtVerify } from "jose";

const prisma = new PrismaClient();
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

export async function GET(req, context) {
  const params = await context.params;
  const url = new URL(req.url);
  const token = url.searchParams.get("token");

  try {
    if (token) {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      if (payload.aprobacionId.toString() !== params.id)
        return NextResponse.json({ error: "Token inválido" }, { status: 400 });
    }

    const aprobacion = await prisma.aprobacion.findUnique({
      where: { id: parseInt(params.id) },
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
