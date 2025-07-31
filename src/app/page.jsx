// Importa el componente Link para navegación interna
import Link from "next/link";
// Importa el componente Image optimizado de Next.js
import Image from "next/image";

// Importa recursos estáticos (logo y fondo)
import logo from "../../public/logo.png";
import personas from "../../public/personas.jpg";

// Importa el botón personalizado reutilizable
import BotonAzul from "../../components/boton_azul";

// Componente principal de la página de inicio
export default function Homepage() {
  return (
    <main className="relative w-screen h-screen overflow-hidden">
      {/* Imagen de fondo que cubre toda la pantalla */}
      <Image
        src={personas} // Imagen importada desde /public
        alt="Fondo de reunión"
        layout="fill" // Ocupa todo el contenedor (pantalla completa)
        objectFit="cover" // Cubre manteniendo proporción
        quality={100} // Alta calidad
        className="z-0" // Posicionada al fondo de la pila
      />

      {/* Capa oscura encima de la imagen para mejorar contraste del contenido */}
      <div
        className="absolute inset-0 z-10"
        style={{ backgroundColor: "rgba(0, 0, 0, 0.7)" }} // Oscurecimiento con opacidad
      ></div>

      {/* Contenedor centrado sobre la imagen y la capa oscura */}
      <div className="relative z-20 flex flex-col items-center justify-center h-full px-6 text-center text-white">
        {/* Logo de la empresa */}
        <Image
          src={logo}
          alt="Logo Impresistem"
          width={130}
          height={90}
          className="mb-6" // Espaciado inferior
        />

        {/* Título principal de la landing */}
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
          Sistema de Gestión de Visitas
        </h1>

        {/* Subtítulo o descripción del sistema */}
        <p className="text-lg text-gray-200 mb-8 max-w-md leading-relaxed">
          Bienvenido al sistema de gestión y aprobación de visitas de los
          gerentes de producto para Impresistem.
        </p>

        {/* Botón reutilizable que redirige al login */}
        <BotonAzul href="/login">Iniciar Sesión</BotonAzul>
      </div>
    </main>
  );
}
