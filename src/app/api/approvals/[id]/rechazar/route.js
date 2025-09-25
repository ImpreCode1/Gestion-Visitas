import { NextResponse } from "next/server";
import { PrismaClient, EstadoVisita } from "@prisma/client";
import getTemplate from "../../../../../lib/emails"; // 👈 ajusta la ruta según tu proyecto

const prisma = new PrismaClient();

export async function POST(req, { params }) {
  try {
    const { comentario } = await req.json();

    // 1️⃣ Actualizamos la aprobación e incluimos la visita con gerente y aprobaciones
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

    // 2️⃣ Regla de negocio: si alguna aprobación está rechazada, la visita queda rechazada
    const algunaRechazada = aprobaciones.some((a) => a.estado === "rechazado");

    if (algunaRechazada) {
      await prisma.visita.update({
        where: { id: visita.id },
        data: { estado: EstadoVisita.rechazada },
      });
    }

    // 3️⃣ Generamos el HTML del correo
    const html = getTemplate("rechazar", {
      usuario: visita.gerente.name,
      cliente: visita.cliente,
      motivo: visita.motivo,
      fecha_ida: new Date(visita.fecha_ida).toLocaleDateString(),
      fecha_regreso: new Date(visita.fecha_regreso).toLocaleDateString(),
      comentario,
    });

    // 4️⃣ Enviamos el correo al gerente
    await fetch(`${req.nextUrl.origin}/api/send-mail`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: [visita.gerente.email],
        subject: `Tu visita a ${visita.cliente} fue rechazada`,
        html,
      }),
    });

    return NextResponse.json(aprobacion);
  } catch (err) {
    console.error("❌ Error en /rechazar:", err);
    return NextResponse.json({ error: "Error al rechazar" }, { status: 500 });
  }
}
