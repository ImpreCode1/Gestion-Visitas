import { NextResponse } from "next/server";

// Endpoint POST para cerrar sesión (logout)
export async function POST() {
    // Preparamos una respuesta JSON indicando éxito
    const response = NextResponse.json({ success: true }, { status: 200 });
    
    // 🔹 Eliminamos la cookie del token de acceso
    response.cookies.delete("token", { path: "/" });

    // 🔹 Eliminamos la cookie del refresh token
    response.cookies.delete("refreshToken", { path: "/" });

    // Retornamos la respuesta al cliente
    return response;
}
