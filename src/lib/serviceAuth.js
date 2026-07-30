import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

const SERVICE_TOKEN_SECRET = new TextEncoder().encode(
  process.env.SERVICE_TOKEN_SECRET
);

export async function verifyServiceToken(request) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json(
      { error: "Token de servicio requerido" },
      { status: 401 }
    );
  }

  const token = authHeader.slice(7);

  try {
    const { payload } = await jwtVerify(token, SERVICE_TOKEN_SECRET);
    if (payload.service !== "control-contable") {
      return NextResponse.json(
        { error: "Token de servicio inválido" },
        { status: 401 }
      );
    }
    return payload;
  } catch {
    return NextResponse.json(
      { error: "Token de servicio inválido o expirado" },
      { status: 401 }
    );
  }
}