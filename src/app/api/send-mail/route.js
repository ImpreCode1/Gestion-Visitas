/**
 * @fileoverview Endpoint para el envío de correos a través de Nodemailer.
 * Permite enviar mensajes personalizados en formato texto o HTML,
 * corrigiendo automáticamente dominios `.local` a `.com` para evitar errores de entrega.
 */

import nodemailer from "nodemailer";

export async function POST(req) {
  try {
    // Extrae los datos del correo desde el cuerpo de la solicitud
    const { to, subject, text, html } = await req.json();

    // Normaliza los destinatarios: asegura que siempre sea un array
    let destinatarios = Array.isArray(to) ? to : [to];

    // Corrige los dominios ".local" reemplazándolos por ".com"
    destinatarios = destinatarios.map((email) =>
      email.endsWith(".local") ? email.replace(/\.local$/, ".com") : email
    );

    // Configura el transporte SMTP para Nodemailer con las variables de entorno
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Envía el correo electrónico con el contenido proporcionado
    await transporter.sendMail({
      from: '"Sistema de Gestión de Visitas" <no-reply@impresistem.com>',
      to: destinatarios,
      subject,
      text,
      html,
    });

    // Retorna una respuesta JSON confirmando el envío exitoso
    return Response.json({
      success: true,
      message: "Correo enviado correctamente",
    });
  } catch (error) {
    // Registra el error y devuelve una respuesta con estado 500
    console.error("Error enviando correo:", error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
