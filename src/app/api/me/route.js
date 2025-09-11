import { NextResponse } from "next/server";
import { jwtVerify } from "jose"; // Librería para verificar JWTs

// Creamos un encoder y codificamos el secreto de acceso para verificar el JWT
const encoder = new TextEncoder();
const accessSecret = encoder.encode(process.env.JWT_SECRET);

// Endpoint GET para obtener información del usuario autenticado
export async function GET(request) {
  // Obtenemos el token de acceso desde la cookie
  const token = request.cookies.get("token")?.value;

  // Si no hay token, retornamos 401 Unauthorized
  if (!token) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    // Verificamos el token JWT usando el secreto
    const { payload } = await jwtVerify(token, accessSecret);

    // Retornamos la información del usuario que viene dentro del payload
    return NextResponse.json({
      displayName: payload.displayName || "",
      email: payload.email || "",
      department: payload.department || "",
      title: payload.title || "",
      role: payload.role || "sinRol", // Usamos el rol que ya viene en el token
    });
  } catch (err) {
    // Si el token no es válido, retornamos 401 y mostramos el error en consola
    console.error("Token inválido:", err);
    return NextResponse.json({ error: "Token inválido" }, { status: 401 });
  }
}
