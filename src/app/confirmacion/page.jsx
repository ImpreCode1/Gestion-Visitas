"use client";

import { useSearchParams } from "next/navigation";

export default function ConfirmacionPage() {
  const searchParams = useSearchParams();
  const estado = searchParams.get("estado");

  const getMensaje = () => {
    switch (estado) {
      case "aprobado":
        return {
          titulo: "✅ Visita aprobada",
          mensaje:
            "Gracias, se ha registrado tu aprobación correctamente. Puedes cerrar esta ventana.",
          color: "text-green-600",
          fondo: "bg-green-50",
          borde: "border-green-300",
        };
      case "rechazado":
        return {
          titulo: "❌ Visita rechazada",
          mensaje:
            "Tu decisión ha sido registrada correctamente. Puedes cerrar esta ventana.",
          color: "text-red-600",
          fondo: "bg-red-50",
          borde: "border-red-300",
        };
      default:
        return {
          titulo: "⚠️ Enlace no válido o expirado",
          mensaje:
            "Este enlace ya fue utilizado o no es válido. Si crees que es un error, contacta al administrador.",
          color: "text-gray-700",
          fondo: "bg-gray-50",
          borde: "border-gray-300",
        };
    }
  };

  const { titulo, mensaje, color, fondo, borde } = getMensaje();

  return (
    <div
      className={`min-h-screen flex flex-col items-center justify-center p-6 ${fondo}`}
    >
      <div
        className={`border ${borde} rounded-2xl shadow-md p-10 max-w-md text-center bg-white`}
      >
        <h1 className={`text-2xl font-semibold mb-4 ${color}`}>{titulo}</h1>
        <p className="text-gray-600">{mensaje}</p>

        <div className="mt-8">
          <a href="/" className="text-sm text-blue-600 hover:underline">
            Ir a la plataforma de gestión de visitas
          </a>
        </div>
      </div>
    </div>
  );
}
