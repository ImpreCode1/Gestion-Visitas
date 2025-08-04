import { NextResponse } from "next/server";

export async function POST() {
    const response = NextResponse.json({ success: true }, { status: 200 });
    
    // Eliminar las cookies de token y refreshToken
    response.cookies.delete("token", { path: "/" });
    response.cookies.delete("refreshToken", { path: "/" });
    response.cookies.delete("x-role", { path: "/" });
    response.cookies.delete("x-user", { path: "/" });  

    return response;
}
