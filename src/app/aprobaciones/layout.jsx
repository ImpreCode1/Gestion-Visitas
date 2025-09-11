"use client";

import { useState, useEffect } from "react";
import Sidebar from "../../../components/sidebar";

export default function PrivadoLayout({ children }) {
  const [sidebarAbierto, setSidebarAbierto] = useState(false); 
  // Estado que controla si el sidebar está abierto o cerrado

  // Detecta el tamaño de pantalla al cargar y ajusta el sidebar
  useEffect(() => {
    if (window.innerWidth >= 768) { // md breakpoint de Tailwind
      setSidebarAbierto(true); // En pantallas grandes, el sidebar está abierto por defecto
    } else {
      setSidebarAbierto(false); // En móviles, el sidebar está cerrado por defecto
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
        
        {/* Renderiza el contenido de la página */}
        <div>
          {children}
        </div>
      </main>
    </div>
  );
}
