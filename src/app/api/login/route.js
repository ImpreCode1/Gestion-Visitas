import { NextResponse } from "next/server";
import ldap from "ldapjs";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client"

function determinarRol(title = "") {
    const t = title.toLowerCase();
    if (
        t.includes("product manager") ||
        t.includes("gerente de producto") ||
        t.includes("gerente producto") ||
        t.includes("gte de pdto") ||
        t.includes("director") ||
        t.includes("team leader")
    ) {
        return "gerenteProducto";
    } else if (
        t.includes("admin") ||
        t.includes("administrador")
    ) {
        return "admin";
    } else if (
        t.includes("aprobador") ||
        t.includes("coordinador") ||
        t.includes("team leader")
    ) {
        return "aprobador";
    } else if (t.includes("trainee")) {
        return "trainee";
    } else {
        return "sinRol";
    }
}


const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

export async function POST(request) {
    const { email, password } = await request.json();

    if (!email || !password) {
        return NextResponse.json({ error: "Email y contraseña son requeridos" }, { status: 400 });
    }

    const username = email.split("@")[0];
    const userUPN = `${username}@impresistem.local`;
    const userNetBIOS = `IMPRESISTEM\\${username}`;

    const client = ldap.createClient({ url: "ldap://impresistem.local" });

    const tryBind = (user) =>
        new Promise((resolve, reject) => {
            client.bind(user, password, (err) => {
                if (err) reject(err);
                else resolve(user);
            });
        });

    let authenticatedAs;
    try {
        authenticatedAs = await tryBind(userUPN);
    } catch {
        try {
            authenticatedAs = await tryBind(userNetBIOS);
        } catch (err) {
            console.error("❌ Error autenticando:", err);
            return NextResponse.json({ error: "Usuario o contraseña inválidos" }, { status: 401 });
        }
    }

    const userInfo = await new Promise((resolve, reject) => {
        const opts = {
            filter: `(sAMAccountName=${username})`,
            scope: "sub",
            attributes: ["displayName", "mail", "department", "title", "telephoneNumber"],
        };

        client.search("DC=IMPRESISTEM,DC=local", opts, (err, res) => {
            if (err) return reject(err);

            let user = {};

            res.on("searchEntry", (entry) => {
                const parsedUser = parseLdapAttributes(entry.pojo.attributes);
                console.log("🔍 Información del usuario desde LDAP:", parsedUser);
                user = parsedUser;
            });

            res.on("end", () => resolve(user));
            res.on("error", (err) => reject(err));
        });
    });

    client.unbind();

    const role = determinarRol(userInfo.title || "");

    const usuario = await prisma.user.upsert({
        where: { email },
        update: {
            name: userInfo.displayName || "",
            username,
            phone: userInfo.telephoneNumber || "",
            position: userInfo.title || "",
            department: userInfo.department || "",
            role,
        },
        create: {
            name: userInfo.displayName || "",
            username,
            email,
            phone: userInfo.telephoneNumber || "",
            position: userInfo.title || "",
            department: userInfo.department || "",
            role,
        },
    });

    const accesstoken = jwt.sign(
        {
            email,
            displayName: userInfo.displayName || "",
            department: userInfo.department || "",
            title: userInfo.title || "",
            role: role || "user",
        },
        JWT_SECRET,
        { expiresIn: "15m" }
    );

    const refreshtoken = jwt.sign(
        {
            email,
            displayName: userInfo.displayName || "",
            department: userInfo.department || "",
            title: userInfo.title || "",
            role: role || "user",
        },
        JWT_REFRESH_SECRET,
        { expiresIn: "7d" }
    );

    const response = NextResponse.json({}, { status: 200 });

    response.cookies.set({
        name: "token",
        value: accesstoken,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 15,
        path: "/",
    });

    response.cookies.set({
        name: "refreshToken",
        value: refreshtoken,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 7,
        path: "/",
    });

    return response;
}

function parseLdapAttributes(attributesArray) {
    const result = {};
    for (const attr of attributesArray) {
        result[attr.type] = attr.values?.[0] || "";
    }
    return result;
}
