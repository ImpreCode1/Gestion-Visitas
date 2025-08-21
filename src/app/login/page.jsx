"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import { FaUser, FaLock } from "react-icons/fa";

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

      Swal.fire({
        title: "Bienvenido",
        text: `Hola ${data.displayName || email}`,
        icon: "success",
        timer: 2000,
        showConfirmButton: false,
      });

      router.push("/usuarios");
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
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-100 to-blue-300">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-lg transition-all duration-300 hover:shadow-2xl">
        <h2 className="mb-6 text-center text-3xl font-extrabold text-blue-700">
          Log In
        </h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-semibold text-gray-700"
            >
              Usuario
            </label>
            <div className="relative mt-1">
              <FaUser className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                id="email"
                name="email"
                required
                placeholder="nombre.apellido"
                className="w-full rounded-lg border border-gray-300 pl-10 pr-3 py-2 text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-semibold text-gray-700"
            >
              Contraseña
            </label>
            <div className="relative mt-1">
              <FaLock className="absolute left-3 top-3 text-gray-400" />
              <input
                type="password"
                id="password"
                name="password"
                required
                placeholder="••••••••"
                className="w-full rounded-lg border border-gray-300 pl-10 pr-3 py-2 text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 py-2 font-semibold text-white transition-colors duration-200 hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Iniciando..." : "Ingresar"}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-gray-500">
          © Impresistem {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
