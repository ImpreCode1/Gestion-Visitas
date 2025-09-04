import nodemailer from "nodemailer";

export async function POST(req) {
  try {
    const { to, subject, text } = await req.json();

    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: false,
    });

    await transporter.sendMail({
      from: '"Sistema de Gestion de Visitas" <no-reply@impresistem.com>',
      to,
      subject,
      text,
    });

    return Response.json({ success: true, message: "Correo enviado (revisa Mailpit)" });
  } catch (error) {
    console.error("Error enviando correo:", error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
