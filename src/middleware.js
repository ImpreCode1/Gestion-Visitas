// middleware.js
import { NextResponse } from "next/server";
import { jwtVerify, SignJWT } from "jose";

const encoder = new TextEncoder();
const accessSecret = encoder.encode(process.env.JWT_SECRET);
const refreshSecret = encoder.encode(process.env.JWT_REFRESH_SECRET);

const ACCESS_TOKEN_EXP = 60 * 15; // segundos para probar rápido

function setAccessCookie(res, token) {
  res.cookies.set("token", token, {
    httpOnly: true,
    secure: false,
    path: "/",
    maxAge: ACCESS_TOKEN_EXP,
    sameSite: "lax",
  });
}

function clearAuthCookies(res) {
  res.cookies.delete("token");
  res.cookies.delete("refreshToken");
}

async function tryVerifyAccess(token) {
  return jwtVerify(token, accessSecret);
}

async function tryVerifyRefresh(refreshToken) {
  return jwtVerify(refreshToken, refreshSecret);
}

async function mintAccessFromRefreshPayload(payload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${ACCESS_TOKEN_EXP}s`)
    .sign(accessSecret);
}

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  const token = request.cookies.get("token")?.value;
  const refreshToken = request.cookies.get("refreshToken")?.value;

  // --- /login y /: no dejar acceder si ya hay token ---
  if (pathname === "/login" || pathname === "/") {
    // Si no hay tokens, permitir acceso
    if (!token && !refreshToken) return NextResponse.next();

    // Si access token válido, redirigir a /dashboard
    if (token) {
      try {
        await tryVerifyAccess(token);
        return NextResponse.redirect(new URL("/agendar_visita", request.url));
      } catch {}
    }

    // Si refresh token válido, renovar access token y redirigir a /dashboard
    if (refreshToken) {
      try {
        const { payload } = await tryVerifyRefresh(refreshToken);
        const newAccess = await mintAccessFromRefreshPayload(payload);
        const res = NextResponse.redirect(new URL("/agendar_visita", request.url));
        setAccessCookie(res, newAccess);
        return res;
      } catch {
        return NextResponse.next();
      }
    }

    return NextResponse.next();
  }

  // --- Rutas protegidas ---
  if (!token) {
    if (!refreshToken) return NextResponse.redirect(new URL("/login", request.url));

    try {
      const { payload } = await tryVerifyRefresh(refreshToken);
      const newAccess = await mintAccessFromRefreshPayload(payload);
      const res = NextResponse.next();
      setAccessCookie(res, newAccess);
      return res;
    } catch {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  // Validar access token
  try {
    await tryVerifyAccess(token);
    return NextResponse.next();
  } catch {
    if (refreshToken) {
      try {
        const { payload } = await tryVerifyRefresh(refreshToken);
        const newAccess = await mintAccessFromRefreshPayload(payload);
        const res = NextResponse.next();
        setAccessCookie(res, newAccess);
        return res;
      } catch {
        return NextResponse.redirect(new URL("/login", request.url));
      }
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
