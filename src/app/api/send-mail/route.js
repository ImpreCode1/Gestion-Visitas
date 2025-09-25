import nodemailer from "nodemailer";

// Endpoint POST para enviar correos
export async function POST(req) {
  try {
    // Obtenemos los datos del correo desde el body de la petición
    const { to, subject, text, html } = await req.json();

    // Normalizamos destinatarios (puede ser string o array)
    let destinatarios = Array.isArray(to) ? to : [to];

    // Reemplazamos .local por .com en todos los correos
    destinatarios = destinatarios.map(email =>
      email.endsWith(".local") ? email.replace(/\.local$/, ".com") : email
    );

    // Configuración del transporter de Nodemailer
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST, // Servidor SMTP
      port: process.env.EMAIL_PORT, // Puerto SMTP
      secure: false, // true para puerto 465, false para otros
    });

    // Enviamos el correo usando la configuración del transporter
    await transporter.sendMail({
      from: '"Sistema de Gestion de Visitas" <no-reply@impresistem.com>',
      to: destinatarios, // Destinatario(s) corregidos
      subject,
      text,
      html,
    });

    return Response.json({ success: true, message: "Correo enviado correctamente" });
  } catch (error) {
    console.error("Error enviando correo:", error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
