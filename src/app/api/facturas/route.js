import { NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import path from "path";
import { PrismaClient } from "@prisma/client" // ORM para la base de datos

const prisma = new PrismaClient(); // Inicializamos cliente de Prisma

export async function POST(req) {
  try {
    // 1. Recibir form-data
    const formData = await req.formData();
    const file = formData.get("file");
    const descripcion = formData.get("descripcion");
    const monto = formData.get("monto");
    const fechaEmision = formData.get("fechaEmision"); // opcional
    const visitaId = parseInt(formData.get("visitaId"));

    if (!file || !visitaId) {
      return NextResponse.json(
        { error: "Faltan datos obligatorios (archivo o visitaId)" },
        { status: 400 }
      );
    }

    // 2. Guardar archivo en /public/uploads
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const fileName = `${Date.now()}-${file.name}`;
    const uploadDir = path.join(process.cwd(), "public/uploads");
    const filePath = path.join(uploadDir, fileName);

    await writeFile(filePath, buffer);

    const fileUrl = `/uploads/${fileName}`; // accesible desde el front

    // 3. Registrar en la BD con Prisma
    const documento = await prisma.documento.create({
      data: {
        visitaId,
        tipo: "factura", // ⚡ debe coincidir con tu enum TipoDocumento en Prisma
        url: fileUrl,
        descripcion: descripcion || null,
        monto: monto ? parseFloat(monto) : null,
        fechaEmision: fechaEmision ? new Date(fechaEmision) : null,
      },
    });

    return NextResponse.json({ success: true, documento });
  } catch (error) {
    console.error("Error al subir factura:", error);
    return NextResponse.json(
      { error: "Error al subir la factura" },
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

    // Buscar facturas asociadas a la visita
    const facturas = await prisma.documento.findMany({
      where: {
        visitaId,
        tipo: "factura", // ⚡ solo facturas
      },
      orderBy: {
        createdAt: "desc", // las más recientes primero
      },
    });

    return NextResponse.json({ success: true, facturas });
  } catch (error) {
    console.error("Error al obtener facturas:", error);
    return NextResponse.json(
      { error: "Error al obtener facturas" },
      { status: 500 }
    );
  }
}

export async function DELETE(req, { params }) {
  try {
    const { id } = params;

    // Buscar factura en BD
    const factura = await prisma.documento.findUnique({
      where: { id: parseInt(id) },
    });

    if (!factura) {
      return NextResponse.json(
        { error: "Factura no encontrada" },
        { status: 404 }
      );
    }

    // Eliminar archivo físico
    const filePath = path.join(process.cwd(), "public", factura.url);
    try {
      await fs.unlink(filePath);
    } catch (err) {
      console.warn("⚠️ No se pudo borrar el archivo físico:", err.message);
    }

    // Eliminar registro de BD
    await prisma.documento.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ success: true, message: "Factura eliminada" });
  } catch (error) {
    console.error("Error al eliminar factura:", error);
    return NextResponse.json(
      { error: "Error al eliminar factura" },
      { status: 500 }
    );
  }
}

export async function PUT(req, { params }) {
  try {
    const { id } = params;
    const body = await req.json();

    const { descripcion, monto, fechaEmision } = body;

    const updatedFactura = await prisma.documento.update({
      where: { id: parseInt(id) },
      data: {
        descripcion: descripcion ?? undefined,
        monto: monto ? parseFloat(monto) : undefined,
        fechaEmision: fechaEmision ? new Date(fechaEmision) : undefined,
      },
    });

    return NextResponse.json({ success: true, factura: updatedFactura });
  } catch (error) {
    console.error("Error al actualizar factura:", error);
    return NextResponse.json(
      { error: "Error al actualizar factura" },
      { status: 500 }
    );
  }
}
