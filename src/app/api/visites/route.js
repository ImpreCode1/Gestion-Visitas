/**
 * @fileoverview Endpoints para la gestión de visitas.
 * Incluye:
 * - GET: Obtiene las visitas asociadas al usuario autenticado, actualizando automáticamente aquellas vencidas.
 * - POST: Registra una nueva visita, crea las aprobaciones correspondientes y envía las notificaciones por correo.
 */

import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { PrismaClient } from "@prisma/client";
import getTemplate from "../../../lib/emails";

const prisma = new PrismaClient();
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

/**
 * Obtiene todas las visitas asociadas al usuario autenticado.
 * También marca como "completadas" aquellas visitas cuyo plazo para subir facturas ha vencido.
 *
 * @async
 * @param {Request} request - Objeto de la solicitud HTTP.
 * @returns {Promise<Response>} Respuesta JSON con la lista de visitas del usuario o un mensaje de error.
 */
export async function GET(request) {
  try {
    // Obtiene el token JWT desde la cookie
    const token = request.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Verifica el token y obtiene el email del usuario
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const email = payload.email;
    if (!email) {
      return NextResponse.json({ error: "Usuario no válido" }, { status: 400 });
    }

    // Busca el usuario en la base de datos
    const usuario = await prisma.user.findUnique({ where: { email } });
    if (!usuario) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    // Consulta las visitas asociadas al gerente logueado
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
              select: { id: true, nombre: true, url: true },
            },
          },
        },
      },
      orderBy: { fecha_ida: "desc" },
    });

    // Normaliza fechas a medianoche para comparar correctamente
    const normalizarFecha = (fecha) => {
      const f = new Date(fecha);
      f.setHours(0, 0, 0, 0);
      return f;
    };

    const hoy = normalizarFecha(new Date());

    // Verifica visitas vencidas y actualiza su estado a "completada"
    for (const visita of visitas) {
      const fechaRegreso = normalizarFecha(visita.fecha_regreso);
      const fechaLimite = new Date(fechaRegreso);
      fechaLimite.setDate(fechaLimite.getDate() + 3);

      const noSubioFacturas = !visita.facturas || visita.facturas.length === 0;
      const yaPasoPlazo = hoy > fechaLimite;

      if (yaPasoPlazo && noSubioFacturas && visita.estado !== "completada") {
        await prisma.visita.update({
          where: { id: visita.id },
          data: { estado: "completada" },
        });

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

/**
 * Registra una nueva visita asociada al usuario autenticado.
 * Crea las aprobaciones según el tipo de viaje (avión, fondos de fábrica o terrestre)
 * y notifica por correo electrónico a los responsables correspondientes.
 */
export async function POST(request) {
  const token = request.cookies.get("token")?.value;
  if (!token) {
    console.error("❌ Error: No se encontró el token en las cookies.");
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    // Verificar token y obtener datos del usuario
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const { email, department: area } = payload;

    const usuario = await prisma.user.findUnique({ where: { email } });
    if (!usuario) {
      console.error("❌ Error: Usuario no encontrado en base de datos:", email);
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    const body = await request.json();
    console.log("📩 Datos recibidos para nueva visita:", body);

    // Crear nueva visita
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
        tipoVisita: body.tipoVisita || "por_definir",
        otroTipo: body.otroTipo || null,
        motivo: body.motivo || "",
        descripcion: body.descripcion || "",
        proposito: body.proposito || "",
        oportunidadCRM: body.oportunidadCRM || "",
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

    console.log("✅ Visita creada correctamente con ID:", nuevaVisita.id);

    // Generar aprobaciones según el tipo de viaje
    let aprobaciones = [];

    if (body.requiereAvion === true) {
      aprobaciones = [
        {
          visitaId: nuevaVisita.id,
          rol: "vicepresidencia",
          estado: "pendiente",
        },
        { visitaId: nuevaVisita.id, rol: "tiquetes", estado: "pendiente" },
        { visitaId: nuevaVisita.id, rol: "transporte", estado: "pendiente" },
      ];
    } else if (body.fondos_fabrica === true) {
      aprobaciones = [
        { visitaId: nuevaVisita.id, rol: "notas_credito", estado: "pendiente" },
      ];
    } else {
      aprobaciones = [
        { visitaId: nuevaVisita.id, rol: "transporte", estado: "pendiente" },
      ];
    }

    await prisma.aprobacion.createMany({ data: aprobaciones });
    console.log(
      "🗂️ Aprobaciones creadas:",
      aprobaciones.map((a) => a.rol)
    );

    // Determinar destinatarios de correo
    let destinatarios = [];

    if (body.requiereAvion === true) {
      const vp = await prisma.user.findFirst({
        where: { role: "vicepresidente", department: nuevaVisita.area },
      });
      if (vp) destinatarios = [vp.email];
    } else if (body.fondos_fabrica === true) {
      const director = await prisma.user.findFirst({
        where: { role: "notas_credito" },
      });
      if (director) destinatarios = [director.email];
    } else {
      const transporte = await prisma.user.findMany({
        where: { role: "aprobador", tipoaprobador: "suministros" },
      });
      destinatarios = transporte.map((t) => t.email);
    }

    console.log("📧 Destinatarios del correo:", destinatarios);

    // Construir plantilla del correo
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

    // Enviar correo
    if (destinatarios.length > 0) {
      try {
        const response = await fetch(
          `${request.nextUrl.origin}/api/send-mail`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              to: destinatarios,
              subject: "Nueva solicitud de visita registrada",
              html,
            }),
          }
        );

        if (!response.ok) {
          console.error("❌ Error al enviar correo:", await response.text());
        } else {
          console.log("📨 Correo de notificación enviado correctamente");
        }
      } catch (mailError) {
        console.error("❌ Error en envío de correo:", mailError);
      }
    } else {
      console.warn("⚠️ No se encontraron destinatarios para esta visita.");
    }

    return NextResponse.json(nuevaVisita, { status: 201 });
  } catch (error) {
    console.error("🔥 Error inesperado al registrar visita:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
