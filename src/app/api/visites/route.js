import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

// ======================
// GET → traer visitas del usuario logueado
// ======================
export async function GET(request) {
  try {
    // 🔹 Obtener token JWT de la cookie
    const token = request.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // 🔹 Verificar token
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const email = payload.email;
    if (!email) {
      return NextResponse.json({ error: "Usuario no válido" }, { status: 400 });
    }

    // 🔹 Buscar al usuario en la DB
    const usuario = await prisma.user.findUnique({ where: { email } });
    if (!usuario) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    // 🔹 Consultar visitas asociadas al gerente logueado
    const visitas = await prisma.visita.findMany({
      where: { gerenteId: usuario.id },
      select: {
        id: true,
        cliente: true,
        motivo: true,
        fecha_ida: true,
        fecha_regreso: true,
        estado: true,
        ciudad: true,
        pais: true,
        personaVisita: true,
        aprobaciones: {
          select: {
            id: true,
            rol: true,
            estado: true,
            comentario: true,
            createdAt: true,
          },
        },
        facturas: {
          select: {
            id: true,
            descripcion: true,
            montoTotal: true,
            archivos: {
              select: {
                id: true,
                nombre: true,
                url: true,
              },
            },
          },
        },
      },
      orderBy: { fecha_ida: "desc" },
    });

    return NextResponse.json(visitas, { status: 200 });
  } catch (error) {
    console.error("Error al obtener visitas:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// ======================
// POST → crear nueva visita
// ======================
export async function POST(request) {
  const token = request.cookies.get("token")?.value;
  if (!token) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    // 🔹 Verificar token y extraer email
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const email = payload.email;
    const area = payload.department;

    // 🔹 Buscar usuario en la DB
    const usuario = await prisma.user.findUnique({ where: { email } });
    if (!usuario) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    const body = await request.json();

    // 🔹 Crear la visita
    const nuevaVisita = await prisma.visita.create({
      data: {
        gerente: { connect: { id: usuario.id } },
        clienteCodigo: body.clienteCodigo.toString(),
        cliente: body.cliente || "Sin nombre",
        direccion: body.direccion || "",
        ciudad: body.ciudad || "",
        pais: body.pais || "",
        contacto: body.contacto || "",
        telefono: body.telefono || "",
        personaVisita: body.personaVisita || "",
        motivo: body.motivo || "",
        fecha_ida: new Date(body.fecha_ida),
        fecha_regreso: new Date(body.fecha_regreso),
        lugar: body.lugar || "",
        requiereAvion: body.requiereAvion,
        estado: "pendiente",
        area: area,
        ciudad_origen: body.ciudad_origen,
        gastos_viaje: "",
        fondos_fabrica: body.fondos_fabrica
      },
    });

    // 🔹 Crear aprobaciones
    let aprobaciones = [];
    if (body.requiereAvion === true) {
      aprobaciones = [
        {
          visitaId: nuevaVisita.id,
          rol: "vicepresidencia",
          estado: "pendiente",
        },
        { visitaId: nuevaVisita.id, rol: "tiquetes", estado: "pendiente" },
        { visitaId: nuevaVisita.id, rol: "transporte", estado: "pendiente" },
      ];
    } else if (body.fondos_fabrica === true) {
      aprobaciones = [
        { visitaId: nuevaVisita.id, rol: "notas_credito", estado: "pendiente"}
      ]
    } else {
      aprobaciones = [
        { visitaId: nuevaVisita.id, rol: "transporte", estado: "pendiente" },
      ];
    }

    await prisma.aprobacion.createMany({ data: aprobaciones });

    // 🔹 Determinar destinatarios
    let destinatarios = [];

    if (body.requiereAvion === true) {
      // vicepresidente del mismo department
      const vp = await prisma.user.findFirst({
        where: {
          role: "vicepresidente",
          department: nuevaVisita.area,
        },
      });
      if (vp) destinatarios = [vp.email];
    } else {
      // coordinadores internos (role que incluya "Internal Supply")
      const coordinadores = await prisma.user.findMany({
        where: {
          position: {
            contains: "Internal Supply",
          },
        },
      });
      destinatarios = coordinadores.map((c) => c.email);
    }

    // 🔹 Enviar correo llamando al endpoint /api/send-mail
    if (destinatarios.length > 0) {
      try {
        await fetch(`${request.nextUrl.origin}/api/send-mail`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: destinatarios,
            subject: "Una solicitud para una nueva visita ha sido registrada",
            html: `
          <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: auto;">
            <h2 style="color: #0056b3;">📌 Nueva solicitud de visita registrada</h2>
            <p>Se ha registrado una nueva visita en la plataforma. A continuación, los detalles:</p>

            <table style="border-collapse: collapse; width: 100%; margin-top: 10px;">
              <tr>
                <td style="border: 1px solid #ddd; padding: 8px;"><b>Colaborador</b></td>
                <td style="border: 1px solid #ddd; padding: 8px;">${
                  usuario.name
                }</td>
              </tr>
              <tr>
                <td style="border: 1px solid #ddd; padding: 8px;"><b>Cliente</b></td>
                <td style="border: 1px solid #ddd; padding: 8px;">${
                  nuevaVisita.cliente
                }</td>
              </tr>
              <tr>
                <td style="border: 1px solid #ddd; padding: 8px;"><b>Ciudad / País</b></td>
                <td style="border: 1px solid #ddd; padding: 8px;">${
                  nuevaVisita.ciudad
                }, ${nuevaVisita.pais}</td>
              </tr>
              <tr>
                <td style="border: 1px solid #ddd; padding: 8px;"><b>Ciudad Origen</b></td>
                <td style="border: 1px solid #ddd; padding: 8px;">${
                  nuevaVisita.ciudad_origen || "No especificada"
                }</td>
              </tr>
              <tr>
                <td style="border: 1px solid #ddd; padding: 8px;"><b>Persona a Visitar</b></td>
                <td style="border: 1px solid #ddd; padding: 8px;">${
                  nuevaVisita.personaVisita
                }</td>
              </tr>
              <tr>
                <td style="border: 1px solid #ddd; padding: 8px;"><b>Motivo</b></td>
                <td style="border: 1px solid #ddd; padding: 8px;">${
                  nuevaVisita.motivo
                }</td>
              </tr>
              <tr>
                <td style="border: 1px solid #ddd; padding: 8px;"><b>Fecha Ida</b></td>
                <td style="border: 1px solid #ddd; padding: 8px;">${nuevaVisita.fecha_ida.toLocaleDateString()}</td>
              </tr>
              <tr>
                <td style="border: 1px solid #ddd; padding: 8px;"><b>Fecha Regreso</b></td>
                <td style="border: 1px solid #ddd; padding: 8px;">${nuevaVisita.fecha_regreso.toLocaleDateString()}</td>
              </tr>
              <tr>
                <td style="border: 1px solid #ddd; padding: 8px;"><b>Requiere tiquetes aéreos</b></td>
                <td style="border: 1px solid #ddd; padding: 8px;">${
                  nuevaVisita.requiereAvion ? "Sí" : "No"
                }</td>
              </tr>
              <tr>
                <td style="border: 1px solid #ddd; padding: 8px;"><b>Área</b></td>
                <td style="border: 1px solid #ddd; padding: 8px;">${
                  nuevaVisita.area
                }</td>
              </tr>
            </table>

            <p style="margin-top: 20px;">
              👉 Para aprobar o rechazar esta visita, por favor ingrese a la plataforma de gestion de visitas.
            </p>

            <p style="margin-top: 30px; font-size: 12px; color: #666;">
              Este es un correo automático, por favor no responder.
            </p>
          </div>
        `,
          }),
        });
      } catch (mailError) {
        console.error("⚠️ Error al llamar a /api/send-mail:", mailError);
      }
    } else {
      console.warn("⚠️ No se encontraron destinatarios para esta visita");
    }

    return NextResponse.json(nuevaVisita, { status: 201 });
  } catch (error) {
    console.error("Error al registrar visita:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
