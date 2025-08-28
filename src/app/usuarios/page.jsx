"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function UsuariosPage() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [rolFiltro, setRolFiltro] = useState("todos");
  const router = useRouter();

  // Cargar usuarios desde la API
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

  // Filtrar usuarios cuando cambia el search
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

        {/* Barra de búsqueda */}
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
            <option value="aprobador">Aprobador</option>
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
                      <button
                        onClick={() =>
                          router.push(`/usuarios/${user.id}/editar_usuario/`)
                        }
                        className="px-3 py-1 text-sm sm:text-base bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition w-full sm:w-auto"
                      >
                        Editar
                      </button>
                      <button
                        onClick={async () => {
                          if (
                            !confirm(
                              "¿Seguro que deseas inactivar este usuario?"
                            )
                          )
                            return;

                          try {
                            const res = await fetch(`/api/users/${user.id}`, {
                              method: "DELETE",
                            });

                            if (!res.ok)
                              throw new Error("Error al eliminar usuario");

                            alert("Usuario eliminado correctamente ✅");
                            setUsers(users.filter((u) => u.id !== user.id));
                          } catch (error) {
                            console.error(error);
                            alert(error.message || "Error al eliminar usuario");
                          }
                        }}
                        className="px-3 py-1 text-sm sm:text-base bg-red-500 text-white rounded-md hover:bg-red-600 transition w-full sm:w-auto"
                      >
                        Inactivar
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
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
