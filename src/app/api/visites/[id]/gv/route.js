/**
 * @fileoverview Endpoint para actualizar el campo `gastos_viaje` de una visita específica.
 * Utiliza el método HTTP PATCH, actualizando solo el valor indicado y retornando la visita actualizada.
 */

import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Actualiza el campo `gastos_viaje` de una visita en la base de datos.
 *
 * @async
 * @param {Request} req - Objeto de la solicitud HTTP con el campo `gastos_viaje` en el cuerpo JSON.
 * @param {Object} context - Contexto con los parámetros de la ruta.
 * @param {Object} context.params - Parámetros dinámicos de la URL.
 * @param {string} context.params.id - ID de la visita a actualizar.
 * @returns {Promise<Response>} Respuesta JSON con la visita actualizada o un mensaje de error.
 */
export async function PATCH(req, context) {
  try {
    const { params } = await context;
    const { id } = params;

    // Extrae el valor de gastos_viaje del cuerpo de la solicitud
    const { gastos_viaje } = await req.json();

    // Valida que el campo requerido esté presente
    if (!gastos_viaje) {
      return NextResponse.json(
        { error: "El campo gastos_viaje es requerido" },
        { status: 400 }
      );
    }

    // Actualiza el campo en la base de datos y retorna la visita actualizada con sus relaciones
    const visita = await prisma.visita.update({
      where: { id: parseInt(id, 10) },
      data: { gastos_viaje },
      include: {
        gerente: true,
        facturas: true,
        aprobaciones: true,
      },
    });

    return NextResponse.json({ ok: true, visita });
  } catch (error) {
    console.error("Error actualizando gastos_viaje:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
