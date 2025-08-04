import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import bcryptjs from "bcryptjs";
import { success } from "zod";

const fakeUser = {
    id: 1,
    email: "nombre.apellido@impresistem.com",
    password: bcryptjs.hashSync("123456", 10),
    role: "gerente",
};

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

export async function POST(request) {
    const { email, password } = await request.json();

    if (!email || !password) {
        return NextResponse.json(
            { error: "Email y contraseña son requeridos" },
            { status: 400 }
        );
    }

    if (email !== fakeUser.email) {
        return NextResponse.json({ error: "Email incorrecto" }, { status: 401 });
    }

    // Verificar contraseña
    if (!bcryptjs.compareSync(password, fakeUser.password)) {
        return NextResponse.json(
            { error: "Contraseña incorrecta" },
            { status: 401 }
        );
    }

    if (
        email === fakeUser.email &&
        bcryptjs.compareSync(password, fakeUser.password)
    ) {
        const accesstoken = jwt.sign(
            { id: fakeUser.id, email: fakeUser.email, role: fakeUser.role },
            JWT_SECRET,
            { expiresIn: "3m" }
        );

        const refreshtoken = jwt.sign(
            { id: fakeUser.id, email: fakeUser.email },
            JWT_REFRESH_SECRET,
            { expiresIn: "7d" }
        );

        const response = NextResponse.json({ success: true }, { status: 200 });
        response.cookies.set({
            name: "token",
            value: accesstoken,
            httpOnly: true,
            secure: false, // ← ¡esto es CLAVE en localhost!
            maxAge: 60 * 3, // 3 minutos
            path: "/",
        });

        response.cookies.set({
            name: "x-user",
            value: fakeUser.email, // o payload.nombre si lo tienes
            httpOnly: false,
            secure: false,
            maxAge: 60 * 60 * 24 *7, // 3 minutos
            path: "/",
        });

        response.cookies.set({
            name: "refreshToken",
            value: refreshtoken,
            httpOnly: true,
            secure: false, // ← ¡esto es CLAVE en localhost!
            maxAge: 60 * 60 * 24 * 7, // 7 días
            path: "/",
        });

        response.cookies.set({
            name: "x-role",
            value: fakeUser.role,
            httpOnly: false,     // 👈 Se puede leer desde el navegador
            secure: false,       // 👈 Asegúrate de que funcione en localhost
            maxAge: 60 * 60 * 24 * 7, // 7 días
            path: "/",
        });
        return response;
    }
    return NextResponse.json(
        { error: "Credenciales incorrectas" },
        { status: 401 }
    );
}
