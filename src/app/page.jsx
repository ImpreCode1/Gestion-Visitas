import Link from "next/link";

export default function Homepage() {
  return (
    <main>
      <div className="bg-red-500 text-white p-4 rounded-xl">
        <h1>
          Aqui estara el sitio principal del Sistema de Gestion de Visitas
        </h1>
      </div>
      <Link href="/login">
        <button>Login</button>
      </Link>
      <p>Esta es una aplicacion de ejemplo para el curso de Next.js</p>
    </main>
  );
}
