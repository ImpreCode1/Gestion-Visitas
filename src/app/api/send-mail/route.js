import nodemailer from "nodemailer";

// Endpoint POST para enviar correos
export async function POST(req) {
  try {
    // Obtenemos los datos del correo desde el body de la petición
    const { to, subject, text } = await req.json();

    // Configuración del transporter de Nodemailer
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST, // Servidor SMTP
      port: process.env.EMAIL_PORT, // Puerto SMTP
      secure: false, // true para puerto 465, false para otros
    });

    // Enviamos el correo usando la configuración del transporter
    await transporter.sendMail({
      from: '"Sistema de Gestion de Visitas" <no-reply@impresistem.com>', // Remitente
      to,       // Destinatario(s)
      subject,  // Asunto
      text,     // Contenido del correo en texto plano
    });

    // Retornamos éxito en formato JSON
    return Response.json({ success: true, message: "Correo enviado (revisa Mailpit)" });
  } catch (error) {
    // En caso de error, lo mostramos en consola y devolvemos un 500
    console.error("Error enviando correo:", error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
