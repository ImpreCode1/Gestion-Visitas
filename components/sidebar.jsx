"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import BotonRojo from "./boton_rojo";
import logo from "../public/logo.png";
import Image from "next/image";

const menusPorRol = {
  gerente: [
    { label: "Visitas", href: "/visitas" },
    { label: "Mis gastos", href: "/gastos" },
  ],
  aprobador: [{ label: "Aprobar solicitudes", href: "/aprobaciones" }],
  admin: [
    { label: "Usuarios", href: "/usuarios" },
    { label: "Reportes", href: "/reportes" },
  ],
};

export default function Sidebar() {
  const [abierto, setAbierto] = useState(true);
  const [rol, setRol] = useState(null);
  const [nombre, setNombre] = useState(null);
  useEffect(() => {
    const cookies = Object.fromEntries(
      document.cookie.split("; ").map((c) => c.split("="))
    );

    if (cookies["x-role"]) {
      setRol(cookies["x-role"]);
    }

    if (cookies["x-user"]) {
      setNombre(cookies["x-user"]);
    }
  }, []);

  const menus = menusPorRol[rol] || [];

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/logout", {
        method: "POST",
      });

      if (res.ok) {
        // Redirigir al login
        window.location.href = "/login";
      } else {
        console.error("Error al cerrar sesión");
      }
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  return (
    <div
      className={`bg-[#1f2937] text-gray-200 h-screen overflow-y-auto transition-all duration-300 ${
        abierto ? "w-64" : "w-16"
      } flex flex-col`}
    >
      <button
        onClick={() => setAbierto(!abierto)}
        className="p-2 hover:bg-[#374151] text-lg font-bold transition"
      >
        {abierto ? "⮜" : "☰"}
      </button>

      {/* Header con logo y usuario */}
      {abierto && (
        <div className="flex flex-col items-center py-4 border-b border-gray-700">
          <Image
            src={logo}
            alt="Logo"
            width={80}
            height={80}
            className="mb-2"
          />
          {nombre && (
            <p className="text-sm text-gray-300 text-center break-words px-2">
              {nombre}
            </p>
          )}
        </div>
      )}

      {/* Menú según rol */}
      {abierto && (
        <div className="mt-4 px-2 space-y-2">
          {menus.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block p-2 rounded hover:bg-[#2563eb] hover:text-white transition"
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}

      {/* Cerrar sesión al fondo */}
      {abierto && (
        <div className="mt-auto px-4 py-4 border-t border-gray-700 flex flex-col items-center">
          <BotonRojo onClick={handleLogout} className="w-full text-center">
            Cerrar sesión
          </BotonRojo>
        </div>
      )}
    </div>
  );
}
