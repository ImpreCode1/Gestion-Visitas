import { NextResponse } from "next/server";
import { PrismaClient, EstadoVisita } from "@prisma/client";
import getTemplate from "../../../../../lib/emails"; // 👈 ajusta según tu proyecto

const prisma = new PrismaClient();

export async function POST(req, context) {
  try {
    const { params } = context;
    const { comentario } = await req.json();

    // 1️⃣ Marcar la aprobación como aprobada
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
            aprobaciones: true,
          },
        },
      },
    });

    const visita = aprobacion.visita;
    const aprobaciones = visita.aprobaciones;

    // Helper para enviar correos
    const sendMail = async ({ to, subject, html }) => {
      await fetch(`${req.nextUrl.origin}/api/send-mail`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to, subject, html }),
      });
    };

    // 2️⃣ Caso: visita con 1 sola aprobación
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

    // (a) Vicepresidencia aprobó → notificar supply + procurement
    if (aprobacion.rol === "vicepresidencia") {
      // Obtener usuarios de internal supply y internal procurement desde la base de datos
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

      console.log("Correos a notificar:", correos);

      if (correos.length > 0) {
        const html = getTemplate("notificarSupplyProcurement", {
          cliente: visita.cliente,
          motivo: visita.motivo,
          fecha_ida: new Date(visita.fecha_ida).toLocaleDateString(),
          fecha_regreso: new Date(visita.fecha_regreso).toLocaleDateString(),
        });

        await sendMail({
          to: correos,
          subject: `Visita a ${visita.cliente} ha sido autorizada por vicepresidencia.`,
          html,
        });
      }
    }

    // (b) Todos aprobaron → aprobar visita y notificar solicitante
    if (todasAprobadas) {
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
