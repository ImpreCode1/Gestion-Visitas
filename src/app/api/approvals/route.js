/**
 * @fileoverview Endpoint GET /api/aprobaciones
 * @description
 * Este endpoint retorna la lista de aprobaciones pendientes o históricas
 * según el rol del usuario actual (vicepresidente, aprobador o notas de crédito).
 *
 * La validación JWT por sesión está deshabilitada (PRY-19); la identidad se
 * resuelve con `resolverUsuario` (cabecera X-User-Email o fallback). Se aplica
 * filtrado dinámico por área, rol, estado y búsqueda textual.
 * Aplica reglas jerárquicas para mantener el flujo correcto de aprobación.
 */

import { NextResponse } from "next/server";
import { PrismaClient, EstadoAprobacion } from "@prisma/client";
import { resolverUsuario } from "../../../lib/currentUser";

// Inicializa Prisma
const prisma = new PrismaClient();

/**
 * @async
 * @function GET
 * @param {Request} req - Solicitud HTTP entrante.
 * @returns {Promise<Response>} Respuesta JSON con las aprobaciones filtradas o error correspondiente.
 */
export async function GET(req) {
  try {
    // Resuelve el usuario actual sin validación JWT (PRY-19)
    const usuario = await resolverUsuario(req);
    if (!usuario) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    // ====================================
    // Definir filtros según tipo de rol
    // ====================================
    let rolFiltrado = null;
    let filtroArea = null;

    // Vicepresidencia: filtra por área (departamento)
    if (usuario.role === "vicepresidente") {
      rolFiltrado = "vicepresidencia";
      filtroArea = usuario.department;
    }
    // Aprobadores generales: suministros o adquisiciones
    else if (usuario.role === "aprobador") {
      if (usuario.tipoaprobador === "suministros") {
        rolFiltrado = "transporte";
      } else if (usuario.tipoaprobador === "adquisiciones") {
        rolFiltrado = "tiquetes";
      }
    }
    // Notas de crédito
    else if (usuario.role === "notas_credito") {
      rolFiltrado = "notas_credito";
    }

    // Si el usuario no pertenece a ninguno de los roles autorizados
    if (!rolFiltrado) {
      return NextResponse.json(
        { error: "Este usuario no tiene permisos para ver aprobaciones" },
        { status: 403 }
      );
    }

    // ========================================
    // Parámetros de búsqueda y paginación
    // ========================================
    const { searchParams } = new URL(req.url);
    const estado = searchParams.get("estado");
    const q = searchParams.get("q") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const perPage = parseInt(searchParams.get("perPage") || "10");
    const skip = (page - 1) * perPage;

    // Construcción dinámica del filtro base
    const where = { rol: rolFiltrado };

    // Filtra por área si aplica (solo vicepresidencia)
    if (filtroArea) {
      where.visita = { area: filtroArea };
    }

    // Filtra por estado si se especifica (pendiente/aprobado/rechazado)
    if (estado && estado !== "todos") {
      if (Object.values(EstadoAprobacion).includes(estado)) {
        where.estado = estado;
      }
    }

    // Búsqueda textual por cliente, ciudad o nombre del gerente
    if (q.length > 0) {
      where.OR = [
        { visita: { cliente: { contains: q } } },
        { visita: { ciudad: { contains: q } } },
        { visita: { gerente: { name: { contains: q } } } },
      ];
    }

    // =======================================
    // Consulta de aprobaciones en base de datos
    // =======================================
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

    // ==========================================================
    // Ajuste de dependencias jerárquicas (VP → tiquetes/transporte)
    // ==========================================================
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

        // Si la VP aún no aprueba, las demás no deben mostrarse
        if (aprobVP && (aprobTiq || aprobTrans)) {
          if (aprobVP.estado === "pendiente") {
            if (
              aprobacion.rol === "tiquetes" ||
              aprobacion.rol === "transporte"
            ) {
              return null;
            }
          }

          // Si la VP rechaza, todas las demás se marcan como rechazadas
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

    // Filtra nulos (aprobaciones bloqueadas por jerarquía)
    rows = rows.filter((r) => r !== null);

    // ===========================
    // Respuesta final al cliente
    // ===========================
    return NextResponse.json({
      rows,
      total,
      page,
      perPage,
    });
  } catch (err) {
    // ==============================
    // Manejo global de errores
    // ==============================
    console.error("❌ Error en GET /api/aprobaciones:", err);
    return NextResponse.json(
      { error: "Error al obtener aprobaciones" },
      { status: 500 }
    );
  }
}
