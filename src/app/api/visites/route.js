import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { PrismaClient } from "@prisma/client";
import getTemplate from "../../../lib/emails";

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
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    // 🔹 Consultar visitas asociadas al gerente logueado
    let visitas = await prisma.visita.findMany({
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
        aprobaciones: {
          select: {
            id: true,
            rol: true,
            estado: true,
            comentario: true,
            createdAt: true,
          },
        },
        facturas: {
          select: {
            id: true,
            descripcion: true,
            montoTotal: true,
            archivos: {
              select: {
                id: true,
                nombre: true,
                url: true,
              },
            },
          },
        },
      },
      orderBy: { fecha_ida: "desc" },
    });

    // 🔹 Normalizar fechas a medianoche
    const normalizarFecha = (fecha) => {
      const f = new Date(fecha);
      f.setHours(0, 0, 0, 0);
      return f;
    };

    const hoy = normalizarFecha(new Date());

    // 🔹 Verificar y actualizar visitas vencidas
    for (const visita of visitas) {
      const fechaRegreso = normalizarFecha(visita.fecha_regreso);
      const fechaLimite = new Date(fechaRegreso);
      fechaLimite.setDate(fechaLimite.getDate() + 3);

      const noSubioFacturas = !visita.facturas || visita.facturas.length === 0;
      const yaPasoPlazo = hoy > fechaLimite;

      if (yaPasoPlazo && noSubioFacturas && visita.estado !== "completada") {
        // 🔹 Actualizar en BD
        await prisma.visita.update({
          where: { id: visita.id },
          data: { estado: "completada" },
        });

        // 🔹 Reflejar el cambio en el objeto que devolveremos
        visita.estado = "completada";
      }
    }

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
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    // 🔹 Verificar token y extraer email
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const email = payload.email;
    const area = payload.department;

    // 🔹 Buscar usuario en la DB
    const usuario = await prisma.user.findUnique({ where: { email } });
    if (!usuario) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
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
        fondos_fabrica: body.fondos_fabrica,
        ciudad_origen: body.ciudad_origen,
        estado: "pendiente",
        area,
        gastos_viaje: "",
      },
    });

    // ===============================
    // 🔹 Crear aprobaciones según tipo
    // ===============================
    let aprobaciones = [];

    if (body.requiereAvion === true) {
      // 🛫 Rama: requiere tiquetes aéreos
      aprobaciones = [
        { visitaId: nuevaVisita.id, rol: "vicepresidencia", estado: "pendiente" },
        { visitaId: nuevaVisita.id, rol: "tiquetes", estado: "pendiente" },
        { visitaId: nuevaVisita.id, rol: "transporte", estado: "pendiente" },
      ];

    } else if (body.fondos_fabrica === true) {
      // 💰 Rama: fondos de fábrica (flujo similar al de avión)
      aprobaciones = [
        { visitaId: nuevaVisita.id, rol: "notas_credito", estado: "pendiente" },
        { visitaId: nuevaVisita.id, rol: "tiquetes", estado: "pendiente" },
        { visitaId: nuevaVisita.id, rol: "transporte", estado: "pendiente" },
      ];

    } else {
      // 🚗 Rama: no avión / no fondos de fábrica
      aprobaciones = [
        { visitaId: nuevaVisita.id, rol: "suministros_internos", estado: "pendiente" },
      ];
    }

    await prisma.aprobacion.createMany({ data: aprobaciones });

    // =====================================
    // 🔹 Determinar destinatarios del correo
    // =====================================
    let destinatarios = [];

    if (body.requiereAvion === true) {
      // Vicepresidencia del área correspondiente
      const vp = await prisma.user.findFirst({
        where: { role: "vicepresidente", department: nuevaVisita.area },
      });
      if (vp) destinatarios = [vp.email];

    } else if (body.fondos_fabrica === true) {
      // Director de Activos Operativos
      const director = await prisma.user.findFirst({
        where: { role: "notas_credito" },
      });
      if (director) destinatarios = [director.email];

    } else {
      // Suministros Internos
      const suministros = await prisma.user.findMany({
        where: { role: "Internal Supply" },
      });
      destinatarios = suministros.map((s) => s.email);
    }

    // ==============================
    // 🔹 Plantilla del correo de aviso
    // ==============================
    const html = getTemplate("agendar", {
      usuario: usuario.name,
      cliente: nuevaVisita.cliente,
      ciudad: nuevaVisita.ciudad,
      pais: nuevaVisita.pais,
      ciudad_origen: nuevaVisita.ciudad_origen || "No especificada",
      personaVisita: nuevaVisita.personaVisita,
      motivo: nuevaVisita.motivo,
      fecha_ida: nuevaVisita.fecha_ida.toLocaleDateString(),
      fecha_regreso: nuevaVisita.fecha_regreso.toLocaleDateString(),
      requiereAvion: nuevaVisita.requiereAvion,
      area: nuevaVisita.area,
      fondos_fabrica: nuevaVisita.fondos_fabrica,
    });

    // 🔹 Enviar correo a los destinatarios
    if (destinatarios.length > 0) {
      try {
        await fetch(`${request.nextUrl.origin}/api/send-mail`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: destinatarios,
            subject: "Una solicitud para una nueva visita ha sido registrada",
            html,
          }),
        });
      } catch (mailError) {
        console.error("⚠️ Error al llamar a /api/send-mail:", mailError);
      }
    } else {
      console.warn("⚠️ No se encontraron destinatarios para esta visita");
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
