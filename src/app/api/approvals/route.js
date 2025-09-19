import { NextResponse } from "next/server";
import { PrismaClient, EstadoVisita } from "@prisma/client";
import { jwtVerify } from "jose";

const prisma = new PrismaClient();
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

export async function GET(req) {
  try {
    const token = req.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { payload } = await jwtVerify(token, JWT_SECRET);

    const usuario = await prisma.user.findUnique({
      where: { email: payload.email },
    });
    if (!usuario) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    let rolFiltrado = null;
    if (usuario.role === "vicepresidente") {
      rolFiltrado = "vicepresidencia";
    } else if (usuario.role === "aprobador") {
      if (usuario.tipoaprobador === "suministros") {
        rolFiltrado = "transporte";
      } else if (usuario.tipoaprobador === "adquisiciones") {
        rolFiltrado = "tiquetes";
      }
    }

    if (!rolFiltrado) {
      return NextResponse.json(
        { error: "Este usuario no tiene permisos para ver aprobaciones" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const estado = searchParams.get("estado");
    const q = searchParams.get("q") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const perPage = parseInt(searchParams.get("perPage") || "10");
    const skip = (page - 1) * perPage;

    const where = { rol: rolFiltrado };
    if (estado && estado !== "todos") {
      if (Object.values(EstadoVisita).includes(estado)) {
        where.estado = estado; // ✅ Enum validado
      }
    }
    if (q.length > 0) {
      where.OR = [
        { visita: { cliente: { contains: q } } },
        { visita: { ciudad: { contains: q } } },
        { visita: { gerente: { name: { contains: q } } } },
      ];
    }

    const total = await prisma.aprobacion.count({ where });

    let rows = await prisma.aprobacion.findMany({
      where,
      skip,
      take: perPage,
      orderBy: { createdAt: "desc" },
      include: {
        visita: {
          include: {
            gerente: true,
            aprobaciones: true,
          },
        },
      },
    });

    rows = await Promise.all(
      rows.map(async (aprobacion) => {
        const aprobacionesVisita = aprobacion.visita.aprobaciones;

        const aprobVP = aprobacionesVisita.find(
          (a) => a.rol === "vicepresidencia"
        );
        const aprobTiq = aprobacionesVisita.find((a) => a.rol === "tiquetes");
        const aprobTrans = aprobacionesVisita.find(
          (a) => a.rol === "transporte"
        );

        if (aprobVP && (aprobTiq || aprobTrans)) {
          if (aprobVP.estado === "pendiente") {
            if (
              aprobacion.rol === "tiquetes" ||
              aprobacion.rol === "transporte"
            ) {
              return null;
            }
          }

          if (aprobVP.estado === "rechazado") {
            if (
              aprobacion.rol === "tiquetes" ||
              aprobacion.rol === "transporte"
            ) {
              aprobacion.estado = "rechazado";
            }
          }
        }
        return aprobacion;
      })
    );

    rows = rows.filter((r) => r !== null);

    return NextResponse.json({
      rows,
      total,
      page,
      perPage,
    });
  } catch (err) {
    console.error("❌ Error en GET /api/aprobaciones:", err);
    return NextResponse.json(
      { error: "Error al obtener aprobaciones" },
      { status: 500 }
    );
  }
}
