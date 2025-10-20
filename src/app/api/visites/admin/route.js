/**
 * @fileoverview Endpoint para obtener todas las visitas registradas en el sistema (vista de administrador).
 * Incluye detalles de gerente, facturas, archivos y aprobaciones asociadas, ordenadas por fecha de creación.
 */

import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Obtiene todas las visitas con sus datos relacionados para el panel administrativo.
 *
 * @async
 * @returns {Promise<Response>} Respuesta JSON con la lista completa de visitas o un mensaje de error.
 */
export async function GET() {
  try {
    // Consulta todas las visitas con sus relaciones
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

    // Mapea los resultados para estructurarlos en un formato más claro para el administrador
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
      gastos_viaje: v.gastos_viaje,
    }));

    // Retorna la respuesta estructurada
    return NextResponse.json({ ok: true, visitas: data });
  } catch (error) {
    console.error("Error al obtener visitas admin:", error);
    return NextResponse.json(
      { ok: false, error: "Error al obtener visitas" },
      { status: 500 }
    );
  }
}
