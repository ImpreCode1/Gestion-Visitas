// middleware.js
import { NextResponse } from "next/server";
import { jwtVerify, SignJWT } from "jose";

const encoder = new TextEncoder();
const accessSecret = encoder.encode(process.env.JWT_SECRET);
const refreshSecret = encoder.encode(process.env.JWT_REFRESH_SECRET);

// segundos (deja 10s para probar rápido)
const ACCESS_TOKEN_EXP = 10;

const HOMES = {
  admin: "/usuarios",
  gerente: "/agendar_visita",
  aprobador: "/aprobaciones",
};

function getHomeByRole(role) {
  return HOMES[role] ?? "/login";
}

function isProtectedPath(pathname) {
  return (
    pathname.startsWith("/usuarios") ||
    pathname.startsWith("/agendar_visita") ||
    pathname.startsWith("/aprobaciones")
  );
}

function setPublicCookies(res, payload) {
  const role = payload?.role ?? "";
  const user = payload?.email ?? payload?.id ?? "";
  // cookies "públicas"
  res.cookies.set("x-role", String(role), { httpOnly: false, path: "/" });
  res.cookies.set("x-user", String(user), { httpOnly: false, path: "/" });
}

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
  res.cookies.delete("x-role");
  res.cookies.delete("x-user");
}

async function tryVerifyAccess(token) {
  return jwtVerify(token, accessSecret);
}

async function tryVerifyRefresh(refreshToken) {
  return jwtVerify(refreshToken, refreshSecret);
}

async function mintAccessFromRefreshPayload(payload) {
  return new SignJWT({
    id: payload.id,
    email: payload.email,
    role: payload.role, // <- asegúrate de firmar el refresh con 'role'
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${ACCESS_TOKEN_EXP}s`)
    .sign(accessSecret);
}

export async function middleware(request) {
  const url = request.nextUrl;
  const { pathname } = url;

  const token = request.cookies.get("token")?.value;
  const refreshToken = request.cookies.get("refreshToken")?.value;

  // --- 1) /login siempre accesible ---
  if (pathname === "/login") {
    // Si NO hay tokens -> mostrar login
    if (!token && !refreshToken) return NextResponse.next();

    // Si el access es válido -> redirigir al home
    if (token) {
      try {
        const { payload } = await tryVerifyAccess(token);
        const home = getHomeByRole(String(payload.role));
        const res = NextResponse.redirect(new URL(home, request.url));
        setPublicCookies(res, payload);
        return res;
      } catch (err) {
        // token inválido/expirado -> intentamos refresh
      }
    }

    // Intentar renovar con refresh si existe
    if (refreshToken) {
      try {
        const { payload } = await tryVerifyRefresh(refreshToken);
        const newAccess = await mintAccessFromRefreshPayload(payload);
        const home = getHomeByRole(String(payload.role));
        const res = NextResponse.redirect(new URL(home, request.url));
        setAccessCookie(res, newAccess);
        setPublicCookies(res, payload);
        return res;
      } catch {
        // refresh inválido -> limpiar y dejar ver /login
        const res = NextResponse.next();
        clearAuthCookies(res);
        return res;
      }
    }

    // fallback: ver login
    return NextResponse.next();
  }

  // --- 2) Rutas no protegidas (ej. "/") ---
  if (!isProtectedPath(pathname)) {
    // Si no hay token -> dejar pasar (landing pública)
    if (!token) return NextResponse.next();

    // Con token: si válido y estás en "/" te mando al home
    try {
      const { payload } = await tryVerifyAccess(token);
      if (pathname === "/") {
        const home = getHomeByRole(String(payload.role));
        const res = NextResponse.redirect(new URL(home, request.url));
        setPublicCookies(res, payload);
        return res;
      }
      // si no es "/", solo refresco cookies públicas y dejo pasar
      const res = NextResponse.next();
      setPublicCookies(res, payload);
      return res;
    } catch (err) {
      // access expirado/invalid -> intentar refresh
      if (refreshToken) {
        try {
          const { payload } = await tryVerifyRefresh(refreshToken);
          const newAccess = await mintAccessFromRefreshPayload(payload);
          const res = NextResponse.next();
          setAccessCookie(res, newAccess);
          setPublicCookies(res, payload);
          return res;
        } catch {
          // refresh inválido -> limpiar y permitir ver páginas públicas
          const res = NextResponse.next();
          clearAuthCookies(res);
          return res;
        }
      }
      // sin refresh -> permitir páginas públicas
      const res = NextResponse.next();
      clearAuthCookies(res);
      return res;
    }
  }

  // --- 3) Rutas protegidas (/usuarios, /agendar_visita, /aprobaciones) ---
  // Si no hay access
  if (!token) {
    // sin refresh -> a /login
    if (!refreshToken) {
      const res = NextResponse.redirect(new URL("/login", request.url));
      clearAuthCookies(res);
      return res;
    }
    // con refresh -> intentar renovar
    try {
      const { payload } = await tryVerifyRefresh(refreshToken);
      const newAccess = await mintAccessFromRefreshPayload(payload);

      const home = getHomeByRole(String(payload.role));
      // si viene a una ruta que no es su home, lo mando a su home
      if (!pathname.startsWith(home)) {
        const res = NextResponse.redirect(new URL(home, request.url));
        setAccessCookie(res, newAccess);
        setPublicCookies(res, payload);
        return res;
      }

      // si ya está en su home o debajo, lo dejo pasar
      const res = NextResponse.next();
      setAccessCookie(res, newAccess);
      setPublicCookies(res, payload);
      return res;
    } catch {
      const res = NextResponse.redirect(new URL("/login", request.url));
      clearAuthCookies(res);
      return res;
    }
  }

  // Con access token: validar
  try {
    const { payload } = await tryVerifyAccess(token);
    const role = String(payload.role);
    const home = getHomeByRole(role);

    // si intenta entrar a otra sección, redirigir a su home
    if (!pathname.startsWith(home)) {
      const res = NextResponse.redirect(new URL(home, request.url));
      setPublicCookies(res, payload);
      return res;
    }

    // dejar pasar y refrescar cookies públicas
    const res = NextResponse.next();
    setPublicCookies(res, payload);
    return res;
  } catch (err) {
    // access inválido/expirado -> intentar refresh
    if (refreshToken) {
      try {
        const { payload } = await tryVerifyRefresh(refreshToken);
        const newAccess = await mintAccessFromRefreshPayload(payload);

        const role = String(payload.role);
        const home = getHomeByRole(role);

        // si está en ruta incorrecta -> redirigir a home
        if (!pathname.startsWith(home)) {
          const res = NextResponse.redirect(new URL(home, request.url));
          setAccessCookie(res, newAccess);
          setPublicCookies(res, payload);
          return res;
        }

        // ruta correcta -> dejar pasar
        const res = NextResponse.next();
        setAccessCookie(res, newAccess);
        setPublicCookies(res, payload);
        return res;
      } catch {
        const res = NextResponse.redirect(new URL("/login", request.url));
        clearAuthCookies(res);
        return res;
      }
    }
    const res = NextResponse.redirect(new URL("/login", request.url));
    clearAuthCookies(res);
    return res;
  }
}

export const config = {
  // Excluye assets y API; el middleware se aplica al resto
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
