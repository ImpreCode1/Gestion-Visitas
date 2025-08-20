"use client";

import { useState } from "react";
import Sidebar from "../../../components/sidebar";

export default function PrivadoLayout({ children }) {
  const [sidebarAbierto, setSidebarAbierto] = useState(false); // Cerrado por defecto en móvil

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <Sidebar 
        sidebarAbierto={sidebarAbierto} 
        setSidebarAbierto={setSidebarAbierto} 
      />
      
      {/* Contenido principal */}
      <main 
        className={`flex-1 p-6 bg-gray-100 overflow-auto transition-all duration-300
          ${sidebarAbierto ? 'md:ml-0' : 'md:ml-0'}
        `}
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
        <div className={`${!sidebarAbierto ? 'md:ml-0' : ''}`}>
          {children}
        </div>
      </main>
    </div>
  );
}