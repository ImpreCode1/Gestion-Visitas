import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import bcryptjs from "bcryptjs";

const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

export async function POST(request) {
    try {
        const { email, password } = await request.json();

        if (!email || !password) {
            return NextResponse.json(
                { error: "Email y contraseña son requeridos" },
                { status: 400 }
            );
        }

        // Buscar usuario en la base de datos
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            return NextResponse.json(
                { error: "Usuario no encontrado" },
                { status: 401 }
            );
        }

        // Verificar contraseña
        const isValid = await bcryptjs.compare(password, user.password);
        if (!isValid) {
            return NextResponse.json(
                { error: "Contraseña incorrecta" },
                { status: 401 }
            );
        }

        // Generar tokens
        const accesstoken = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: "15m" }
        );

        const refreshtoken = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            JWT_REFRESH_SECRET,
            { expiresIn: "7d" }
        );

        // Responder con cookies
        const response = NextResponse.json(
            {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                changePassword: user.changePassword, // <- importante
            },
            { status: 200 }
        );

        response.cookies.set({
            name: "token",
            value: accesstoken,
            httpOnly: true,
            secure: false, // 👈 en producción cambia a true
            maxAge: 60 * 15, // 3 minutos
            path: "/",
        });

        response.cookies.set({
            name: "x-user",
            value: user.email,
            httpOnly: false,
            secure: false,
            maxAge: 60 * 60 * 24 * 7,
            path: "/",
        });

        response.cookies.set({
            name: "refreshToken",
            value: refreshtoken,
            httpOnly: true,
            secure: false,
            maxAge: 60 * 60 * 24 * 7,
            path: "/",
        });

        response.cookies.set({
            name: "x-role",
            value: user.role,
            httpOnly: false,
            secure: false,
            maxAge: 60 * 60 * 24 * 7,
            path: "/",
        });

        return response;
    } catch (error) {
        console.error("Error en login:", error);
        return NextResponse.json(
            { error: "Error en el servidor" },
            { status: 500 }
        );
    }
}
