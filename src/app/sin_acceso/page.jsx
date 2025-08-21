"use client";

import { useRouter } from "next/navigation";
import { FaExclamationTriangle, FaEnvelope, FaSignOutAlt } from "react-icons/fa";

export default function SinAccesoPage() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch("/api/logout", { method: "POST" });
      router.push("/");
    } catch (error) {
      console.error("Error cerrando sesión:", error);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-red-100 to-red-300">
      <div className="w-full max-w-lg bg-white rounded-xl shadow-lg p-8 text-center">
        <div className="flex justify-center mb-4">
          <FaExclamationTriangle className="text-red-500 text-5xl" />
        </div>
        <h1 className="text-2xl font-bold text-red-700 mb-2">Acceso restringido</h1>
        <p className="text-gray-700 mb-6">
          Tu cuenta no tiene permisos para acceder a esta sección del sistema.
          Si crees que esto es un error, por favor comunícate con el administrador.
        </p>

        <div className="flex flex-col items-center gap-3">
          <a
            href="mailto:admin@impresistem.local"
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <FaEnvelope />
            Contactar al administrador
          </a>

          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-200 text-red-600 rounded-lg hover:bg-gray-300 transition-colors"
          >
            <FaSignOutAlt />
            Volver al inicio
          </button>
        </div>
      </div>
    </div>
  );
}
