// pages/api/login.js
import ldap from "ldapjs";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Determina el rol a partir del título en AD
function determinarRol(title = "") {
  const t = (title || "").toLowerCase();
  if (t.includes(process.env.NOTAS_CREDITO)) return "notas_credito";
  if (
    t.includes(process.env.INTERNAL_PROCUREMENT) ||
    t.includes(process.env.INTERNAL_SUPPLY)
  )
    return "aprobador";
  if (
    t.includes(process.env.PRODUCT_MANAGER) ||
    t.includes(process.env.DIRECTOR) ||
    t.includes(process.env.TEAM_LEADER)
  )
    return "gerenteProducto";
  if (t.includes(process.env.VICEPRESIDENTE)) return "vicepresidente";
  if (t.includes(process.env.ADMINISTRADOR)) return "admin";
  if (t.includes(process.env.TRAINEE)) return "trainee";
  return "sinRol";
}

export default async function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Método no permitido" });

  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: "Email y contraseña son requeridos" });

  const username = email.split("@")[0];
  let userInfo = {};
  let tipoaprobador = "null";

  // --- BYPASS LDAP ---
  if (process.env.BYPASS_LDAP === "true") {
    console.log("⚡ Bypass LDAP activado");
    userInfo = {
      displayName: "Usuario Prueba",
      mail: email,
      department: "Administrative and Human Talent",
      title: "xd",
      mobile: "3001234567",
    };
  } else {
    // Conexión LDAP
    const userUPN = `${username}@impresistem.local`;
    const userNetBIOS = `IMPRESISTEM\\${username}`;
    const client = ldap.createClient({ url: "ldap://impresistem.local" });

    const tryBind = (user) =>
      new Promise((resolve, reject) =>
        client.bind(user, password, (err) =>
          err ? reject(err) : resolve(user)
        )
      );

    try {
      try {
        await tryBind(userUPN);
      } catch {
        await tryBind(userNetBIOS);
      }
    } catch (err) {
      console.error("❌ Error autenticando:", err);
      return res.status(401).json({ error: "Usuario o contraseña inválidos" });
    }

    // Buscar info LDAP
    userInfo = await new Promise((resolve, reject) => {
      const opts = {
        filter: `(sAMAccountName=${username})`,
        scope: "sub",
        attributes: ["displayName", "mail", "department", "title", "mobile"],
      };

      client.search("DC=IMPRESISTEM,DC=local", opts, (err, search) => {
        if (err) return reject(err);

        let found = false;

        search.on("searchEntry", (entry) => {
          found = true;
          const user = {};
          if (entry.attributes && Array.isArray(entry.attributes)) {
            for (const attr of entry.attributes)
              user[attr.type] = attr.values?.[0] || "";
          } else if (entry.object) {
            // fallback
            user.displayName = entry.object.displayName || "";
            user.mail = entry.object.mail || "";
            user.department = entry.object.department || "";
            user.title = entry.object.title || "";
            user.mobile = entry.object.mobile || "";
          }
          console.log("✅ Usuario encontrado en LDAP (parseado):", user);
          resolve(user);
        });

        search.on("error", (err) => reject(err));
        search.on("end", () => {
          if (!found) {
            console.warn("⚠ No se encontró usuario en LDAP");
            resolve(null);
          }
        });
      });
    });

    client.unbind();

    if (!userInfo)
      return res.status(401).json({ error: "Usuario no encontrado en LDAP" });
  }

  // Revisamos si el usuario ya existe en la base de datos
  let usuario = await prisma.user.findUnique({ where: { email } });

  if (!usuario) {
    // Primera vez → creamos usuario con info LDAP o fake
    const role = determinarRol(userInfo.title || "");
    if (role === "aprobador") {
      if ((userInfo.title || "").includes("Internal Procurement"))
        tipoaprobador = "adquisiciones";
      else if ((userInfo.title || "").includes("Internal Supply"))
        tipoaprobador = "suministros";
    }

    usuario = await prisma.user.create({
      data: {
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
  }

  // Firma tokens con la info de la DB (si existe se usa esa info)
  const accesstoken = jwt.sign(
    {
      email: usuario.email,
      displayName: usuario.name,
      department: usuario.department,
      title: usuario.position,
      role: usuario.role,
      typerole: usuario.tipoaprobador,
    },
    process.env.JWT_SECRET,
    { expiresIn: "15m" }
  );

  const refreshtoken = jwt.sign(
    {
      email: usuario.email,
      displayName: usuario.name,
      department: usuario.department,
      title: usuario.position,
      role: usuario.role,
      typerole: usuario.tipoaprobador,
    },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: "1d" }
  );

  // ------------------------------
  // Cookie settings that work in LAN & production:
  // - SameSite=Lax (permite navegación normal)
  // - Secure only if the incoming request is actually HTTPS
  // ------------------------------
  const forwardedProto = req.headers["x-forwarded-proto"];
  const isRequestSecure =
    forwardedProto === "https" || req.socket?.encrypted === true;
  const isProd = process.env.NODE_ENV === "production";
  const secureFlag = isProd && isRequestSecure; // secure only when running over real HTTPS in production

  // Max-Age values
  const ACCESS_MAX_AGE = 15 * 60; // 15 minutes in seconds
  const REFRESH_MAX_AGE = 24 * 60 * 60; // 1 day

  const tokenCookie = `token=${accesstoken}; HttpOnly; Path=/; Max-Age=${ACCESS_MAX_AGE}; SameSite=Lax${
    secureFlag ? "; Secure" : ""
  }`;
  const refreshCookie = `refreshToken=${refreshtoken}; HttpOnly; Path=/; Max-Age=${REFRESH_MAX_AGE}; SameSite=Lax${
    secureFlag ? "; Secure" : ""
  }`;

  res.setHeader("Set-Cookie", [tokenCookie, refreshCookie]);

  return res.status(200).json({ ok: true });
}
