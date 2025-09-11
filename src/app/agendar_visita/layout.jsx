"use client"; 
// Indica que este componente se ejecuta en el cliente (Next.js App Router).

import { useState, useEffect } from "react";
import Sidebar from "../../../components/sidebar";

// Layout privado que incluye un sidebar y el contenido principal
export default function PrivadoLayout({ children }) {
  // Estado para controlar si el sidebar está abierto o cerrado
  const [sidebarAbierto, setSidebarAbierto] = useState(false);

  // Al cargar el componente, se detecta el tamaño de pantalla inicial
  useEffect(() => {
    if (window.innerWidth >= 768) { 
      // Si el ancho es mayor o igual a 768px (breakpoint md en Tailwind), 
      // se abre el sidebar automáticamente (versión escritorio).
      setSidebarAbierto(true);
    } else {
      // En dispositivos móviles se inicia cerrado.
      setSidebarAbierto(false);
    }
  }, []);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar lateral. 
          Recibe el estado y el setter para poder controlar su apertura/cierre 
          desde dentro del componente hijo. */}
      <Sidebar 
        sidebarAbierto={sidebarAbierto} 
        setSidebarAbierto={setSidebarAbierto} 
      />
      
      {/* Contenedor principal de la página */}
      <main 
        className="flex-1 p-6 bg-gray-100 overflow-auto transition-all duration-300"
      >
        {/* Botón hamburguesa (solo visible en móvil) 
            Permite abrir el sidebar cuando está cerrado. */}
        {!sidebarAbierto && (
          <button
            onClick={() => setSidebarAbierto(true)}
            className="md:hidden fixed top-4 left-4 z-30 bg-[#0f172a] text-white p-3 rounded-lg shadow-lg hover:bg-[#1e293b] transition-colors"
            aria-label="Abrir menú"
          >
            ☰
          </button>
        )}
        
        {/* Aquí se renderiza el contenido específico de cada página */}
        <div>
          {children}
        </div>
      </main>
    </div>
  );
}
