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
    const token = request.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { payload } = await jwtVerify(token, JWT_SECRET);
    const email = payload.email;

    if (!email) {
      return NextResponse.json({ error: "Usuario no válido" }, { status: 400 });
    }

    // Buscar al usuario en la DB
    const usuario = await prisma.user.findUnique({ where: { email } });

    if (!usuario) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    // Consultar visitas del gerente logueado usando su id real en DB
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
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// ======================
// POST → crear nueva visita
// ======================
export async function POST(request) {
  const token = request.cookies.get("token")?.value;

  if (!token) {
    console.warn("Token no encontrado en la solicitud.");
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const email = payload.email;
    console.log("Email extraído del token:", email);

    const usuario = await prisma.user.findUnique({ where: { email } });
    if (!usuario) {
      console.warn("Usuario no encontrado en la base de datos:", email);
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    console.log("Usuario autenticado:", usuario.name, "| ID:", usuario.id);

    const body = await request.json();
    console.log("Datos recibidos para nueva visita:", body);

    // 1. Clasificar tipo de visita
    let tipoVisita;
    if (body.pais !== "Colombia") {
      tipoVisita = "internacional";
    } else if (body.ciudad === "Bogotá") {
      tipoVisita = "local";
    } else {
      tipoVisita = "nacional";
    }

    console.log("Tipo de visita clasificado como:", tipoVisita);

    // 2. Buscar aprobador (solo si no es internacional)
    let aprobador = null;
    if (tipoVisita !== "internacional") {
      aprobador = await prisma.user.findFirst({
        where: {
          role: "aprobador",
          tipoaprobador: tipoVisita,
        },
      });

      if (aprobador) {
        console.log(
          "Aprobador encontrado:",
          aprobador.name,
          "| ID:",
          aprobador.id
        );
      } else {
        console.warn("No se encontró aprobador para tipo:", tipoVisita);
      }
    }

    // 3. Crear la visita
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
        estado: "pendiente",
        aprobador: aprobador ? { connect: { id: aprobador.id } } : undefined,
      },
    });

    console.log("Visita creada con ID:", nuevaVisita.id);

    // 4. Crear registro de aprobación si hay aprobador
    if (aprobador) {
      console.log("Creando registro de aprobación...");
      await prisma.aprobacion.create({
        data: {
          visitaId: nuevaVisita.id,
          aprobadorId: aprobador.id,
          estado: "pendiente",
        },
      });
      console.log("Registro de aprobación creado correctamente.");
    }

    return NextResponse.json(nuevaVisita, { status: 201 });
  } catch (error) {
    console.error("Error al registrar visita:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
