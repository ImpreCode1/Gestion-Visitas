/**
 * @fileoverview Endpoint para obtener información del usuario actual.
 *
 * La validación JWT por sesión está deshabilitada en las rutas API (PRY-19).
 * La identidad se resuelve con `resolverUsuario` (cabecera X-User-Email o
 * fallback al primer usuario activo de la base de datos).
 */

import { NextResponse } from "next/server";
import { resolverUsuario } from "../../../lib/currentUser";

/**
 * Obtiene la información del usuario actual.
 *
 * @async
 * @param {Request} request - Objeto de la solicitud HTTP entrante.
 * @returns {Promise<Response>} Respuesta JSON con los datos del usuario o un
 * error 404 si no existe ningún usuario disponible.
 */
export async function GET(request) {
  const usuario = await resolverUsuario(request);

  if (!usuario) {
    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
  }

  return NextResponse.json({
    displayName: usuario.name || "",
    email: usuario.email || "",
    department: usuario.department || "",
    title: usuario.position || "",
    role: usuario.role || "sinRol",
  });
}
