import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

const encoder = new TextEncoder();
const accessSecret = encoder.encode(process.env.JWT_SECRET);

function determinarRol(title = "") {
  const t = title.toLowerCase();
  if (t.includes("product manager") || t.includes("gerente de producto") || t.includes("gerente producto") || t.includes("gte de pdto")) {
    return "gerenteProducto";
  } else if (t.includes("admin") || t.includes("administrador") || t.includes("director")) {
    return "admin";
  } else if (t.includes("aprobador") || t.includes("coordinador") || t.includes("team leader")) {
    return "aprobador";
  } else if (t.includes("trainee")) {
    return "trainee";
  } else {
    return "sinRol";
  }
}

export async function GET(request) {
  const token = request.cookies.get("token")?.value;
  if (!token) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { payload } = await jwtVerify(token, accessSecret);
    const title = payload.title || "";
    const role = determinarRol(title);

    return NextResponse.json({
      displayName: payload.displayName || "",
      email: payload.email || "",
      department: payload.department || "",
      title,
      role,
    });
  } catch (err) {
    console.error("Token inválido:", err);
    return NextResponse.json({ error: "Token inválido" }, { status: 401 });
  }
}
