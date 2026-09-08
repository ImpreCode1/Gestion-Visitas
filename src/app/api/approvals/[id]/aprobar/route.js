/**
 * @fileoverview Endpoint para registrar la aprobación de una solicitud de visita.
 * Soporta dos modos:
 *  - Interno: aprobación desde el sistema (con comentario). La validación JWT de
 *    sesión está deshabilitada (PRY-19); la identidad se resuelve con
 *    `resolverUsuario` (cabecera X-User-Email o fallback).
 *  - Externo: aprobación directa desde link con token JWT (sin autenticación).
 *
 * IMPORTANTE: GET solo valida, POST procesa la aprobación.
 */

import { NextResponse } from "next/server";
import { PrismaClient, EstadoVisita, EstadoAprobacion } from "@prisma/client";
import { jwtVerify } from "jose";
import { resolverUsuario } from "../../../../../lib/currentUser";

const prisma = new PrismaClient();
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

/**
 * GET - Solo valida el token del link externo y redirige al formulario.
 * No realiza ninguna actualización en la base de datos.
 * (El token del link se conserva: es el mecanismo del flujo de aprobación por
 * correo, independiente de la autenticación de sesión.)
 */
export async function GET(req, context) {
  const params = await context.params;
  const url = new URL(req.url);
  const token = url.searchParams.get("token");

  // Si no hay token, es un acceso inválido
  if (!token) {
    return NextResponse.redirect(
      `${req.nextUrl.origin}/confirmacion?estado=error`
    );
  }

  try {
    // Verificar el token
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const aprobacionId = payload.aprobacionId;

    if (!aprobacionId) {
      return NextResponse.redirect(
        `${req.nextUrl.origin}/confirmacion?estado=error`
      );
    }

    // Solo verificar que la aprobación existe y está pendiente
    const aprobacion = await prisma.aprobacion.findUnique({
      where: { id: aprobacionId },
    });

    if (!aprobacion) {
      return NextResponse.redirect(
        `${req.nextUrl.origin}/confirmacion?estado=error`
      );
    }

    // Si ya fue procesada, redirigir con estado "usado"
    if (aprobacion.estado !== EstadoAprobacion.pendiente) {
      console.warn("⚠️ Intento de reusar link ya gestionado:", aprobacionId);
      return NextResponse.redirect(
        `${req.nextUrl.origin}/confirmacion?estado=usado`
      );
    }

    console.log("✅ Token válido, redirigiendo al formulario. ID:", aprobacionId);

    // Redirigir al formulario SIN procesar la aprobación
    return NextResponse.redirect(
      `${req.nextUrl.origin}/confirmacion?token=${token}&id=${aprobacionId}`
    );

  } catch (error) {
    console.error("❌ Token inválido o expirado:", error);
    return NextResponse.redirect(
      `${req.nextUrl.origin}/confirmacion?estado=expirado`
    );
  }
}

/**
 * POST - Procesa la aprobación desde el sistema (sin validación JWT de sesión).
 * La identidad del usuario se resuelve con `resolverUsuario`.
 */
export async function POST(req, context) {
  const params = await context.params;

  try {
    const id = parseInt(params.id);

    const usuario = await resolverUsuario(req);
    if (!usuario) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { comentario } = await req.json();

    const aprobacion = await prisma.aprobacion.findUnique({
      where: { id },
      include: { visita: true },
    });

    if (!aprobacion) {
      return NextResponse.json({ error: "Aprobación no encontrada" }, { status: 404 });
    }

    if (aprobacion.estado !== EstadoAprobacion.pendiente) {
      return NextResponse.json({ error: "La aprobación ya fue procesada" }, { status: 400 });
    }

    const [updated] = await prisma.$transaction(async (tx) => {
      const updated = await tx.aprobacion.update({
        where: { id },
        data: {
          estado: EstadoAprobacion.aprobado,
          comentario: comentario || null,
        },
      });

      await tx.historialAprobacion.create({
        data: {
          aprobacionId: id,
          usuarioId: usuario.id,
          estadoAnterior: EstadoAprobacion.pendiente,
          estadoNuevo: EstadoAprobacion.aprobado,
          comentario: comentario || null,
        },
      });

      const todas = await tx.aprobacion.findMany({
        where: { visitaId: aprobacion.visitaId },
      });

      const todasAprobadas = todas.every((a) => a.estado === EstadoAprobacion.aprobado);

      if (todasAprobadas) {
        await tx.visita.update({
          where: { id: aprobacion.visitaId },
          data: { estado: EstadoVisita.aprobada },
        });
      }

      return [updated];
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (err) {
    console.error("Error al aprobar:", err);
    return NextResponse.json({ error: "Error al aprobar" }, { status: 500 });
  }
}