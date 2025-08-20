import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = globalThis.__prismaClient || new PrismaClient();
if (!globalThis.__prismaClient) globalThis.__prismaClient = prisma;

// GET user by ID
export async function GET(request, { params }) {
  const { id } = await params;
  const userId = parseInt(id, 10);
  if (Number.isNaN(userId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
    return NextResponse.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// DELETE user by ID
export async function DELETE(request, { params }) {
  const { id } = await params;
  const userId = parseInt(id, 10);
  if (Number.isNaN(userId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  try {
    const user = await prisma.user.delete({ where: { id: userId } });
    return NextResponse.json({ message: "User deleted successfully", user });
  } catch (error) {
    console.error("Error deleting user:", error);
    if (error?.code === "P2025") return NextResponse.json({ error: "User not found" }, { status: 404 });
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// UPDATE user by ID
export async function PUT(request, { params }) {
  const { id } = await params;
  const userId = parseInt(id, 10);
  if (Number.isNaN(userId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const data = await request.json();
  // evitar que actualicen el id
  delete data.id;

  try {
    const user = await prisma.user.update({ where: { id: userId }, data });
    return NextResponse.json(user);
  } catch (error) {
    console.error("Error updating user:", error);
    if (error?.code === "P2025") return NextResponse.json({ error: "User not found" }, { status: 404 });
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
//