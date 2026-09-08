import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Devuelve las visitas con gastos de viaje para sincronización con Control-Contable.
 *
 * La validación por token de servicio (JWT) se ha deshabilitado (PRY-19:
 * despliegue en plattstest sin Hydra IAM), por lo que el endpoint queda abierto.
 *
 * @async
 * @param {Request} request - Objeto de la solicitud HTTP entrante.
 * @returns {Promise<Response>} Respuesta JSON con los datos de gastos de viaje.
 */
export async function GET(request) {

  try {
    const { searchParams } = new URL(request.url);
    const desde = searchParams.get("desde");

    const where = {
      facturas: { isNot: null },
    };
    if (desde) {
      where.fecha_regreso = { gte: new Date(desde) };
    }

    const visitas = await prisma.visita.findMany({
      where,
      select: {
        id: true,
        gastos_viaje: true,
        tiquetes: true,
        alojamiento: true,
        alimentacion: true,
        otros_gastos: true,
        fecha_regreso: true,
        facturas: {
          select: {
            id: true,
            montoTotal: true,
          },
        },
      },
      orderBy: { fecha_regreso: "desc" },
    });

    const data = visitas.map((v) => ({
      visitaId: v.id,
      facturaId: v.facturas.id,
      montoTotal: v.facturas.montoTotal,
      gastos_viaje: v.gastos_viaje,
      tiquetes: v.tiquetes,
      alojamiento: v.alojamiento,
      alimentacion: v.alimentacion,
      otros_gastos: v.otros_gastos,
      fecha_regreso: v.fecha_regreso.toISOString(),
    }));

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Error en sync gastos-viaje:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}