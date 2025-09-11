import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

// ✅ Inicializamos Prisma y lo almacenamos en globalThis para evitar múltiples instancias en desarrollo
const prisma = globalThis.__prismaClient || new PrismaClient();
if (!globalThis.__prismaClient) globalThis.__prismaClient = prisma;

// ==============================
// GET user by ID (ignora eliminados)
// ==============================
export async function GET(request, { params }) {
  const { id } = await params;
  const userId = parseInt(id, 10);

  // Validación del ID
  if (Number.isNaN(userId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  try {
    // Buscar el usuario por ID, ignorando los eliminados (deletedAt != null)
    const user = await prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
    });

    if (!user)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// ==============================
// DELETE user by ID (soft delete)
// ==============================
export async function DELETE(request, { params }) {
  const { id } = await params;
  const userId = parseInt(id, 10);

  // Validación del ID
  if (Number.isNaN(userId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  try {
    // Actualizamos la fecha de eliminación en lugar de borrarlo físicamente
    const user = await prisma.user.update({
      where: { id: userId },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ message: "User soft-deleted successfully", user });
  } catch (error) {
    console.error("Error soft-deleting user:", error);

    // P2025 es el código de error de Prisma si no se encuentra el registro
    if (error?.code === "P2025")
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// ==============================
// PUT user by ID (actualización)
// ==============================
export async function PUT(request, { params }) {
  const { id } = await params;
  const userId = parseInt(id, 10);

  // Validación del ID
  if (Number.isNaN(userId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const data = await request.json();
  // Evitamos que actualicen el ID por error
  delete data.id;

  try {
    // Actualizamos el usuario con los datos proporcionados
    const user = await prisma.user.update({ where: { id: userId }, data });
    return NextResponse.json(user);
  } catch (error) {
    console.error("Error updating user:", error);

    if (error?.code === "P2025")
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
