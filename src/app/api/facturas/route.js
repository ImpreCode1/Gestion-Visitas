import { NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";
import getTemplate from "../../../lib/emails";

const prisma = new PrismaClient();

// 🔹 POST /api/facturas
// Crea o actualiza facturas de una visita, subiendo varios archivos
// 🔹 POST /api/facturas
export async function POST(req) {
  try {
    const formData = await req.formData();
    const files = formData.getAll("files");
    const descripcion = formData.get("descripcion");
    const monto = formData.get("monto");
    const visitaId = parseInt(formData.get("visitaId"));

    if (!visitaId || !files.length) {
      return NextResponse.json(
        { error: "Faltan datos obligatorios (visitaId o archivos)" },
        { status: 400 }
      );
    }

    // 1️⃣ Buscar visita y validar fechas
    const visita = await prisma.visita.findUnique({
      where: { id: visitaId },
      include: {
        gerente: true,
      },
    });

    if (!visita) {
      return NextResponse.json(
        { error: "Visita no encontrada" },
        { status: 404 }
      );
    }

    const limite = new Date(visita.fecha_regreso);
    limite.setDate(limite.getDate() + 3);

    if (new Date() > limite) {
      return NextResponse.json(
        { error: "El plazo para subir facturas ha vencido" },
        { status: 403 }
      );
    }

    // 2️⃣ Verificar si ya existe Factura para esta visita
    let factura = await prisma.factura.findUnique({ where: { visitaId } });

    if (!factura) {
      factura = await prisma.factura.create({
        data: {
          visitaId,
          descripcion: descripcion || null,
          montoTotal: monto ? parseFloat(monto) : null,
        },
      });
    } else {
      factura = await prisma.factura.update({
        where: { visitaId },
        data: {
          descripcion: descripcion ?? factura.descripcion,
          montoTotal: monto ? parseFloat(monto) : factura.montoTotal,
        },
      });
    }

    // 3️⃣ Guardar archivos en /public/uploads
    const archivosGuardados = [];
    for (const file of files) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const fileName = `${Date.now()}-${file.name}`;
      const uploadDir = path.join(process.cwd(), "public/uploads");
      const filePath = path.join(uploadDir, fileName);

      await writeFile(filePath, buffer);

      const fileUrl = `/uploads/${fileName}`;

      const archivo = await prisma.archivoFactura.create({
        data: {
          facturaId: factura.id,
          nombre: file.name,
          url: fileUrl,
        },
      });

      archivosGuardados.push(archivo);
    }

    // 4️⃣ Buscar usuarios que contengan "internal procurement"
    const usuarios = await prisma.user.findMany({
      where: {
        position: {
          contains: "internal procurement",
        },
      },
      select: { email: true, name: true },
    });

    const correos = usuarios.map((u) => u.email);

    // Helper para enviar correos
    const sendMail = async ({ to, subject, html }) => {
      await fetch(`${req.nextUrl.origin}/api/send-mail`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to, subject, html }),
      });
    };

    if (correos.length > 0) {
      const html = getTemplate("facturasSubidas", {
        cliente: visita.cliente,
        motivo: visita.motivo,
        usuario: visita.gerente.name,
        monto: factura.montoTotal || "N/A",
        descripcion: factura.descripcion || "N/A",
        fecha_ida: new Date(visita.fecha_ida).toLocaleDateString(),
        fecha_regreso: new Date(visita.fecha_regreso).toLocaleDateString(),
      });

      await sendMail({
        to: correos,
        subject: `📑 Nuevas facturas subida para la visita a ${visita.cliente}`,
        html,
      });
    }

    await prisma.visita.update({
      where:{ id: visitaId},
      data: { estado: "completada"},
    })
    
    return NextResponse.json({
      success: true,
      factura,
      archivos: archivosGuardados,
    });
  } catch (error) {
    console.error("Error al subir facturas:", error);
    return NextResponse.json(
      { error: "Error al subir facturas" },
      { status: 500 }
    );
  }
}

// 🔹 GET /api/facturas?visitaId=123
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const visitaId = parseInt(searchParams.get("visitaId"));

    if (!visitaId) {
      return NextResponse.json(
        { error: "Debe enviar un visitaId válido" },
        { status: 400 }
      );
    }

    const factura = await prisma.factura.findUnique({
      where: { visitaId },
      include: { archivos: true },
    });

    if (!factura) {
      return NextResponse.json({ success: true, factura: null });
    }

    return NextResponse.json({ success: true, factura });
  } catch (error) {
    console.error("Error al obtener facturas:", error);
    return NextResponse.json(
      { error: "Error al obtener facturas" },
      { status: 500 }
    );
  }
}

// 🔹 DELETE /api/facturas?idArchivo=123
export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const idArchivo = parseInt(searchParams.get("idArchivo"));

    if (!idArchivo) {
      return NextResponse.json(
        { error: "Debe enviar un idArchivo válido" },
        { status: 400 }
      );
    }

    const archivo = await prisma.archivoFactura.findUnique({
      where: { id: idArchivo },
    });

    if (!archivo) {
      return NextResponse.json(
        { error: "Archivo no encontrado" },
        { status: 404 }
      );
    }

    // Borrar archivo físico
    const filePath = path.join(process.cwd(), "public", archivo.url);
    try {
      await fs.promises.unlink(filePath);
    } catch (err) {
      console.warn("⚠️ No se pudo borrar archivo físico:", err.message);
    }

    // Borrar de BD
    await prisma.archivoFactura.delete({ where: { id: archivo.id } });

    return NextResponse.json({ success: true, message: "Archivo eliminado" });
  } catch (error) {
    console.error("Error al eliminar archivo:", error);
    return NextResponse.json(
      { error: "Error al eliminar archivo" },
      { status: 500 }
    );
  }
}

// 🔹 PUT /api/facturas?visitaId=123
// Actualiza descripción, monto o fecha de emisión
export async function PUT(req) {
  try {
    const { searchParams } = new URL(req.url);
    const visitaId = parseInt(searchParams.get("visitaId"));
    const body = await req.json();

    if (!visitaId) {
      return NextResponse.json(
        { error: "Debe enviar un visitaId válido" },
        { status: 400 }
      );
    }

    const { descripcion, monto } = body;

    const factura = await prisma.factura.update({
      where: { visitaId },
      data: {
        descripcion: descripcion ?? undefined,
        montoTotal: monto ? parseFloat(monto) : undefined,
      },
    });

    return NextResponse.json({ success: true, factura });
  } catch (error) {
    console.error("Error al actualizar factura:", error);
    return NextResponse.json(
      { error: "Error al actualizar factura" },
      { status: 500 }
    );
  }
}
