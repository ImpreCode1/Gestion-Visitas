import { NextResponse } from "next/server";
import ldap from "ldapjs"; // Librería para conectarse a LDAP (Active Directory)
import jwt from "jsonwebtoken"; // Para generar tokens JWT
import { PrismaClient } from "@prisma/client"; // ORM para la base de datos

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
  } else if (t.includes("vicepresident")) {
    return "vicepresidente";
  } else if (t.includes("admin") || t.includes("administrador")) {
    return "admin";
  } else if (
    t.includes("internal procurement") ||
    t.includes("internal supply")
  ) {
    return "aprobador";
  } else if (t.includes("trainee")) {
    return "trainee";
  } else {
    return "sinRol";
  }
}

const prisma = new PrismaClient(); // Inicializamos cliente de Prisma

// Secretos para JWT obtenidos de variables de entorno
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

//
// Endpoint POST para login/autenticación vía LDAP
export async function POST(request) {
  const { email, password } = await request.json();

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email y contraseña son requeridos" },
      { status: 400 }
    );
  }

  const username = email.split("@")[0];

  let userInfo = {};
  let role = "sinRol";
  let tipoaprobador = "null";

  // 🚨 Si estamos en desarrollo, saltamos LDAP
  if (process.env.NODE_ENV !== "production") {
    console.log("⚡ Modo desarrollo: Bypass LDAP");

    // Usuario ficticio para pruebas
    userInfo = {
      displayName: "Usuario Prueba",
      mail: email,
      department: "Human Talent and Administrative",
      title: "Trainee",
      mobile: "3001234567",
    };

    role = determinarRol(userInfo.title);
    console.log(role);
    if (role === "aprobador") {
      if ((userInfo.title || "").includes("Internal Procurement")) {
        tipoaprobador = "adquisiciones";
      } else if ((userInfo.title || "").includes("Internal Supply")) {
        tipoaprobador = "suministros";
      }
    }
  } else {
    // 🔐 Flujo real de LDAP (como ya lo tenías)
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
        return NextResponse.json(
          { error: "Usuario o contraseña inválidos" },
          { status: 401 }
        );
      }
    }

    userInfo = await new Promise((resolve, reject) => {
      const opts = {
        filter: `(sAMAccountName=${username})`,
        scope: "sub",
        attributes: ["displayName", "mail", "department", "title", "mobile"],
      };

      client.search("DC=IMPRESISTEM,DC=local", opts, (err, res) => {
        if (err) return reject(err);

        let user = {};
        res.on("searchEntry", (entry) => {
          user = parseLdapAttributes(entry.pojo.attributes);
        });

        res.on("end", () => resolve(user));
        res.on("error", (err) => reject(err));
      });
    });

    client.unbind();

    role = determinarRol(userInfo.title || "");
    if (role === "aprobador") {
      if ((userInfo.title || "").includes("Internal Procurement")) {
        tipoaprobador = "adquisiciones";
      } else if ((userInfo.title || "").includes("Internal Supply")) {
        tipoaprobador = "suministros";
      }
    }
  }

  // 🚀 Aquí sigue tu lógica de Prisma + JWT como ya la tienes
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
      tipoaprobador,
    },
  });

  const accesstoken = jwt.sign(
    {
      email,
      displayName: userInfo.displayName || "",
      department: userInfo.department || "",
      title: userInfo.title || "",
      role: role || "sinRol",
      typerole: tipoaprobador || ""
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
      role: role || "sinRol",
      typerole: tipoaprobador || ""
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

// Función auxiliar para transformar atributos LDAP a objeto plano
function parseLdapAttributes(attributesArray) {
  const result = {};
  for (const attr of attributesArray) {
    result[attr.type] = attr.values?.[0] || "";
  }
  return result;
}
