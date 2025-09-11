import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient(); 
// Inicializamos el cliente de Prisma para interactuar con la base de datos

// Handler para la ruta GET /api/aprobaciones
export async function GET(req) {
  try {
    // Obtenemos los parámetros de búsqueda desde la URL
    const { searchParams } = new URL(req.url);

    // Parámetros opcionales que pueden venir en la query string
    const estado = searchParams.get("estado");      // Filtrar por estado de la aprobación
    const q = searchParams.get("q") || "";          // Búsqueda por cliente, ciudad o gerente
    const page = parseInt(searchParams.get("page") || "1");        // Paginación: número de página
    const perPage = parseInt(searchParams.get("perPage") || "10"); // Paginación: registros por página

    // Cálculo para saltar registros (paginación)
    const skip = (page - 1) * perPage;

    // Objeto base de filtros
    const where = {};

    // Si se especifica un estado distinto de "todos", se agrega al filtro
    if (estado && estado !== "todos") {
      where.estado = estado;
    }

    // Si se recibe un texto de búsqueda (q), se arma un filtro OR en varios campos
    if (q.length > 0) {
      where.OR = [
        { visita: { is: { cliente: { contains: q } } } },          // Buscar por cliente
        { visita: { is: { ciudad: { contains: q } } } },           // Buscar por ciudad
        { visita: { is: { gerente: { name: { contains: q } } } } } // Buscar por nombre del gerente
      ];
    }

    // Contamos el total de registros que cumplen con los filtros (para la paginación)
    const total = await prisma.aprobacion.count({ where });

    // Obtenemos los registros con paginación, ordenados por fecha de creación descendente
    const rows = await prisma.aprobacion.findMany({
      where,
      skip,
      take: perPage,
      orderBy: { createdAt: "desc" },
      include: {
        visita: {
          include: {
            gerente: true, // Incluimos datos del gerente relacionado
          },
        },
        aprobador: true, // Incluimos datos del aprobador
      },
    });

    // Respuesta JSON con los datos y metainformación de paginación
    return NextResponse.json({
      rows,
      total,
      page,
      perPage,
    });
  } catch (err) {
    // Si ocurre un error, lo mostramos en consola y devolvemos un 500
    console.error("❌ Error en GET /api/aprobaciones:", err);
    return NextResponse.json(
      { error: "Error al obtener aprobaciones" },
      { status: 500 }
    );
  }
}
