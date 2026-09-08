const { SignJWT } = require("jose");
const crypto = require("crypto");

const secret = process.env.SERVICE_TOKEN_SECRET;
if (!secret) {
  console.error("ERROR: SERVICE_TOKEN_SECRET no está definida en el entorno.");
  console.error("Ejemplo: SERVICE_TOKEN_SECRET=mi-secreto node scripts/generate-service-token.js");
  process.exit(1);
}

const encodedSecret = new TextEncoder().encode(secret);

async function generate() {
  const token = await new SignJWT({ service: "control-contable" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1y")
    .sign(encodedSecret);

  console.log("Token de servicio (cópialo al .env de Control-Contable):\n");
  console.log(token);
  console.log("\nBearer " + token);
}

generate().catch(console.error);