import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import bcryptjs from "bcryptjs";

const fakeUser = {
    id: 1,
    email: "nombre.apellido@impresistem.com",
    password: bcryptjs.hashSync("123456", 10),
};

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
        const token = jwt.sign(
            { id: fakeUser.id, email: fakeUser.email },
            process.env.JWT_SECRET || "secreto",
            { expiresIn: "1h" }
        );
        return NextResponse.json({ token }, { status: 200 });
    }
    return NextResponse.json(
        { error: "Credenciales incorrectas" },
        { status: 401 }
    );
}
