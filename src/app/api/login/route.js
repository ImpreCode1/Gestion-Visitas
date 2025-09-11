import { NextResponse } from "next/server";
import ldap from "ldapjs"; // Librería para conectarse a LDAP (Active Directory)
import jwt from "jsonwebtoken"; // Para generar tokens JWT
import { PrismaClient } from "@prisma/client" // ORM para la base de datos

// Función para determinar el rol del usuario a partir de su título en AD
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
        t.includes("internal procurement") ||
        t.includes("internal supply")
    ) {
        return "aprobador";
    } else if (t.includes("trainee")) {
        return "trainee";
    } else if (t.includes("vicepresident")){
        return "vicepresidente"
    } else {
        return "sinRol";
    }
}

const prisma = new PrismaClient(); // Inicializamos cliente de Prisma

// Secretos para JWT obtenidos de variables de entorno
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

// Endpoint POST para login/autenticación vía LDAP
export async function POST(request) {
    const { email, password } = await request.json();

    // Validación básica de email y contraseña
    if (!email || !password) {
        return NextResponse.json(
            { error: "Email y contraseña son requeridos" },
            { status: 400 }
        );
    }

    // Construcción de credenciales de AD
    const username = email.split("@")[0];
    const userUPN = `${username}@impresistem.local`;
    const userNetBIOS = `IMPRESISTEM\\${username}`;

    // Cliente LDAP
    const client = ldap.createClient({ url: "ldap://impresistem.local" });

    // Función auxiliar para intentar bind (autenticación) en LDAP
    const tryBind = (user) =>
        new Promise((resolve, reject) => {
            client.bind(user, password, (err) => {
                if (err) reject(err);
                else resolve(user);
            });
        });

    let authenticatedAs;
    try {
        // Intentamos autenticar usando UPN
        authenticatedAs = await tryBind(userUPN);
    } catch {
        try {
            // Si falla, intentamos usando NetBIOS
            authenticatedAs = await tryBind(userNetBIOS);
        } catch (err) {
            console.error("❌ Error autenticando:", err);
            return NextResponse.json(
                { error: "Usuario o contraseña inválidos" },
                { status: 401 }
            );
        }
    }

    // Obtenemos información adicional del usuario desde LDAP
    const userInfo = await new Promise((resolve, reject) => {
        const opts = {
            filter: `(sAMAccountName=${username})`,
            scope: "sub",
            attributes: ["displayName", "mail", "department", "title","mobile"],
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

    client.unbind(); // Cerramos la conexión LDAP

    // Verificamos si el usuario ya existe en la base de datos
    const usuarioExistente = await prisma.user.findUnique({
        where: { email },
    });

    let role, tipoaprobador = "null";

    if (usuarioExistente) {
        // ✅ Si ya existe en BD, respetamos su rol
        role = usuarioExistente.role;
    } else {
        // 🆕 Si no existe, lo calculamos desde AD
        role = determinarRol(userInfo.title || "");
        if (role === "aprobador") {
            if ((userInfo.title || "").includes("internal procurement")) {
                tipoaprobador = "nacional";
            } else if ((userInfo.title || "").includes("supply")) {
                tipoaprobador = "local";
            }
        }
    }

    // Creamos o actualizamos el usuario en la base de datos
    const usuario = await prisma.user.upsert({
        where: { email },
        update: {
            name: userInfo.displayName || "",
            username,
            phone: userInfo.mobile || "",
            position: userInfo.title || "",
            department: userInfo.department || "",
        },
        create: {
            name: userInfo.displayName || "",
            username,
            email,
            phone: userInfo.mobile || "",
            position: userInfo.title || "",
            department: userInfo.department || "",
            role,
            tipoaprobador
        },
    });

    // Generamos tokens JWT
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

    // Preparamos la respuesta HTTP
    const response = NextResponse.json({}, { status: 200 });

    // Guardamos el token de acceso en cookie HTTPOnly
    response.cookies.set({
        name: "token",
        value: accesstoken,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 15, // 15 minutos
        path: "/",
    });

    // Guardamos el refresh token en cookie HTTPOnly
    response.cookies.set({
        name: "refreshToken",
        value: refreshtoken,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 7, // 7 días
        path: "/",
    });

    return response;
}

// Función auxiliar para transformar atributos LDAP a objeto plano
function parseLdapAttributes(attributesArray) {
    const result = {};
    for (const attr of attributesArray) {
        result[attr.type] = attr.values?.[0] || "";
    }
    return result;
}
