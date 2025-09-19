"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  FaSignOutAlt,
  FaUserCircle,
  FaCalendarAlt,
  FaClipboardList,
  FaMoneyBill,
  FaUserShield,
  FaCheckCircle,
  FaAutoprefixer
} from "react-icons/fa";
import logo from "../public/logo.png";
import BotonRojo from "./boton_rojo";
import { Menu, ChevronLeft } from "lucide-react";

const menusPorRol = {
  gerenteProducto: [
    {
      titulo: "Visitas",
      items: [
        { label: "Agendar visita", href: "/agendar_visita", icon: <FaCalendarAlt /> },
        { label: "Mis visitas", href: "/mis_visitas", icon: <FaClipboardList /> },
      ],
    },
    {
      titulo: "Gastos",
      items: [
        { label: "Legalizar gastos", href: "/legalizar_gastos", icon: <FaMoneyBill /> },
      ],
    },
  ],
  admin: [
    {
      titulo: "Administración",
      items: [
        { label: "Usuarios", href: "/admin/usuarios", icon: <FaUserShield /> },
        { label: "Visitas", href: "/admin/visitas", icon: <FaAutoprefixer /> },
      ],
    },
    {
      titulo: "Visitas",
      items: [
        { label: "Agendar visita", href: "/agendar_visita", icon: <FaCalendarAlt /> },
        { label: "Mis visitas", href: "/mis_visitas", icon: <FaClipboardList /> },
      ],
    },
    {
      titulo: "Gastos",
      items: [
        { label: "Legalizar gastos", href: "/legalizar_gastos", icon: <FaMoneyBill /> },
      ],
    },
  ],
  vicepresidente: [
    {
      titulo: "Aprobaciones",
      items: [
        { label: "Solicitudes", href: "/aprobaciones", icon: <FaUserShield /> },
      ],
    },
    {
      titulo: "Visitas",
      items: [
        { label: "Agendar visita", href: "/agendar_visita", icon: <FaCalendarAlt /> },
        { label: "Mis visitas", href: "/mis_visitas", icon: <FaClipboardList /> },
      ],
    },
    {
      titulo: "Gastos",
      items: [
        { label: "Legalizar gastos", href: "/legalizar_gastos", icon: <FaMoneyBill /> },
      ],
    },
  ],
  aprobador: [
    {
      titulo: "Aprobaciones",
      items: [
        { label: "Aprobar visitas", href: "/aprobaciones", icon: <FaCheckCircle /> },
      ],
    },
    {
      titulo: "Visitas",
      items: [
        { label: "Agendar visita", href: "/agendar_visita", icon: <FaCalendarAlt /> },
        { label: "Mis visitas", href: "/mis_visitas", icon: <FaClipboardList /> },
      ],
    },
  ],
  trainee: [
    {
      titulo: "Visitas",
      items: [
        { label: "Agendar visita", href: "/agendar_visita", icon: <FaCalendarAlt /> },
        { label: "Mis visitas", href: "/mis_visitas", icon: <FaClipboardList /> },
      ],
    },
    {
      titulo: "Gastos",
      items: [
        { label: "Legalizar gastos", href: "/legalizar_gastos", icon: <FaMoneyBill /> },
      ],
    },
    {
      titulo: "Administración",
      items: [
        { label: "Usuarios", href: "/admin/usuarios", icon: <FaUserShield /> },
        { label: "Visitas", href: "/admin/visitas", icon: <FaAutoprefixer /> },
      ],
    },
    {
      titulo: "Aprobaciones",
      items: [
        { label: "Aprobaciones", href: "/aprobaciones", icon: <FaCheckCircle /> },
      ],
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
      {/* Overlay en mobile */}
      {sidebarAbierto && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={() => setSidebarAbierto(false)}
        />
      )}

      <aside
        className={`bg-gray-800 text-white fixed md:static top-0 left-0 h-screen transition-all duration-300 z-50 flex flex-col
        ${sidebarAbierto ? "w-64" : "w-16"} 
        ${sidebarAbierto ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
      `}
      >
        {/* Header con logo */}
        <div className="py-4 px-2 flex items-center justify-between bg-gray-900 border-b border-gray-700">
          {sidebarAbierto && (
            <div className="flex items-center gap-2">
              <Image src={logo} alt="Logo" width={35} height={35} />
              <span className="uppercase tracking-widest text-sm font-bold">
                Visitas
              </span>
            </div>
          )}
          <button
            onClick={() => setSidebarAbierto(!sidebarAbierto)}
            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 focus:outline-none"
          >
            {sidebarAbierto ? (
              <ChevronLeft className="h-6 w-6 text-gray-700" />
            ) : (
              <Menu className="h-6 w-6 text-gray-700" />
            )}
          </button>
        </div>

        {/* Menú con secciones */}
        <nav className="flex-1 overflow-y-auto text-sm">
          <ul className="flex flex-col py-4">
            {menus.map((seccion, i) => (
              <li key={i} className="mb-4">
                {sidebarAbierto && (
                  <h3 className="px-4 text-xs uppercase text-gray-400 font-semibold tracking-wider mb-2">
                    {seccion.titulo}
                  </h3>
                )}
                <ul className="flex flex-col">
                  {seccion.items.map((item) => (
                    <li key={item.href} className="px-2">
                      <Link
                        href={item.href}
                        className="flex items-center gap-3 py-3 px-2 rounded-md hover:bg-gray-700 transition"
                        onClick={() => {
                          if (window.innerWidth < 768) setSidebarAbierto(false);
                        }}
                      >
                        <span className="w-5 h-5 flex items-center justify-center text-gray-400">
                          {item.icon}
                        </span>
                        {sidebarAbierto && (
                          <span className="text-gray-200">{item.label}</span>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </nav>

        {/* Usuario + logout */}
        <div className="border-t border-gray-700 p-3">
          {sidebarAbierto ? (
            <div className="flex flex-col items-center gap-2">
              <FaUserCircle className="text-4xl text-gray-300" />
              <p className="text-sm">{nombre}</p>
              <BotonRojo
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2"
              >
                <FaSignOutAlt className="text-sm" />
                <span>Salir</span>
              </BotonRojo>
            </div>
          ) : (
            <div className="flex justify-center">
              <button
                onClick={handleLogout}
                className="p-2 text-red-400 hover:text-white hover:bg-red-600/20 rounded-full"
              >
                <FaSignOutAlt />
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
