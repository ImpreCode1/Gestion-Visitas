/**
 * @fileoverview Endpoint para cerrar sesión del usuario.
 * Elimina las cookies de autenticación (token y refreshToken)
 * y retorna una respuesta de éxito al cliente.
 */

import { NextResponse } from "next/server";

export async function POST() {
  // Crea una respuesta JSON indicando que la operación fue exitosa
  const response = NextResponse.json({ success: true }, { status: 200 });
  
  // Elimina la cookie del token de acceso principal
  response.cookies.delete("token", { path: "/" });

  // Elimina la cookie del token de renovación (refreshToken)
  response.cookies.delete("refreshToken", { path: "/" });

  // Retorna la respuesta final al cliente
  return response;
}
