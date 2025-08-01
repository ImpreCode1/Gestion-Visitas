"use client";

import BotonAzul from "../../../components/boton_azul";
import logo from "../../../public/logo.png";
import Image from "next/image";

const handleSubmit = async (event) => {
  event.preventDefault();
  const email = event.target.email.value;
  const password = event.target.password.value;
  const response = await fetch("/api/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });
  const data = await response.json();

  if (!response.ok) {
    alert(data.error || "Error al iniciar sesión");
    return;
  }
  
  alert("Inicio de sesión exitoso");
  window.location.href = "/prueba";
};

export default function LoginPage() {
  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-sm">
        <div className="relative z-20 flex flex-col items-center justify-center h-full px-6 text-center text-white">
          <Image
            src={logo}
            alt="Logo Impresistem"
            width={130}
            height={90}
            className="mb-6"
          />
        </div>
        <h1 className="text-3xl font-bold mb-6 text-center text-blue-800">
          Iniciar Sesión
        </h1>

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
            <input
              type="password"
              name="password"
              id="password"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
            />
          </div>

          <div className="flex justify-center">
            <BotonAzul type="submit">Ingresar</BotonAzul>
          </div>
        </form>
      </div>
    </div>
  );
}
