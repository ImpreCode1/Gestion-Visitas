/**
 * @fileoverview Endpoint para obtener información del usuario autenticado.
 * Verifica el token JWT almacenado en cookies y devuelve los datos del usuario
 * incluidos en el payload del token.
 */

import { NextResponse } from "next/server";
import { jwtVerify } from "jose"; // Librería para verificar JWTs

// Codifica la clave secreta usada para firmar los tokens JWT
const encoder = new TextEncoder();
const accessSecret = encoder.encode(process.env.JWT_SECRET);

export async function GET(request) {
  // Obtiene el token de acceso desde las cookies del cliente
  const token = request.cookies.get("token")?.value;

  // Si no hay token, se responde con un estado 401 (no autorizado)
  if (!token) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    // Verifica la validez del token JWT utilizando la clave secreta
    const { payload } = await jwtVerify(token, accessSecret);

    // Devuelve los datos del usuario contenidos en el token
    return NextResponse.json({
      displayName: payload.displayName || "",
      email: payload.email || "",
      department: payload.department || "",
      title: payload.title || "",
      role: payload.role || "sinRol",
    });
  } catch (err) {
    // Si el token es inválido o ha expirado, devuelve un error 401
    console.error("Token inválido:", err);
    return NextResponse.json({ error: "Token inválido" }, { status: 401 });
  }
}
