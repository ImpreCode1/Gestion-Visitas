"use client";

import { useState } from "react";
import BotonAzul from "../../../components/boton_azul";
import logo from "../../../public/logo.png";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [userId, setUserId] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const email = event.target.email.value;
    const password = event.target.password.value;

    const response = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await response.json();

    if (!response.ok) {
      alert(data.error || "Error al iniciar sesión");
      return;
    }

    // Si necesita cambiar contraseña
    if (data.changePassword) {
      setUserId(data.id);
      setUserRole(data.role);
      setShowModal(true);
      return;
    }

    // Redirigir según rol
    const rutasPorRol = {
      admin: "/usuarios",
      gerente: "/agendar_visita",
      aprobador: "/aprobaciones",
    };
    router.push(rutasPorRol[data.role] || "/");
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    try {
      const res = await fetch(`/api/users/${userId}/change_password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPassword }),
      });
      if (!res.ok) throw new Error("Error al cambiar la contraseña");

      // Redirigir según rol
      const rutasPorRol = {
        admin: "/usuarios",
        gerente: "/agendar_visita",
        aprobador: "/aprobaciones",
      };
      router.push(rutasPorRol[userRole] || "/");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-sm">
        <div className="flex flex-col items-center justify-center text-center mb-6">
          <Image
            src={logo}
            alt="Logo"
            width={130}
            height={90}
            className="mb-6"
          />
          <h1 className="text-3xl font-bold text-blue-800">Iniciar Sesión</h1>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              htmlFor="email"
              className="block text-sm font-medium mb-2 text-gray-700"
            >
              Correo electrónico
            </label>
            <input
              type="email"
              name="email"
              id="email"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="nombre.apellido@impresistem.com"
            />
          </div>

          <div className="mb-6">
            <label
              htmlFor="password"
              className="block text-sm font-medium mb-2 text-gray-700"
            >
              Contraseña
            </label>
            <div className="relative w-full">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                id="password"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="••••••••"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-gray-500 hover:text-gray-700 text-sm font-medium"
                >
                  {showPassword ? "Ocultar" : "Ver"}
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-center">
            <BotonAzul type="submit">Ingresar</BotonAzul>
          </div>
        </form>
        {/* Modal de cambio de contraseña */}
        {showModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity duration-300">
            <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md transform transition-transform duration-300 scale-100">
              <h2 className="text-2xl font-semibold mb-6 text-center text-blue-700">
                Cambiar Contraseña
              </h2>

              {error && (
                <p className="text-red-600 mb-4 text-center font-medium">
                  {error}
                </p>
              )}

              {/* Nueva contraseña */}
              <div className="mb-4 w-full">
                <label className="block text-gray-600 font-medium mb-2">
                  Nueva Contraseña
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300 transition pr-16"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute inset-y-0 right-0 flex items-center justify-center pr-4 text-gray-500 hover:text-gray-700 font-medium"
                  >
                    {showNewPassword ? "Ocultar" : "Ver"}
                  </button>
                </div>
              </div>

              {/* Confirmar contraseña */}
              <div className="mb-6 w-full">
                <label className="block text-gray-600 font-medium mb-2">
                  Confirmar Contraseña
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300 transition pr-16"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 flex items-center justify-center pr-4 text-gray-500 hover:text-gray-700 font-medium"
                  >
                    {showConfirmPassword ? "Ocultar" : "Ver"}
                  </button>
                </div>
              </div>

              <button
                onClick={handleChangePassword}
                className="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-700 text-white font-semibold rounded-xl shadow-lg hover:from-blue-600 hover:to-blue-800 transition"
              >
                Cambiar Contraseña
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
