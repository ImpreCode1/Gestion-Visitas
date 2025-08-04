"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { FaSignOutAlt, FaUserCircle, FaClipboardList, FaChartPie } from "react-icons/fa";
import logo from "../public/logo.png";
import BotonRojo from "./boton_rojo";

const menusPorRol = {
  gerente: [
    { label: "Visitas", href: "/visitas", icon: <FaClipboardList /> },
    { label: "Mis gastos", href: "/gastos", icon: <FaChartPie /> },
  ],
  aprobador: [{ label: "Aprobar solicitudes", href: "/aprobaciones", icon: <FaClipboardList /> }],
  admin: [
    { label: "Usuarios", href: "/usuarios", icon: <FaUserCircle /> },
    { label: "Reportes", href: "/reportes", icon: <FaChartPie /> },
  ],
};

export default function Sidebar({ sidebarAbierto, setSidebarAbierto }) {
  const [rol, setRol] = useState(null);
  const [nombre, setNombre] = useState(null);

  useEffect(() => {
    const cookies = Object.fromEntries(
      document.cookie.split("; ").map((c) => c.split("="))
    );
    setRol(cookies["x-role"]);
    setNombre(cookies["x-user"]);
  }, []);

  const menus = menusPorRol[rol] || [];

  const handleLogout = async () => {
    const res = await fetch("/api/logout", { method: "POST" });
    if (res.ok) window.location.href = "/login";
  };

  return (
    <>
      {/* Fondo oscuro para móvil cuando está abierto */}
      {sidebarAbierto && (
        <div 
          className="fixed inset-0 bg-black opacity-40 z-40 md:hidden" 
          onClick={() => setSidebarAbierto(false)} 
        />
      )}
      
      {/* Sidebar */}
      <div
        className={`bg-gradient-to-b from-[#0f172a] to-[#1e293b] text-white h-screen transition-all duration-300 z-50 flex flex-col shadow-2xl border-r border-slate-700/50
          ${sidebarAbierto ? "w-64" : "w-16"}
          md:relative md:translate-x-0
          fixed top-0 left-0 transform ${sidebarAbierto ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        {/* Botón de plegar */}
        <button
          onClick={() => setSidebarAbierto(!sidebarAbierto)}
          className="m-3 p-3 text-lg font-bold hover:bg-white/10 transition-all duration-200 self-end rounded-xl backdrop-blur-sm border border-white/10 hover:border-white/20 hover:scale-105 active:scale-95"
          aria-label={sidebarAbierto ? "Cerrar sidebar" : "Abrir sidebar"}
        >
          <span className="block transform transition-transform duration-200">
            {sidebarAbierto ? "⮜" : "☰"}
          </span>
        </button>

        {/* Logo y nombre */}
        <div className="flex flex-col items-center py-6 px-4 border-b border-white/10 bg-white/5 backdrop-blur-sm mx-3 rounded-xl mb-4">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full opacity-30 group-hover:opacity-50 transition-opacity duration-300 blur"></div>
            <div className="relative bg-white/10 backdrop-blur-sm rounded-full p-2 border border-white/20">
              <Image src={logo} alt="Logo" width={50} height={50} className="rounded-full" />
            </div>
          </div>
          {sidebarAbierto && nombre && (
            <div className="mt-3 text-center">
              <p className="text-sm font-medium text-white/90 break-words px-2">{nombre}</p>
              <div className="mt-1 h-0.5 w-16 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full mx-auto"></div>
            </div>
          )}
        </div>

        {/* Menú */}
        <div className="mt-2 flex-1 px-3 space-y-2">
          {menus.map((item, index) => (
            <Link
              key={item.href}
              href={item.href}
              className="group relative flex items-center gap-3 p-3 rounded-xl hover:bg-gradient-to-r hover:from-blue-600/20 hover:to-purple-600/20 transition-all duration-200 text-sm border border-transparent hover:border-white/10 backdrop-blur-sm hover:shadow-lg hover:scale-[1.02]"
              onClick={() => {
                // Cerrar sidebar en móvil al hacer clic en un enlace
                if (window.innerWidth < 768) {
                  setSidebarAbierto(false);
                }
              }}
            >
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg opacity-0 group-hover:opacity-30 transition-opacity duration-200 blur-sm"></div>
                <span className="relative text-lg text-white/80 group-hover:text-white transition-colors duration-200">
                  {item.icon}
                </span>
              </div>
              {sidebarAbierto && (
                <span className="font-medium text-white/90 group-hover:text-white transition-colors duration-200">
                  {item.label}
                </span>
              )}
              <div className="absolute right-2 w-1 h-1 bg-blue-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
            </Link>
          ))}
        </div>

        {/* Usuario abajo con avatar y logout */}
        <div className="mt-auto px-3 py-4 border-t border-white/10 bg-white/5 backdrop-blur-sm mx-3 rounded-t-xl">
          {sidebarAbierto ? (
            <div className="flex flex-col items-center gap-3">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full opacity-30 group-hover:opacity-50 transition-opacity duration-300 blur"></div>
                <FaUserCircle className="relative text-4xl text-white/90 group-hover:text-white transition-colors duration-200" />
              </div>
              <BotonRojo 
                onClick={handleLogout} 
                className="w-full text-center flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 border border-red-500/30 backdrop-blur-sm transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg hover:shadow-red-500/25"
              >
                <FaSignOutAlt className="text-sm" /> 
                <span className="font-medium">Salir</span>
              </BotonRojo>
            </div>
          ) : (
            <div className="flex justify-center">
              <button 
                onClick={handleLogout} 
                className="group relative text-red-400 text-xl hover:text-white transition-all duration-200 p-2 rounded-xl hover:bg-red-600/20 border border-transparent hover:border-red-500/30 backdrop-blur-sm hover:scale-110 active:scale-95"
                aria-label="Cerrar sesión"
              >
                <div className="absolute -inset-1 bg-gradient-to-r from-red-600 to-red-700 rounded-xl opacity-0 group-hover:opacity-20 transition-opacity duration-200 blur"></div>
                <FaSignOutAlt className="relative" />
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}