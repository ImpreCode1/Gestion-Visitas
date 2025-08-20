# Sistema de gestión y aprobación de visitas de Impresistem

Sistema web para gestionar y aprobar visitas de gerentes de producto en Impresistem. Permite autenticación, roles de usuario y administración de visitas.

---

## Índice

1. [Descripción general](#descripción-general)
2. [Estructura del proyecto](#estructura-del-proyecto)
3. [Instalación y configuración](#instalación-y-configuración)
4. [Modelos de datos](#modelos-de-datos)
5. [Autenticación y autorización](#autenticación-y-autorización)
6. [Componentes principales](#componentes-principales)
7. [API endpoints](#api-endpoints)
8. [Middleware](#middleware)
9. [Estilos y configuración](#estilos-y-configuración)
10. [Despliegue](#despliegue)
11. [Recursos adicionales](#recursos-adicionales)

---

## Descripción general

Sistema web para gestionar y aprobar visitas de gerentes de producto en Impresistem. Permite autenticación, roles de usuario y administración de visitas.

## Estructura del proyecto

```
.env
prisma/
  schema.prisma
components/
  sidebar.jsx
  boton_azul.jsx
  boton_rojo.jsx
public/
src/
  app/
    login/
    agendar_visita/
  middleware.js
  ...
```

## Instalación y configuración

- Instala dependencias:
  ```sh
  npm install
  ```
- Configura variables en `.env` (ejemplo: `DATABASE_URL`, `JWT_SECRET`, etc).
- Ejecuta el servidor:
  ```sh
  npm run dev
  ```

## Modelos de datos

El modelo principal es `User`:

```prisma
model User {
  id        Int      @id @default(autoincrement())
  name      String
  email     String   @unique
  password  String
  role      Role     @default(gerente)
  phone     String?
  position  String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

enum Role {
  admin
  gerente
  aprobador
}
```

## Autenticación y autorización

- Login: `/api/login`
- Logout: `/api/logout`
- Middleware de protección de rutas: `src/middleware.js`
- Tokens JWT y refresh tokens gestionados en cookies.

## Componentes principales

- Sidebar con menú dinámico por rol: `components/sidebar.jsx`
- Botones reutilizables: `components/boton_azul.jsx`, `components/boton_rojo.jsx`
- Página de login: `src/app/login/page.jsx`
- Página protegida: `src/app/agendar_visita/page.jsx`

## API endpoints

- `/api/login`: Autenticación de usuario.
- `/api/logout`: Cierre de sesión y eliminación de cookies.

## Middleware

Protege rutas como `/agendar_visita` verificando tokens y renovando automáticamente si el refresh token es válido. Ver `src/middleware.js`.

## Estilos y configuración

- TailwindCSS: `tailwind.config.js`
- Estilos globales: `src/app/globals.css`
- ESLint: `eslint.config.mjs`
- PostCSS: `postcss.config.mjs`

## Despliegue

Recomendado en Vercel. Ver instrucciones en la documentación oficial de Next.js.

## Recursos adicionales

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)

---

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.