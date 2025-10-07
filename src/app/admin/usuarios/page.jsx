"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * Página de gestión de usuarios.
 * - Muestra todos los usuarios en una tabla.
 * - Permite búsqueda por nombre o email.
 * - Permite filtrar por rol.
 */
export default function UsuariosPage() {
  // Estados locales
  const [users, setUsers] = useState([]); // Todos los usuarios
  const [filteredUsers, setFilteredUsers] = useState([]); // Usuarios filtrados según búsqueda y rol
  const [loading, setLoading] = useState(true); // Indica si se están cargando los datos
  const [search, setSearch] = useState(""); // Término de búsqueda
  const [rolFiltro, setRolFiltro] = useState("todos"); // Filtro por rol
  const router = useRouter();

  // 🔹 Cargar usuarios desde la API al montar el componente
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch("/api/users");
        if (!res.ok) throw new Error("Error al obtener usuarios");
        const data = await res.json();
        setUsers(data);
        setFilteredUsers(data);
      } catch (error) {
        console.error(error);
        setUsers([]);
        setFilteredUsers([]);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  // 🔹 Filtrar usuarios cada vez que cambian búsqueda, filtro o la lista de usuarios
  useEffect(() => {
    const term = search.toLowerCase();

    const filtrados = users.filter((u) => {
      const coincideBusqueda =
        u.name.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term);

      const coincideRol = rolFiltro === "todos" || u.role === rolFiltro;

      return coincideBusqueda && coincideRol;
    });

    setFilteredUsers(filtrados);
  }, [search, rolFiltro, users]);

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Encabezado */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-blue-800 text-center flex-1">
            Gestión de Usuarios
          </h1>
        </div>

        {/* Barra de búsqueda y filtro */}
        <div className="mb-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <input
            type="text"
            placeholder="Buscar por nombre o email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-1/3 px-4 py-2 border rounded-lg focus:ring focus:ring-blue-200"
          />

          <select
            value={rolFiltro}
            onChange={(e) => setRolFiltro(e.target.value)}
            className="w-full sm:w-1/4 px-4 py-2 border rounded-lg focus:ring focus:ring-blue-200"
          >
            <option value="todos">Todos los roles</option>
            <option value="admin">Administrador</option>
            <option value="aprobador">Internos</option>
            <option value="gerenteProducto">Gerente de Producto</option>
            <option value="trainee">Trainee</option>
            <option value="sinRol">Sin Rol</option>
          </select>
        </div>

        {/* Tabla de usuarios */}
        <div className="bg-white shadow-lg rounded-xl overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead className="bg-blue-50">
              <tr>
                <th className="p-3 text-sm font-semibold text-gray-700">
                  Nombre
                </th>
                <th className="p-3 text-sm font-semibold text-gray-700">
                  Email
                </th>
                <th className="p-3 text-sm font-semibold text-gray-700">Rol</th>
                <th className="p-3 text-sm font-semibold text-gray-700">
                  Teléfono
                </th>
                <th className="p-3 text-sm font-semibold text-gray-700 text-center">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {/* Mostrar loading */}
              {loading ? (
                <tr>
                  <td colSpan="5" className="text-center p-6 text-gray-500">
                    Cargando usuarios...
                  </td>
                </tr>
              ) : filteredUsers.length > 0 ? (
                filteredUsers.map((user, idx) => (
                  <tr
                    key={user.id}
                    className={`border-b hover:bg-gray-50 transition ${
                      idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                    }`}
                  >
                    <td className="p-3 sm:p-4">{user.name}</td>
                    <td className="p-3 sm:p-4 break-words">{user.email}</td>
                    <td className="p-3 sm:p-4">
                      <span
                        className={`px-2 py-1 text-xs sm:text-sm rounded-lg ${
                          user.role === "admin"
                            ? "bg-red-100 text-red-700"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="p-3 sm:p-4">{user.phone || "-"}</td>
                    <td className="p-3 sm:p-4 flex flex-col sm:flex-row justify-center gap-2">
                      {/* Botón para editar usuario */}
                      <button
                        onClick={() =>
                          router.push(`/admin/usuarios/${user.id}/editar_usuario/`)
                        }
                        className="px-3 py-1 text-sm sm:text-base bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition w-full sm:w-auto"
                      >
                        Editar
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                // No hay usuarios que coincidan
                <tr>
                  <td colSpan="5" className="text-center p-6 text-gray-500">
                    No hay usuarios que coincidan con la búsqueda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
