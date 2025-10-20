/**
 * @fileoverview Endpoint para registrar el rechazo de una aprobación.
 * Actualiza el estado de la aprobación y la visita asociada, y notifica al gerente por correo electrónico.
 */

import { NextResponse } from "next/server";
import { PrismaClient, EstadoVisita } from "@prisma/client";
import getTemplate from "../../../../../lib/emails"; // Ajustar la ruta según la estructura del proyecto

// Inicializa Prisma Client
const prisma = new PrismaClient();

export async function POST(req, { params }) {
  try {
    // Obtiene el comentario del cuerpo de la solicitud
    const { comentario } = await req.json();

    // Actualiza la aprobación específica, marcándola como rechazada
    // e incluye la información de la visita, el gerente y todas las aprobaciones relacionadas
    const aprobacion = await prisma.aprobacion.update({
      where: { id: parseInt(params.id) },
      data: {
        estado: "rechazado",
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

    // Si alguna de las aprobaciones de la visita está rechazada,
    // se actualiza el estado general de la visita como "rechazada"
    const algunaRechazada = aprobaciones.some((a) => a.estado === "rechazado");
    if (algunaRechazada) {
      await prisma.visita.update({
        where: { id: visita.id },
        data: { estado: EstadoVisita.rechazada },
      });
    }

    // Genera el cuerpo HTML del correo usando la plantilla correspondiente
    const html = getTemplate("rechazar", {
      usuario: visita.gerente.name,
      cliente: visita.cliente,
      motivo: visita.motivo,
      fecha_ida: new Date(visita.fecha_ida).toLocaleDateString(),
      fecha_regreso: new Date(visita.fecha_regreso).toLocaleDateString(),
      comentario,
    });

    // Envía el correo de notificación al gerente informando el rechazo
    await fetch(`${req.nextUrl.origin}/api/send-mail`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: [visita.gerente.email],
        subject: `Tu visita a ${visita.cliente} fue rechazada`,
        html,
      }),
    });

    // Retorna la aprobación actualizada como respuesta
    return NextResponse.json(aprobacion);
  } catch (err) {
    // Captura y registra errores en consola
    console.error("Error en /rechazar:", err);
    return NextResponse.json(
      { error: "Error al rechazar" },
      { status: 500 }
    );
  }
}
