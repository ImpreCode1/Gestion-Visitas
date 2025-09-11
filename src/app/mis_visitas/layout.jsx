"use client";

import { useState, useEffect } from "react";
import Sidebar from "../../../components/sidebar";

// Componente layout que envuelve páginas privadas
export default function PrivadoLayout({ children }) {
  // Estado que controla si el sidebar está abierto o cerrado
  const [sidebarAbierto, setSidebarAbierto] = useState(false);

  // -----------------------------
  // Detectar tamaño de pantalla al cargar
  // -----------------------------
  useEffect(() => {
    if (window.innerWidth >= 768) { // md breakpoint de Tailwind (768px)
      setSidebarAbierto(true);  // Sidebar abierto en pantallas grandes
    } else {
      setSidebarAbierto(false); // Sidebar cerrado en móviles
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
        className="flex-1 p-6 bg-gray-100 overflow-auto transition-all duration-300"
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
          {children} {/* Aquí se renderiza el contenido específico de cada página */}
        </div>
      </main>
    </div>
  );
}
