"use client";

import { useState, useEffect } from "react";
import Sidebar from "../../../components/sidebar";

/**
 * Layout para páginas privadas del sistema.
 * - Incluye un sidebar lateral.
 * - Maneja visibilidad del sidebar según tamaño de pantalla.
 * - Permite abrir/cerrar sidebar en dispositivos móviles con un botón flotante.
 */
export default function PrivadoLayout({ children }) {
  // Estado que controla si el sidebar está abierto o cerrado
  const [sidebarAbierto, setSidebarAbierto] = useState(false);

  // Detecta tamaño de pantalla al cargar y ajusta sidebar
  useEffect(() => {
    if (window.innerWidth >= 768) { // md breakpoint de Tailwind
      setSidebarAbierto(true); // Sidebar abierto en pantallas grandes
    } else {
      setSidebarAbierto(false); // Sidebar cerrado en móviles
    }
  }, []);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar lateral */}
      <Sidebar 
        sidebarAbierto={sidebarAbierto} 
        setSidebarAbierto={setSidebarAbierto} 
      />
      
      {/* Contenido principal */}
      <main 
        className={`flex-1 p-6 bg-gray-100 overflow-auto transition-all duration-300`}
      >
        {/* Botón flotante para abrir sidebar en móvil */}
        {!sidebarAbierto && (
          <button
            onClick={() => setSidebarAbierto(true)}
            className="md:hidden fixed top-4 left-4 z-30 bg-[#0f172a] text-white p-3 rounded-lg shadow-lg hover:bg-[#1e293b] transition-colors"
            aria-label="Abrir menú"
          >
            ☰
          </button>
        )}
        
        {/* Contenido de la página renderizado */}
        <div>
          {children}
        </div>
      </main>
    </div>
  );
}
