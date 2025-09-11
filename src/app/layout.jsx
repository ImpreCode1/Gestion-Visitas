// Importa los estilos globales de la aplicación, incluyendo Tailwind CSS
import './globals.css'

// Metadata de la aplicación, usada en <head> y SEO
export const metadata = {
  title: 'Sistema de Gestion de Visitas Impresistem', // Título principal de la app
  description: 'Sistema de gestion y aprobación de visitas de los gerentes de producto para Impresistem', // Descripción del sistema
}

// Componente RootLayout que envuelve toda la aplicación
export default function RootLayout({ children }) {
  return (
    // Elemento raíz HTML
    <html lang="es">
      <head>
        {/* Define codificación de caracteres */}
        <meta charSet="UTF-8" />

        {/* Hace que la página sea responsiva */}
        <meta name="viewport" content="width=device-width, initial-scale=1" />

        {/* Descripción de la página para SEO */}
        <meta name="description" content={metadata.description} />

        {/* Icono que aparece en la pestaña del navegador */}
        <link rel="icon" href="/favicon.ico" />
      </head>

      {/* Cuerpo de la aplicación */}
      <body className="bg-gray-50">
        {/* Renderiza todo el contenido de la app */}
        {children}
      </body>
    </html>
  )
}
