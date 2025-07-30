import './globals.css'

export const metadata = {
  title: 'Sistema de Gestion de Visitas Impresistem',
  description: 'Sistema de gestion y aprobación de visitas de los gerentes de producto para Impresistem',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
    <head>
      <meta charSet="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta name="description" content={metadata.description} />
      <link rel="icon" href="/favicon.ico" />
    </head>
      <body>{children}</body>
    </html>
  )
}
