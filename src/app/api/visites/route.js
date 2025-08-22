import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

export async function POST(request) {
  const token = request.cookies.get("token")?.value;

  if (!token) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const email = payload.email;

    const usuario = await prisma.user.findUnique({ where: { email } });

    if (!usuario) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    const body = await request.json();

    const nuevaVisita = await prisma.visita.create({
      data: {
        gerente: {
          connect: { id: usuario.id }, // conecta con el gerente autenticado
        },
        clienteCodigo: body.clienteCodigo.toString(), // 👈 se guarda como string pero viene de un número
        cliente: body.cliente || "Sin nombre", // 👈 nombre ingresado manual
        direccion: body.direccion || "",
        ciudad: body.ciudad || "",
        pais: body.pais || "",
        contacto: body.contacto || "",
        telefono: body.telefono || "",
        personaVisita: body.personaVisita || "",
        motivo: body.motivo || "",
        fecha_ida: new Date(body.fecha_ida),
        fecha_regreso: new Date(body.fecha_regreso),
        lugar: body.lugar || "",
        estado: "pendiente",
      },
    });

    return NextResponse.json(nuevaVisita, { status: 201 });
  } catch (error) {
    console.error("Error al registrar visita:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
