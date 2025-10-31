/**
 * @fileoverview Endpoint para registrar la aprobación de una solicitud de visita.
 * Soporta dos modos:
 *  - Interno: aprobación desde el sistema autenticado (con comentario).
 *  - Externo: aprobación directa desde link con token JWT (sin autenticación).
 */

import { NextResponse } from "next/server";
import { PrismaClient, EstadoVisita } from "@prisma/client";
import { jwtVerify } from "jose";
import getTemplate from "../../../../../lib/emails";

const prisma = new PrismaClient();
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

export async function GET(req, context) {
  // Reusar la misma lógica del POST
  return await POST(req, context);
}

export async function POST(req, context) {
  try {
    const { params } = context;
    const url = new URL(req.url);
    const token = url.searchParams.get("token");

    let aprobacionId = parseInt(params.id);
    let comentario = null;

    // ==========================================================
    // 🔐 1. Si viene con token (modo link público)
    // ==========================================================
    if (token) {
      try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        aprobacionId = payload.aprobacionId;

        if (!aprobacionId) {
          return NextResponse.json(
            { error: "Token inválido o incompleto" },
            { status: 400 }
          );
        }

        console.log("🔗 Aprobación vía link público para ID:", aprobacionId);
      } catch (error) {
        console.error("❌ Token inválido o expirado:", error);
        return NextResponse.json(
          { error: "Token inválido o expirado" },
          { status: 401 }
        );
      }
    }

    // ==========================================================
    // 🧑‍💻 2. Si no hay token, asumimos aprobación desde el sistema interno
    // ==========================================================
    if (!token) {
      const body = await req.json();
      comentario = body.comentario || "";
    }

    // ==========================================================
    // 3. Actualizar la aprobación
    // ==========================================================
    const aprobacion = await prisma.aprobacion.update({
      where: { id: aprobacionId },
      data: {
        estado: "aprobado",
        comentario,
        updatedAt: new Date(),
      },
      include: {
        visita: { include: { gerente: true } },
      },
    });

    const visita = aprobacion.visita;

    // ==========================================================
    // 4. Cargar todas las aprobaciones relacionadas
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
      .filter((a) => a.comentario && a.comentario.trim() !== "")
      .map((a) => ({
        rol: roleMap[a.rol] ?? a.rol,
        comentario: a.comentario,
      }));

    // ==========================================================
    // Helper para envío de correos
    // ==========================================================
    const sendMail = async ({ to, subject, html }) => {
      await fetch(`${req.nextUrl.origin}/api/send-mail`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to, subject, html }),
      });
    };

    // ==========================================================
    // 5. Lógica según el rol aprobador (sin cambios)
    // ==========================================================

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

    else if (aprobacion.rol === "transporte") {
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

    const todasAprobadas =
      aprobaciones.length >= 3 &&
      aprobaciones.every((a) => a.estado === "aprobado");

    if (todasAprobadas) {
      await prisma.visita.update({
        where: { id: visita.id },
        data: { estado: EstadoVisita.aprobada },
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
    // 6. Si vino desde el link, redirigir a una página de confirmación
    // ==========================================================
    if (token) {
      return NextResponse.redirect(`${req.nextUrl.origin}/confirmacion?estado=aprobado`);
    }

    // Caso normal: devolver JSON
    return NextResponse.json(aprobacion);

  } catch (err) {
    console.error("Error al aprobar:", err);
    return NextResponse.json({ error: "Error al aprobar" }, { status: 500 });
  }
}
