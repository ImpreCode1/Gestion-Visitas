import { PrismaClient, TipoVisita, RolAprobacion } from "@prisma/client";

const prisma = new PrismaClient();

const TIPOS_VISITA_VALIDOS = Object.values(TipoVisita);
const ROLES_APROBADOR_VALIDOS = Object.values(RolAprobacion);

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const tipoVisita = searchParams.get("tipoVisita");
    const rolAprobador = searchParams.get("rolAprobador");
    const usuarioAprobadorId = searchParams.get("usuarioAprobadorId");
    const fechaInicio = searchParams.get("fechaInicio");
    const fechaFin = searchParams.get("fechaFin");

    if (tipoVisita && !TIPOS_VISITA_VALIDOS.includes(tipoVisita)) {
      return Response.json(
        { error: `tipoVisita inválido. Valores válidos: ${TIPOS_VISITA_VALIDOS.join(", ")}` },
        { status: 400 }
      );
    }

    if (rolAprobador && !ROLES_APROBADOR_VALIDOS.includes(rolAprobador)) {
      return Response.json(
        { error: `rolAprobador inválido. Valores válidos: ${ROLES_APROBADOR_VALIDOS.join(", ")}` },
        { status: 400 }
      );
    }

    const parsedFechaInicio = fechaInicio ? new Date(fechaInicio) : null;
    const parsedFechaFin = fechaFin ? new Date(fechaFin) : null;

    if (fechaInicio && isNaN(parsedFechaInicio.getTime())) {
      return Response.json({ error: "fechaInicio no es una fecha válida" }, { status: 400 });
    }
    if (fechaFin && isNaN(parsedFechaFin.getTime())) {
      return Response.json({ error: "fechaFin no es una fecha válida" }, { status: 400 });
    }

    const where = {};

    if (tipoVisita) where.tipoVisita = tipoVisita;

    if (parsedFechaInicio || parsedFechaFin) {
      where.fecha_ida = {};
      if (parsedFechaInicio) where.fecha_ida.gte = parsedFechaInicio;
      if (parsedFechaFin) where.fecha_ida.lte = parsedFechaFin;
    }

    const aprobacionesFilter = {};
    if (rolAprobador) aprobacionesFilter.rol = rolAprobador;
    if (usuarioAprobadorId) {
      aprobacionesFilter.historial = { some: { usuarioId: parseInt(usuarioAprobadorId) } };
    }
    if (Object.keys(aprobacionesFilter).length > 0) {
      where.aprobaciones = { some: aprobacionesFilter };
    }

    const visitas = await prisma.visita.findMany({
      where,
      include: {
        gerente: { select: { name: true, email: true } },
        aprobaciones: {
          include: {
            historial: {
              orderBy: { fecha: "desc" },
              include: { usuario: { select: { name: true } } },
            },
          },
        },
        facturas: { select: { estado: true, montoTotal: true } },
      },
      orderBy: { fecha_ida: "desc" },
    });

    const data = visitas.map((v) => ({
      id: v.id,
      cliente: v.cliente,
      tipoVisita: v.tipoVisita,
      gerente: v.gerente.name,
      gerenteEmail: v.gerente.email,
      fecha_ida: v.fecha_ida,
      fecha_regreso: v.fecha_regreso,
      estado: v.estado,
      factura: v.facturas
        ? { estado: v.facturas.estado, montoTotal: v.facturas.montoTotal }
        : null,
      aprobaciones: v.aprobaciones.map((a) => ({
        rol: a.rol,
        estado: a.estado,
        ultimoUsuario: a.historial[0]?.usuario?.name || null,
        ultimaFecha: a.historial[0]?.fecha || null,
      })),
    }));

    return Response.json({ success: true, data });
  } catch (err) {
    console.error("Error al exportar historial:", err);
    return Response.json({ error: "Error al exportar historial" }, { status: 500 });
  }
}
