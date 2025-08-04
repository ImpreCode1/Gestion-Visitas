import { NextResponse } from "next/server";
import { jwtVerify, SignJWT } from "jose";

// Clave secreta codificada
const encoder = new TextEncoder();
const accessSecret = encoder.encode(process.env.JWT_SECRET);
const refreshSecret = encoder.encode(process.env.JWT_REFRESH_SECRET);

const ACCESS_TOKEN_EXP = 3 * 60; // 3 minutos

export async function middleware(request) {
	const token = request.cookies.get("token")?.value;
	const refreshToken = request.cookies.get("refreshToken")?.value;

	if (!token) {
		console.log("❌ No hay token");
		return await manejarRenovacionToken(request, refreshToken);
	}

	try {
		const { payload } = await jwtVerify(token, accessSecret);
		console.log("✅ Token verificado");
		return NextResponse.next();
	} catch (error) {
		console.log("❌ Token inválido:", error.message);
		return NextResponse.redirect(new URL("/login", request.url));
	}
}

async function manejarRenovacionToken(request, refreshToken) {
	if (!refreshToken) {
		console.log("❌ No hay refresh token");
		return NextResponse.redirect(new URL("/login", request.url));
	}

	try {
		const { payload } = await jwtVerify(refreshToken, refreshSecret);

		const newAccessToken = await new SignJWT({
			id: payload.id,
			email: payload.email,
			role: payload.role,
		})
			.setProtectedHeader({ alg: "HS256" })
			.setIssuedAt()
			.setExpirationTime(`${ACCESS_TOKEN_EXP}s`)
			.sign(accessSecret);

		const response = NextResponse.next();

		response.cookies.set({
			name: "token",
			value: newAccessToken,
			httpOnly: true,
			secure: false,
			maxAge: ACCESS_TOKEN_EXP,
			path: "/",
		});

		console.log("🔄 Access Token renovado automáticamente");
		return response;
	} catch (err) {
		console.log("❌ Refresh token inválido:", err.message);
		return NextResponse.redirect(new URL("/login", request.url));
	}
}

export const config = {
	matcher: ["/agendar_visita"],
};
