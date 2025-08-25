"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  FaSignOutAlt,
  FaUserCircle,
  FaClipboardList,
  FaChartPie,
} from "react-icons/fa";
import logo from "../public/logo.png";
import BotonRojo from "./boton_rojo";

const menusPorRol = {
  gerenteProducto: [
    {
      label: "Agendar visita",
      href: "/agendar_visita",
      icon: <FaClipboardList />,
    },
    {
      label: "Mis visitas",
      href: "/mis_visitas",
      icon: <FaChartPie />,
    },
    {
      label: "Legalizar gastos",
      href: "/legalizar_gastos",
      icon: <FaClipboardList />,
    },
  ],
  admin: [
    {
      label: "Panel de administración",
      href: "/admin",
      icon: <FaChartPie />,
    },
  ],
  aprobador: [
    {
      label: "Aprobar visitas",
      href: "/aprobar_visitas",
      icon: <FaClipboardList />,
    },
  ],
  trainee: [
    {
      label: "Agendar visita",
      href: "/agendar_visita",
      icon: <FaClipboardList />,
    },
    {
      label: "Mis visitas",
      href: "/mis_visitas",
      icon: <FaChartPie />,
    },
    {
      label: "Legalizar gastos",
      href: "/legalizar_gastos",
      icon: <FaClipboardList />,
    },
    {
      label: "Panel de administración",
      href: "/usuarios",
      icon: <FaChartPie />,
    },
  ],
  sinRol: [],
};

export default function Sidebar({ sidebarAbierto, setSidebarAbierto }) {
  const [nombre, setNombre] = useState("");
  const [rol, setRol] = useState("");

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/me");
        if (res.ok) {
          const data = await res.json();
          setNombre(data.displayName);
          setRol(data.role || "sinRol");
        }
      } catch (err) {
        console.error("Error fetching user info:", err);
      }
    };
    fetchUser();
  }, []);

  const menus = menusPorRol[rol] || [];

  const handleLogout = async () => {
    const res = await fetch("/api/logout", { method: "POST" });
    if (res.ok) window.location.href = "/login";
  };

  return (
    <>
      {sidebarAbierto && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={() => setSidebarAbierto(false)}
        />
      )}

      <div
        className={`bg-gradient-to-b from-slate-900 to-slate-800 text-white h-screen transition-all duration-300 z-50 flex flex-col shadow-lg border-r border-slate-700
        ${sidebarAbierto ? "w-56" : "w-16"}   // 👈 más compacto
        md:relative md:translate-x-0
        fixed top-0 left-0 transform ${
          sidebarAbierto
            ? "translate-x-0"
            : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Botón de plegar */}
        <button
          onClick={() => setSidebarAbierto(!sidebarAbierto)}
          className="m-3 p-2 text-xl hover:bg-white/10 rounded-full transition-all duration-200 self-end"
          aria-label={sidebarAbierto ? "Cerrar sidebar" : "Abrir sidebar"}
        >
          {sidebarAbierto ? "⮜" : "☰"}
        </button>

        {/* Logo y nombre */}
        <div className="flex flex-col items-center py-6 px-4 border-b border-white/10 bg-white/5 mx-3 rounded-xl mb-4">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full opacity-30 group-hover:opacity-50 transition-opacity duration-300 blur" />
            <div className="relative bg-white/10 backdrop-blur-sm rounded-full p-2 border border-white/20">
              <Image
                src={logo}
                alt="Logo"
                width={50}
                height={50}
                className="rounded-full"
              />
            </div>
          </div>
          {sidebarAbierto && nombre && (
            <div className="mt-3 text-center">
              <p className="text-lg font-semibold text-white/95">{nombre}</p>
              <div className="mt-1 h-0.5 w-16 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full mx-auto" />
            </div>
          )}
        </div>

        {/* Menú */}
        <nav className="flex-1 px-3 space-y-2">
          {menus.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group flex items-center gap-3 p-3 rounded-lg hover:bg-gradient-to-r hover:from-blue-600/30 hover:to-purple-600/30 transition-all duration-200 text-sm border border-transparent hover:border-white/10 backdrop-blur-sm hover:shadow-md"
              onClick={() => {
                if (window.innerWidth < 768) setSidebarAbierto(false);
              }}
            >
              <span className="text-lg text-white/80 group-hover:text-white transition-colors duration-200">
                {item.icon}
              </span>
              {sidebarAbierto && (
                <span className="font-medium text-white/90 group-hover:text-white transition-colors duration-200">
                  {item.label}
                </span>
              )}
            </Link>
          ))}
        </nav>

        {/* Usuario y logout */}
        <div className="mt-auto px-3 py-4 border-t border-white/10 bg-white/5 mx-3 rounded-t-xl">
          {sidebarAbierto ? (
            <div className="flex flex-col items-center gap-3">
              <FaUserCircle className="text-4xl text-white/90" />
              <BotonRojo
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 border border-red-500/30 backdrop-blur-sm transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg hover:shadow-red-500/25"
              >
                <FaSignOutAlt className="text-sm" />
                <span className="font-medium">Salir</span>
              </BotonRojo>
            </div>
          ) : (
            <div className="flex justify-center">
              <button
                onClick={handleLogout}
                className="group text-red-400 text-xl hover:text-white transition-all duration-200 p-2 rounded-full hover:bg-red-600/20 border border-transparent hover:border-red-500/30 backdrop-blur-sm hover:scale-110 active:scale-95"
                aria-label="Cerrar sesión"
              >
                <FaSignOutAlt />
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
