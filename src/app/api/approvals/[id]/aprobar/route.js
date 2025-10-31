/**
 * @fileoverview Endpoint para registrar la aprobación de una solicitud de visita.
 * Soporta dos modos:
 *  - Interno: aprobación desde el sistema autenticado (con comentario).
 *  - Externo: aprobación directa desde link con token JWT (sin autenticación).
 * 
 * IMPORTANTE: GET solo valida, POST procesa la aprobación.
 */

import { NextResponse } from "next/server";
import { PrismaClient, EstadoVisita, EstadoAprobacion } from "@prisma/client";
import { jwtVerify } from "jose";
import getTemplate from "../../../../../lib/emails";

const prisma = new PrismaClient();
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

/**
 * GET - Solo valida el token y redirige al formulario
 * No realiza ninguna actualización en la base de datos
 */
export async function GET(req, context) {
  const params = await context.params;
  const url = new URL(req.url);
  const token = url.searchParams.get("token");

  // Si no hay token, es un acceso inválido
  if (!token) {
    return NextResponse.redirect(
      `${req.nextUrl.origin}/confirmacion?estado=error`
    );
  }

  try {
    // Verificar el token
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const aprobacionId = payload.aprobacionId;

    if (!aprobacionId) {
      return NextResponse.redirect(
        `${req.nextUrl.origin}/confirmacion?estado=error`
      );
    }

    // Solo verificar que la aprobación existe y está pendiente
    const aprobacion = await prisma.aprobacion.findUnique({
      where: { id: aprobacionId },
    });

    if (!aprobacion) {
      return NextResponse.redirect(
        `${req.nextUrl.origin}/confirmacion?estado=error`
      );
    }

    // Si ya fue procesada, redirigir con estado "usado"
    if (aprobacion.estado !== EstadoAprobacion.pendiente) {
      console.warn("⚠️ Intento de reusar link ya gestionado:", aprobacionId);
      return NextResponse.redirect(
        `${req.nextUrl.origin}/confirmacion?estado=usado`
      );
    }

    console.log("✅ Token válido, redirigiendo al formulario. ID:", aprobacionId);

    // Redirigir al formulario SIN procesar la aprobación
    return NextResponse.redirect(
      `${req.nextUrl.origin}/confirmacion?token=${token}&id=${aprobacionId}`
    );

  } catch (error) {
    console.error("❌ Token inválido o expirado:", error);
    return NextResponse.redirect(
      `${req.nextUrl.origin}/confirmacion?estado=expirado`
    );
  }
}

/**
 * POST - Procesa la aprobación (con o sin token)
 */
export async function POST(req, context) {
  const params = await context.params;

  try {
    const url = new URL(req.url);
    const token = url.searchParams.get("token");

    let aprobacionId = parseInt(params.id);
    let comentario = null;

    // ==========================================================
    // 🔐 1. Verificar token si aplica
    // ==========================================================
    if (token) {
      try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        aprobacionId = payload.aprobacionId;

        if (!aprobacionId) {
          return NextResponse.redirect(
            `${req.nextUrl.origin}/confirmacion?id=${params.id}&estado=expirado`
          );
        }

        console.log("🔗 Aprobación vía link público para ID:", aprobacionId);
      } catch (error) {
        console.error("❌ Token inválido o expirado:", error);
        return NextResponse.redirect(
          `${req.nextUrl.origin}/confirmacion?id=${params.id}&estado=expirado`
        );
      }
    }

    // ==========================================================
    // 🧑‍💻 2. Leer comentario si se envió por formulario
    // ==========================================================
    try {
      const body = await req.json();
      comentario = body?.comentario || null;
    } catch {
      comentario = null;
    }

    // ==========================================================
    // 🔒 3. Actualizar con transacción para evitar doble procesamiento
    // ==========================================================
    const aprobacion = await prisma.$transaction(async (tx) => {
      // Verificar estado actual
      const aprobacionActual = await tx.aprobacion.findUnique({
        where: { id: aprobacionId },
      });

      if (!aprobacionActual) {
        throw new Error("NOT_FOUND");
      }

      // 🚫 Si ya fue gestionada → lanzar error
      if (aprobacionActual.estado !== EstadoAprobacion.pendiente) {
        console.warn("⚠️ Intento de reprocesar aprobación:", aprobacionId);
        throw new Error("ALREADY_PROCESSED");
      }

      // Actualizar la aprobación
      return await tx.aprobacion.update({
        where: { id: aprobacionId },
        data: {
          estado: EstadoAprobacion.aprobado,
          comentario,
          updatedAt: new Date(),
        },
        include: {
          visita: { include: { gerente: true } },
        },
      });
    });

    const visita = aprobacion.visita;

    // ==========================================================
    // 4. Cargar otras aprobaciones
    // ==========================================================
    const aprobaciones = await prisma.aprobacion.findMany({
      where: { visitaId: visita.id },
    });

    const roleMap = {
      vicepresidencia: "Vicepresidencia",
      tiquetes: "Compras Internas",
      transporte: "Suministros Internos",
      notas_credito: "Director de Activos Operativos",
    };

    const comentarios = aprobaciones
      .filter((a) => a.comentario?.trim())
      .map((a) => ({
        rol: roleMap[a.rol] ?? a.rol,
        comentario: a.comentario,
      }));

    // ==========================================================
    // 5. Helper para correos
    // ==========================================================
    const sendMail = async ({ to, subject, html }) => {
      await fetch(`${req.nextUrl.origin}/api/send-mail`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to, subject, html }),
      });
    };

    // ==========================================================
    // 6. LÓGICA PRINCIPAL SEGÚN EL ROL APROBADOR
    // ==========================================================

    // Caso A — Vicepresidencia aprueba (viaje con avión)
    if (aprobacion.rol === "vicepresidencia") {
      const usuariosInternos = await prisma.user.findMany({
        where: {
          OR: [
            { position: { contains: "internal supply" } },
            { position: { contains: "internal procurement" } },
          ],
        },
        select: { email: true },
      });

      const internos = usuariosInternos.map((u) => u.email);

      if (internos.length > 0) {
        const html = getTemplate("notificarSupplyProcurement", {
          usuario: visita.gerente.name,
          cliente: visita.cliente,
          motivo: visita.motivo,
          ciudad_origen: visita.ciudad_origen,
          ciudad: visita.ciudad,
          fecha_ida: new Date(visita.fecha_ida).toLocaleDateString(),
          fecha_regreso: new Date(visita.fecha_regreso).toLocaleDateString(),
          comentario: aprobacion.comentario ?? "",
        });

        await sendMail({
          to: internos,
          subject: `Gestión requerida: visita aprobada por Vicepresidencia (${visita.cliente})`,
          html,
        });
      }

      await prisma.visita.update({
        where: { id: visita.id },
        data: { estado: EstadoVisita.aprobada },
      });

      const htmlAprobado = getTemplate("aprobar", {
        usuario: visita.gerente.name,
        cliente: visita.cliente,
        motivo: visita.motivo,
        fecha_ida: new Date(visita.fecha_ida).toLocaleDateString(),
        fecha_regreso: new Date(visita.fecha_regreso).toLocaleDateString(),
        comentarios,
      });

      await sendMail({
        to: [visita.gerente.email],
        subject: `Tu visita a ${visita.cliente} fue aprobada`,
        html: htmlAprobado,
      });
    }

    // Caso B — Director de Activos Operativos aprueba (fondos de fábrica)
    else if (aprobacion.rol === "notas_credito") {
      const usuariosInternos = await prisma.user.findMany({
        where: {
          OR: [
            { position: { contains: "internal supply" } },
            { position: { contains: "internal procurement" } },
          ],
        },
        select: { email: true },
      });

      const internos = usuariosInternos.map((u) => u.email);

      if (internos.length > 0) {
        const html = getTemplate("notificarSupplyProcurement", {
          usuario: visita.gerente.name,
          cliente: visita.cliente,
          motivo: visita.motivo,
          ciudad_origen: visita.ciudad_origen,
          ciudad: visita.ciudad,
          fecha_ida: new Date(visita.fecha_ida).toLocaleDateString(),
          fecha_regreso: new Date(visita.fecha_regreso).toLocaleDateString(),
          comentario: aprobacion.comentario ?? "",
        });

        await sendMail({
          to: internos,
          subject: `Gestión requerida: visita aprobada por Director de Activos Operativos (${visita.cliente})`,
          html,
        });
      }

      await prisma.visita.update({
        where: { id: visita.id },
        data: { estado: EstadoVisita.aprobada },
      });

      const htmlAprobado = getTemplate("aprobar", {
        usuario: visita.gerente.name,
        cliente: visita.cliente,
        motivo: visita.motivo,
        fecha_ida: new Date(visita.fecha_ida).toLocaleDateString(),
        fecha_regreso: new Date(visita.fecha_regreso).toLocaleDateString(),
        comentarios,
      });

      await sendMail({
        to: [visita.gerente.email],
        subject: `Tu visita a ${visita.cliente} fue aprobada`,
        html: htmlAprobado,
      });
    }

    // Caso C — Suministros Internos aprueba (flujo sin avión ni fondos)
    else if (aprobacion.rol === "transporte") {
      // Solo se notifica si esta aprobación es la única existente
      if (aprobaciones.length === 1) {
        await prisma.visita.update({
          where: { id: visita.id },
          data: { estado: EstadoVisita.completada },
        });

        const htmlGestion = getTemplate("gestionRealizada", {
          usuario: visita.gerente.name,
          cliente: visita.cliente,
          motivo: visita.motivo,
          gestion: "Suministros Internos",
          fecha_ida: new Date(visita.fecha_ida).toLocaleDateString(),
          fecha_regreso: new Date(visita.fecha_regreso).toLocaleDateString(),
        });

        await sendMail({
          to: [visita.gerente.email],
          subject: `La gestión por parte de Suministros Internos ha sido realizada (${visita.cliente})`,
          html: htmlGestion,
        });
      }
    }

    // Caso D — Compras Internas aprueba (tiquetes)
    // Este caso se maneja en la verificación de "todas las aprobaciones"

    // ==========================================================
    // 7. Verificar si TODAS las aprobaciones están completas
    // ==========================================================
    const todasAprobadas =
      aprobaciones.length >= 3 &&
      aprobaciones.every((a) => a.estado === EstadoAprobacion.aprobado);

    if (todasAprobadas) {
      await prisma.visita.update({
        where: { id: visita.id },
        data: { estado: EstadoVisita.completada },
      });

      const htmlGestionFinal = getTemplate("gestionRealizada", {
        usuario: visita.gerente.name,
        cliente: visita.cliente,
        motivo: visita.motivo,
        gestion: "Suministros Internos y Compras Internas",
        fecha_ida: new Date(visita.fecha_ida).toLocaleDateString(),
        fecha_regreso: new Date(visita.fecha_regreso).toLocaleDateString(),
      });

      await sendMail({
        to: [visita.gerente.email],
        subject: `La gestión por parte de Suministros Internos y Compras Internas ha sido completada (${visita.cliente})`,
        html: htmlGestionFinal,
      });
    }

    // ==========================================================
    // 8. Redirección final
    // ==========================================================
    if (token) {
      return NextResponse.redirect(
        `${req.nextUrl.origin}/confirmacion?id=${params.id}&estado=aprobado`
      );
    }

    return NextResponse.json(aprobacion);

  } catch (err) {
    // Manejo específico de errores de procesamiento
    if (err.message === "ALREADY_PROCESSED") {
      const url = new URL(req.url);
      if (url.searchParams.get("token")) {
        return NextResponse.redirect(
          `${req.nextUrl.origin}/confirmacion?id=${params.id}&estado=usado`
        );
      }
      return NextResponse.json(
        { error: "Esta aprobación ya fue procesada" },
        { status: 409 }
      );
    }

    if (err.message === "NOT_FOUND") {
      const url = new URL(req.url);
      if (url.searchParams.get("token")) {
        return NextResponse.redirect(
          `${req.nextUrl.origin}/confirmacion?id=${params.id}&estado=error`
        );
      }
      return NextResponse.json(
        { error: "Aprobación no encontrada" },
        { status: 404 }
      );
    }

    console.error("🔥 Error al aprobar:", err);
    const url = new URL(req.url);
    if (url.searchParams.get("token")) {
      return NextResponse.redirect(
        `${req.nextUrl.origin}/confirmacion?estado=error`
      );
    }
    return NextResponse.json({ error: "Error al aprobar" }, { status: 500 });
  }
}