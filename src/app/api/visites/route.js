import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

// ======================
// GET → traer visitas del usuario logueado
// ======================
export async function GET(request) {
  try {
    // 🔹 Obtener token JWT de la cookie
    const token = request.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // 🔹 Verificar token
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const email = payload.email;
    if (!email) {
      return NextResponse.json({ error: "Usuario no válido" }, { status: 400 });
    }

    // 🔹 Buscar al usuario en la DB
    const usuario = await prisma.user.findUnique({ where: { email } });
    if (!usuario) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    // 🔹 Consultar visitas asociadas al gerente logueado
    const visitas = await prisma.visita.findMany({
      where: { gerenteId: usuario.id },
      select: {
        id: true,
        cliente: true,
        motivo: true,
        fecha_ida: true,
        fecha_regreso: true,
        estado: true,
        ciudad: true,
        pais: true,
        personaVisita: true,
      },
      orderBy: { fecha_ida: "desc" },
    });

    return NextResponse.json(visitas, { status: 200 });
  } catch (error) {
    console.error("Error al obtener visitas:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

// ======================
// POST → crear nueva visita
// ======================
export async function POST(request) {
  const token = request.cookies.get("token")?.value;
  if (!token) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    // 🔹 Verificar token y extraer email
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const email = payload.email;

    // 🔹 Buscar usuario en la DB
    const usuario = await prisma.user.findUnique({ where: { email } });
    if (!usuario) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    const body = await request.json();

    // 🔹 Crear la visita
    const nuevaVisita = await prisma.visita.create({
      data: {
        gerente: { connect: { id: usuario.id } },
        clienteCodigo: body.clienteCodigo.toString(),
        cliente: body.cliente || "Sin nombre",
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
        requiereAvion: body.requiereAvion,
        estado: "pendiente",
      },
    });

    let aprobaciones = [];
    if (body.requiereAvion == true){
      aprobaciones = [
        { visitaId: nuevaVisita.id, rol: "vicepresidencia", estado: "pendiente" },
        { visitaId: nuevaVisita.id, rol: "tiquetes", estado: "pendiente" },
        { visitaId: nuevaVisita.id, rol: "transporte", estado: "pendiente" },
      ];
    }else{
      aprobaciones = [
        { visitaId: nuevaVisita.id, rol: "transporte", estado: "pendiente" },
      ];
    }

    await prisma.aprobacion.createMany({
      data: aprobaciones,
    });

    return NextResponse.json(nuevaVisita, { status: 201 });
  } catch (error) {
    console.error("Error al registrar visita:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}