import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

// Clave secreta codificada
const secret = new TextEncoder().encode(process.env.JWT_SECRET);

export async function middleware(request) {
  const token = request.cookies.get("token")?.value;

  if (!token) {
    console.log("❌ No hay token");
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    const { payload } = await jwtVerify(token, secret);
    console.log("✅ Token verificado:", payload);
    return NextResponse.next();
  } catch (error) {
    console.log("❌ Token inválido:", error.message);
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

export const config = {
  matcher: ["/prueba"],
};
