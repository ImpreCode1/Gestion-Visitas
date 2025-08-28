"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);

    const rawUsername = event.target.email.value.trim();
    const password = event.target.password.value.trim();
    const email = rawUsername.includes("@")
      ? rawUsername
      : `${rawUsername}@impresistem.local`;

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al iniciar sesión");

      const meRes = await fetch("/api/me");
      const meData = await meRes.json();

      Swal.fire({
        title: "Bienvenido",
        text: `Hola ${meData.displayName || email}`,
        icon: "success",
        timer: 2000,
        showConfirmButton: false,
      });

      switch (meData.role) {
        case "gerenteProducto":
        case "trainee":
          router.push("/agendar_visita");
          break;
        case "admin":
          router.push("/usuarios");
          break;
        case "aprobador":
          router.push("/aprobaciones");
          break;
        default:
          router.push("/sin_acceso");
          break;
      }
    } catch (error) {
      Swal.fire({
        title: "Error",
        text: error.message,
        icon: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
      <div className="relative py-3 sm:max-w-xl sm:mx-auto">
        {/* Fondo diagonal */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900 to-slate-700 shadow-lg transform -skew-y-6 sm:skew-y-0 sm:-rotate-6 sm:rounded-3xl"></div>

        <div className="relative px-6 py-10 bg-white shadow-lg sm:rounded-3xl sm:px-16 sm:py-16">
          <div className="max-w-md mx-auto">
            <h1 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
              Iniciar Sesión
            </h1>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Usuario */}
              <div className="relative">
                <input
                  id="email"
                  name="email"
                  type="text"
                  autoComplete="off"
                  required
                  placeholder="Usuario"
                  className="peer placeholder-transparent h-10 w-full border-b-2 border-gray-300 text-gray-900 
                             focus:outline-none focus:border-cyan-500"
                />
                <label
                  htmlFor="email"
                  className="absolute left-0 -top-3.5 text-gray-600 text-sm 
                             peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 
                             peer-placeholder-shown:top-2 transition-all 
                             peer-focus:-top-3.5 peer-focus:text-gray-600 peer-focus:text-sm"
                >
                  Usuario
                </label>
              </div>

              {/* Contraseña */}
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  placeholder="Contraseña"
                  className="peer placeholder-transparent h-10 w-full border-b-2 border-gray-300 text-gray-900 
                             focus:outline-none focus:border-cyan-500"
                />
                <label
                  htmlFor="password"
                  className="absolute left-0 -top-3.5 text-gray-600 text-sm 
                             peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 
                             peer-placeholder-shown:top-2 transition-all 
                             peer-focus:-top-3.5 peer-focus:text-gray-600 peer-focus:text-sm"
                >
                  Contraseña
                </label>
              </div>

              {/* Botón */}
              <div className="relative">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-medium rounded-md px-4 py-2 
                             transition-colors disabled:opacity-50"
                >
                  {loading ? "Iniciando..." : "Ingresar"}
                </button>
              </div>
            </form>

            {/* Footer */}
            <p className="mt-6 text-center text-sm text-gray-500">
              © Impresistem {new Date().getFullYear()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
