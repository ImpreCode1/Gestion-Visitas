// middleware.js
import { NextResponse } from "next/server";
import { jwtVerify, SignJWT } from "jose";

// ======================
// Claves y configuración
// ======================
const encoder = new TextEncoder();
const accessSecret = encoder.encode(process.env.JWT_SECRET);
const refreshSecret = encoder.encode(process.env.JWT_REFRESH_SECRET);
const ACCESS_TOKEN_EXP = 60 * 15; // 15 minutos

// ======================
// Menús por rol
// ======================

const menusPorRol = {
  gerenteProducto: [
    {
      titulo: "Visitas",
      items: [
        { label: "Agendar visita", href: "/agendar_visita" },
        { label: "Mis visitas", href: "/mis_visitas" },
      ],
    },
    {
      titulo: "Gastos",
      items: [{ label: "Legalizar gastos", href: "/legalizar_gastos" }],
    },
  ],
  admin: [
    {
      titulo: "Administración",
      items: [
        { label: "Usuarios", href: "/admin/usuarios" },
        { label: "Visitas", href: "/admin/visitas" },
        { label: "Indicadores", href: "/admin/dashboard" },
      ],
    },
    {
      titulo: "Visitas",
      items: [
        { label: "Agendar visita", href: "/agendar_visita" },
        { label: "Mis visitas", href: "/mis_visitas" },
      ],
    },
    {
      titulo: "Gastos",
      items: [{ label: "Legalizar gastos", href: "/legalizar_gastos" }],
    },
  ],
  vicepresidente: [
    {
      titulo: "Aprobaciones",
      items: [{ label: "Solicitudes", href: "/aprobaciones" }],
    },
    {
      titulo: "Visitas",
      items: [
        { label: "Agendar visita", href: "/agendar_visita" },
        { label: "Mis visitas", href: "/mis_visitas" },
      ],
    },
    {
      titulo: "Gastos",
      items: [{ label: "Legalizar gastos", href: "/legalizar_gastos" }],
    },
  ],
  aprobador: [
    {
      titulo: "Autorizaciones",
      items: [{ label: "Autorizar", href: "/aprobaciones" }],
    },
    {
      titulo: "Visitas",
      items: [
        { label: "Agendar visita", href: "/agendar_visita" },
        { label: "Mis visitas", href: "/mis_visitas" },
      ],
    },
    {
      titulo: "Gastos",
      items: [{ label: "Legalizar gastos", href: "/legalizar_gastos" }],
    },
    {
      titulo: "Historial",
      items: [{ label: "Visitas", href: "/admin/visitas" }],
    },
  ],
  trainee: [
    {
      titulo: "Visitas",
      items: [
        { label: "Agendar visita", href: "/agendar_visita" },
        { label: "Mis visitas", href: "/mis_visitas" },
      ],
    },
    {
      titulo: "Gastos",
      items: [{ label: "Legalizar gastos", href: "/legalizar_gastos" }],
    },
    {
      titulo: "Administración",
      items: [
        { label: "Usuarios", href: "/admin/usuarios" },
        { label: "Visitas", href: "/admin/visitas" },
        { label: "Indicadores", href: "/admin/dashboard" },
      ],
    },
    {
      titulo: "Aprobaciones",
      items: [{ label: "Aprobaciones", href: "/aprobaciones" }],
    },
  ],
  notas_credito: [
    {
      titulo: "Autorizaciones",
      items: [{ label: "Solicitudes", href: "/aprobaciones" }],
    },
    {
      titulo: "Visitas",
      items: [
        { label: "Agendar visita", href: "/agendar_visita" },
        { label: "Mis visitas", href: "/mis_visitas" },
      ],
    },
    {
      titulo: "Gastos",
      items: [{ label: "Legalizar gastos", href: "/legalizar_gastos" }],
    },
  ],
  sinRol: [],
};

// ======================
// Helpers
// ======================

function rutasPermitidasPorRol(role) {
  const menu = menusPorRol[role] || [];
  return menu.flatMap((seccion) => seccion.items.map((i) => i.href));
}

function setAccessCookie(res, token) {
  res.cookies.set("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ACCESS_TOKEN_EXP,
    sameSite: "lax",
  });
}

async function tryVerifyAccess(token) {
  return jwtVerify(token, accessSecret);
}

async function tryVerifyRefresh(refreshToken) {
  return jwtVerify(refreshToken, refreshSecret);
}

async function mintAccessFromRefreshPayload(payload) {
  const newPayload = {
    email: payload.email,
    displayName: payload.displayName,
    department: payload.department,
    title: payload.title,
    role: payload.role,
    typerole: payload.typerole,
  };

  return new SignJWT(newPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${ACCESS_TOKEN_EXP}s`)
    .sign(accessSecret);
}

// ======================
// Middleware principal
// ======================
export async function middleware(request) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("token")?.value;
  const refreshToken = request.cookies.get("refreshToken")?.value;

  // --- /login y /: redirecciones básicas ---
  if (pathname === "/login" || pathname === "/") {
    if (!token && !refreshToken) return NextResponse.next();

    if (token) {
      try {
        await tryVerifyAccess(token);
        return NextResponse.redirect(new URL("/agendar_visita", request.url));
      } catch {}
    }

    if (refreshToken) {
      try {
        const { payload } = await tryVerifyRefresh(refreshToken);
        const newAccess = await mintAccessFromRefreshPayload(payload);
        const res = NextResponse.redirect(
          new URL("/agendar_visita", request.url)
        );
        setAccessCookie(res, newAccess);
        return res;
      } catch {
        return NextResponse.next();
      }
    }

    return NextResponse.next();
  }

  // --- Proteger rutas ---
  if (!token) {
    if (!refreshToken)
      return NextResponse.redirect(new URL("/login", request.url));

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

  // --- Verificar token y rol ---
  try {
    const { payload } = await tryVerifyAccess(token);
    const role = payload.role || payload.typerole;

    if (!role) {
      return NextResponse.redirect(new URL("/sin_acceso", request.url));
    }

    // Extraer todas las rutas permitidas según el rol
    const rutasPermitidas = rutasPermitidasPorRol(role);

    // Permitir subrutas, ej: /admin/usuarios/123
    const isAllowed = rutasPermitidas.some((ruta) =>
      pathname.startsWith(ruta)
    );

    if (!isAllowed) {
      return NextResponse.redirect(new URL("/sin_acceso", request.url));
    }

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

// ======================
// Configuración de Next
// ======================
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|sin_acceso).*)"],
};
