/**
 * @fileoverview Endpoint GET /api/aprobaciones/[id]
 * @description
 * Devuelve una aprobación específica según su identificador.
 * Utiliza Prisma Client para consultar la base de datos.
 */

import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

// Inicialización del cliente Prisma
const prisma = new PrismaClient();

export async function GET(req, { params }) {
  try {
    // Convierte el ID recibido en número entero para consulta
    const aprobacion = await prisma.aprobacion.findUnique({
      where: { id: parseInt(params.id) },
    });

    // Si no se encuentra el registro, retorna 404
    if (!aprobacion) {
      return NextResponse.json({ error: "No encontrada" }, { status: 404 });
    }

    // Retorna la aprobación encontrada en formato JSON
    return NextResponse.json(aprobacion);

  } catch (err) {
    // Captura y registra errores en consola
    console.error(err);
    return NextResponse.json(
      { error: "Error al obtener aprobación" },
      { status: 500 }
    );
  }
}
