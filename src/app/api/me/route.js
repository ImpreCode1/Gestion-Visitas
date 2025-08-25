import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

const encoder = new TextEncoder();
const accessSecret = encoder.encode(process.env.JWT_SECRET);

export async function GET(request) {
  const token = request.cookies.get("token")?.value;
  if (!token) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { payload } = await jwtVerify(token, accessSecret);

    return NextResponse.json({
      displayName: payload.displayName || "",
      email: payload.email || "",
      department: payload.department || "",
      title: payload.title || "",
      role: payload.role || "sinRol", // 👈 usamos el rol que ya viene en el token
    });
  } catch (err) {
    console.error("Token inválido:", err);
    return NextResponse.json({ error: "Token inválido" }, { status: 401 });
  }
}
