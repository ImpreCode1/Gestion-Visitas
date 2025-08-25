"use client";

import { useState, useEffect } from "react";
import Sidebar from "../../../components/sidebar";

export default function PrivadoLayout({ children }) {
  const [sidebarAbierto, setSidebarAbierto] = useState(false);

  // Detecta tamaño de pantalla al cargar
  useEffect(() => {
    if (window.innerWidth >= 768) { // md breakpoint de Tailwind
      setSidebarAbierto(false); // Abierto en PC
    } else {
      setSidebarAbierto(false); // Cerrado en móvil
    }
  }, []);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
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
        
        {/* Contenido de la página */}
        <div>
          {children}
        </div>
      </main>
    </div>
  );
}
