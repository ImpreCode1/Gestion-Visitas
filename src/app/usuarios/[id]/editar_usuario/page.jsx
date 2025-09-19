"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

/**
 * Componente para editar un usuario existente.
 * - Obtiene los datos del usuario desde la API usando su `id`.
 * - Permite modificar nombre, email, cargo, teléfono y rol.
 * - Si el rol es "aprobador", se puede seleccionar un tipo de aprobador.
 */
export default function EditarUsuario() {
  const router = useRouter();
  const { id } = useParams(); // ID del usuario a editar
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    position: "",
    phone: "",
    role: "sinRol", // Valor por defecto
  });
  const [loading, setLoading] = useState(true); // Cargando datos del usuario
  const [error, setError] = useState(""); // Mensajes de error
  const [success, setSuccess] = useState(""); // Mensajes de éxito

  // Roles disponibles para el select
  const rolesDisponibles = [
    { value: "gerenteProducto", label: "Gerente de Producto, Team Leader o Director" },
    { value: "admin", label: "Administrador" },
    { value: "aprobador", label: "Aprobador" },
    { value: "vicepresidente", label: "Vicepresidente"},
    { value: "trainee", label: "Trainee" },
    { value: "sinRol", label: "Sin Rol" },
  ];

  // 🚀 Obtiene los datos del usuario al cargar el componente
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch(`/api/users/${id}`);
        if (!res.ok) throw new Error("Error al obtener usuario");
        const data = await res.json();
        setFormData({
          name: data.name,
          email: data.email,
          position: data.position || "",
          phone: data.phone || "",
          role: data.role || "sinRol", // incluir rol
          tipoaprobador: data.tipoaprobador || "", // tipo de aprobador si aplica
        });
      } catch (err) {
        console.error(err);
        setError("No se pudo cargar el usuario");
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [id]);

  /**
   * Maneja cambios en los inputs y selects.
   */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  /**
   * Envía los datos actualizados al servidor.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    // Si el rol no es aprobador, aseguramos que tipoaprobador sea null
    const datosAEnviar = {
      ...formData,
      tipoaprobador:
        formData.role === "aprobador" ? formData.tipoaprobador : null,
    };

    try {
      const res = await fetch(`/api/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datosAEnviar),
      });

      if (!res.ok) throw new Error("Error al actualizar usuario");

      setSuccess("Usuario actualizado correctamente ✅");
      // Redirige a la lista de usuarios tras 1.5s
      setTimeout(() => router.push("/usuarios"), 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Mensaje de carga mientras se obtienen los datos
  if (loading) {
    return <p className="p-6 text-center text-gray-500">Cargando usuario...</p>;
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 sm:p-8">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
        {/* Título */}
        <h1 className="text-2xl font-bold text-blue-800 mb-4">
          Editar Usuario
        </h1>
        <p className="text-gray-600 mb-6">Modifica los datos del usuario.</p>

        {/* Mensajes de error y éxito */}
        {error && <p className="text-red-600 mb-3">{error}</p>}
        {success && <p className="text-green-600 mb-3">{success}</p>}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Nombre
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full mt-1 p-2 border rounded-lg focus:ring focus:ring-blue-200"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full mt-1 p-2 border rounded-lg focus:ring focus:ring-blue-200"
            />
          </div>

          {/* Cargo */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Cargo
            </label>
            <input
              type="text"
              name="position"
              value={formData.position}
              onChange={handleChange}
              className="w-full mt-1 p-2 border rounded-lg focus:ring focus:ring-blue-200"
            />
          </div>

          {/* Teléfono */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Teléfono
            </label>
            <input
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Opcional"
              className="w-full mt-1 p-2 border rounded-lg focus:ring focus:ring-blue-200"
            />
          </div>

          {/* Rol */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Rol
            </label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full mt-1 p-2 border rounded-lg focus:ring focus:ring-blue-200"
            >
              {rolesDisponibles.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          {/* Tipo de aprobador solo si rol es "aprobador" */}
          {formData.role === "aprobador" && (
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Tipo de Aprobador
              </label>
              <select
                name="tipoaprobador"
                value={formData.tipoaprobador || ""}
                onChange={handleChange}
                className="w-full mt-1 p-2 border rounded-lg focus:ring focus:ring-blue-200"
                required
              >
                <option value="">Selecciona una opción</option>
                <option value="local">Internal Supply</option>
                <option value="nacional">Internal Procurement</option>
              </select>
            </div>
          )}

          {/* Botón de envío */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? "Actualizando..." : "Actualizar Usuario"}
          </button>
        </form>
      </div>
    </div>
  );
}
