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
        visita: {
          include: {
            gerente: true,
          },
        },
      },
    });

    // 🔄 Volver a cargar todas las aprobaciones de la visita (para tener comentarios actualizados)
    const aprobaciones = await prisma.aprobacion.findMany({
      where: { visitaId: aprobacion.visitaId },
    });

    const visita = await prisma.visita.findUnique({
      where: { id: aprobacion.visitaId },
      include: { gerente: true },
    });

    // Mapa de roles -> nombre legible
    const roleMap = {
      vicepresidencia: "Vicepresidencia",
      tiquetes: "Compras internas",
      transporte: "Suministros internos",
      notas_credito: "Notas Crédito",
    };

    // Construir lista de comentarios (solo los que tengan texto)
    const comentarios = aprobaciones
      .filter((a) => a.comentario && a.comentario.trim() !== "")
      .map((a) => ({
        rol: roleMap[a.rol] ?? a.rol,
        comentario: a.comentario,
      }));

    console.log("Comentarios a incluir en el correo:", comentarios);

    // Helper para enviar correos
    const sendMail = async ({ to, subject, html }) => {
      await fetch(`${req.nextUrl.origin}/api/send-mail`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to, subject, html }),
      });
    };

    // 2️⃣ Caso: visita con 1 sola aprobación (solo 1 aprobador en total)
    if (aprobaciones.length === 1) {
      await prisma.visita.update({
        where: { id: visita.id },
        data: { estado: EstadoVisita.aprobada },
      });

      const html = getTemplate("aprobar", {
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
        html,
      });

      return NextResponse.json(aprobacion);
    }

    // 3️⃣ Caso: varias aprobaciones
    const todasAprobadas = aprobaciones.every((a) => a.estado === "aprobado");

    // (a) Vicepresidencia aprobó → notificar supply + procurement (solo el comentario de vicepresidencia)
    if (aprobacion.rol === "vicepresidencia") {
      const usuarios = await prisma.user.findMany({
        where: {
          OR: [
            { position: { contains: "internal supply" } },
            { position: { contains: "internal procurement" } },
          ],
        },
        select: { email: true },
      });

      const correos = usuarios.map((u) => u.email);

      if (correos.length > 0) {
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
          to: correos,
          subject: `Visita a ${visita.cliente} ha sido autorizada por vicepresidencia.`,
          html,
        });
      }
    } else if (aprobacion.rol === "notas_credito") {
      const usuarios = await prisma.user.findMany({
        where: {
          OR: [
            { position: { contains: "internal supply" } },
            { position: { contains: "internal procurement" } },
          ],
        },
        select: { email: true },
      });

      const correos = usuarios.map((u) => u.email);

      if (correos.length > 0) {
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
          to: correos,
          subject: `Visita a ${visita.cliente} ha sido autorizada por el Director de Activos Operativos.`,
          html,
        });
      }
    }

    // (b) Todos aprobaron → aprobar visita y notificar solicitante con TODOS los comentarios mapeados
    if (todasAprobadas) {
      await prisma.visita.update({
        where: { id: visita.id },
        data: { estado: EstadoVisita.aprobada },
      });

      // (recalcular comentarios por si cambió algo)
      const comentariosFinales = aprobaciones
        .filter((a) => a.comentario && a.comentario.trim() !== "")
        .map((a) => ({
          rol: roleMap[a.rol] ?? a.rol,
          comentario: a.comentario,
        }));

      console.log("Comentarios finales enviados al solicitante:", comentariosFinales);

      const html = getTemplate("aprobar", {
        usuario: visita.gerente.name,
        cliente: visita.cliente,
        motivo: visita.motivo,
        fecha_ida: new Date(visita.fecha_ida).toLocaleDateString(),
        fecha_regreso: new Date(visita.fecha_regreso).toLocaleDateString(),
        comentarios: comentariosFinales,
      });

      await sendMail({
        to: [visita.gerente.email],
        subject: `Tu visita a ${visita.cliente} fue aprobada`,
        html,
      });
    }

    return NextResponse.json(aprobacion);
  } catch (err) {
    console.error("❌ Error al aprobar:", err);
    return NextResponse.json({ error: "Error al aprobar" }, { status: 500 });
  }
}
