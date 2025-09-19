import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const visitas = await prisma.visita.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        gerente: {
          select: { id: true, name: true, email: true, role: true },
        },
        facturas: {
          include: {
            archivos: {
              select: { id: true, nombre: true, url: true, createdAt: true },
            },
          },
        },
        aprobaciones: {
          select: {
            id: true,
            rol: true,
            estado: true,
            comentario: true,
            fecha: true,
          },
        },
      },
    });

    // Mapeamos la respuesta para darle formato al admin
    const data = visitas.map((v) => ({
      id: v.id,
      cliente: v.cliente,
      clienteCodigo: v.clienteCodigo,
      motivo: v.motivo,
      lugar: v.lugar,
      fecha_ida: v.fecha_ida,
      fecha_regreso: v.fecha_regreso,
      estado: v.estado,
      gerente: v.gerente,
      tieneFacturas: !!v.facturas,
      facturas: v.facturas
        ? {
            id: v.facturas.id,
            descripcion: v.facturas.descripcion,
            montoTotal: v.facturas.montoTotal,
            archivos: v.facturas.archivos,
          }
        : null,
      aprobaciones: v.aprobaciones,
      createdAt: v.createdAt,
    }));

    return NextResponse.json({ ok: true, visitas: data });
  } catch (error) {
    console.error("Error al obtener visitas admin:", error);
    return NextResponse.json(
      { ok: false, error: "Error al obtener visitas" },
      { status: 500 }
    );
  }
}
