import { NextResponse } from "next/server";
import { PrismaClient, EstadoVisita } from "@prisma/client";
import getTemplate from "../../../../../lib/emails";

const prisma = new PrismaClient();

export async function POST(req, context) {
  try {
    const { params } = context;
    const { comentario } = await req.json();

    // 1️⃣ Actualizar la aprobación con estado y comentario
    const aprobacion = await prisma.aprobacion.update({
      where: { id: parseInt(params.id) },
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

    // 🔄 Recargar todas las aprobaciones
    const aprobaciones = await prisma.aprobacion.findMany({
      where: { visitaId: visita.id },
    });

    // 🧭 Mapa de roles legibles
    const roleMap = {
      vicepresidencia: "Vicepresidencia",
      tiquetes: "Compras Internas",
      transporte: "Suministros Internos",
      notas_credito: "Director de Activos Operativos",
    };

    // 📝 Recolectar comentarios existentes
    const comentarios = aprobaciones
      .filter((a) => a.comentario && a.comentario.trim() !== "")
      .map((a) => ({
        rol: roleMap[a.rol] ?? a.rol,
        comentario: a.comentario,
      }));

    // 📬 Helper para enviar correos
    const sendMail = async ({ to, subject, html }) => {
      await fetch(`${req.nextUrl.origin}/api/send-mail`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to, subject, html }),
      });
    };

    // ==============================
    // 🔹 LÓGICA PRINCIPAL DE NOTIFICACIÓN
    // ==============================

    // Caso A — Vicepresidencia aprueba (viaje con avión)
    if (aprobacion.rol === "vicepresidencia") {
      // 1️⃣ Notificar Suministros + Compras para gestión interna
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

      // 2️⃣ Avisar al gerente que su visita fue aprobada
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
        subject: `Tu visita a ${visita.cliente} fue aprobada ✅`,
        html: htmlAprobado,
      });
    }

    // Caso B — Director de Activos Operativos aprueba (fondos de fábrica)
    else if (aprobacion.rol === "notas_credito") {
      // 1️⃣ Notificar Suministros + Compras
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

      // 2️⃣ Avisar al gerente
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
        subject: `Tu visita a ${visita.cliente} fue aprobada ✅`,
        html: htmlAprobado,
      });
    }

    // Caso C — Suministros Internos aprueba (flujo sin avión ni fondos)
    else if (aprobacion.rol === "transporte") {
      // ✅ Solo enviar el correo si esta es la única aprobación existente
      if (aprobaciones.length === 1) {
        await prisma.visita.update({
          where: { id: visita.id },
          data: { estado: EstadoVisita.aprobada },
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

    // Caso D — Todas las aprobaciones completadas (3 roles)
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

    return NextResponse.json(aprobacion);
  } catch (err) {
    console.error("❌ Error al aprobar:", err);
    return NextResponse.json({ error: "Error al aprobar" }, { status: 500 });
  }
}
