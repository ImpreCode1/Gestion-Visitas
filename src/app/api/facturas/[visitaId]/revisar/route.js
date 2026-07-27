import { NextResponse } from "next/server";
import { PrismaClient, EstadoVisita, EstadoFactura } from "@prisma/client";
import { jwtVerify } from "jose";

const prisma = new PrismaClient();
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

export async function POST(req, context) {
  const params = await context.params;

  try {
    const visitaId = parseInt(params.visitaId);

    const token = req.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { payload } = await jwtVerify(token, JWT_SECRET);

    const usuario = await prisma.user.findFirst({
      where: { email: payload.email, deletedAt: null },
    });
    if (!usuario) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    if (usuario.role !== "notas_credito") {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
    }

    const { decision, comentario } = await req.json();

    if (decision !== "aprobada" && decision !== "rechazada") {
      return NextResponse.json(
        { error: "La decisión debe ser 'aprobada' o 'rechazada'" },
        { status: 400 }
      );
    }

    const factura = await prisma.factura.findUnique({
      where: { visitaId },
      include: { visita: true },
    });

    if (!factura) {
      return NextResponse.json(
        { error: "Factura no encontrada para esta visita" },
        { status: 404 }
      );
    }

    if (factura.estado !== EstadoFactura.pendiente) {
      return NextResponse.json(
        { error: "La factura ya fue revisada" },
        { status: 409 }
      );
    }

    const [facturaActualizada, visitaActualizada] = await prisma.$transaction(async (tx) => {
      const f = await tx.factura.update({
        where: { visitaId },
        data: {
          estado: decision,
          revisadoPorId: usuario.id,
          fechaRevision: new Date(),
          comentarioRevision: comentario || null,
        },
      });

      const v = await tx.visita.update({
        where: { id: visitaId },
        data: {
          estado: decision === "aprobada" ? EstadoVisita.completada : EstadoVisita.en_legalizacion,
        },
      });

      return [f, v];
    });

    return NextResponse.json(
      { success: true, factura: facturaActualizada, visita: visitaActualizada },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error al revisar factura:", err);
    return NextResponse.json({ error: "Error al revisar factura" }, { status: 500 });
  }
}
