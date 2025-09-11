"use client"; 
// Este archivo se ejecuta en el cliente (necesario en Next.js con App Router).

import { useState } from "react";

// Página para agendar una nueva visita
export default function AgendarVisitaPage() {
  // Estado que almacena todos los campos del formulario
  const [formData, setFormData] = useState({
    clienteCodigo: "",
    cliente: "", // Nombre del cliente
    ciudad: "",
    pais: "",
    direccion: "",
    contacto: "",
    telefono: "",
    personaVisita: "",
    fecha_ida: "",
    fecha_regreso: "",
    lugar: "",
    motivo: "",
    tiquetes: "",
    viaticos: "",
    otrosGastos: "",
  });

  // Maneja los cambios en los inputs y actualiza el estado formData
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value }); // Spread operator para no perder el resto de campos
  };

  // Maneja el envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault(); // Evita que la página se recargue

    // Validación de fechas: la fecha de regreso no puede ser antes de la de ida
    if (formData.fecha_ida && formData.fecha_regreso) {
      const fechaIda = new Date(formData.fecha_ida);
      const fechaRegreso = new Date(formData.fecha_regreso);

      if (fechaRegreso < fechaIda) {
        alert("❌ La fecha de regreso no puede ser anterior a la fecha de ida");
        return; // Detiene el envío
      }
    }

    try {
      // Enviar los datos al backend mediante fetch
      const res = await fetch("/api/visites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error("Error al registrar visita");

      // Confirmación de éxito
      alert("✅ Visita registrada correctamente");

      // Resetear el formulario a su estado inicial
      setFormData({
        clienteCodigo: "",
        cliente: "",
        ciudad: "",
        pais: "",
        direccion: "",
        contacto: "",
        telefono: "",
        personaVisita: "",
        fecha_ida: "",
        fecha_regreso: "",
        lugar: "",
        motivo: "",
        tiquetes: "",
        viaticos: "",
        otrosGastos: "",
      });
    } catch (err) {
      // Muestra mensaje de error si algo falla en el fetch
      alert("❌ " + err.message);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 p-6">
      <div className="bg-white shadow-xl rounded-2xl w-full max-w-4xl p-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">
          📝 Agendar nueva visita
        </h2>

        {/* Formulario principal */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* 🔹 Sección: Datos del Cliente */}
          <section className="bg-gray-50 p-6 rounded-xl shadow-sm">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">
              📌 Datos del cliente
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Código o ID del cliente */}
              <input
                type="text"
                name="clienteCodigo"
                value={formData.clienteCodigo}
                onChange={handleChange}
                placeholder="ID o código del cliente"
                className="border p-3 rounded-lg w-full"
                required
              />
              {/* Nombre del cliente */}
              <input
                type="text"
                name="cliente"
                value={formData.cliente}
                onChange={handleChange}
                placeholder="Nombre del cliente"
                className="border p-3 rounded-lg w-full"
                required
              />
              {/* Ciudad */}
              <input
                type="text"
                name="ciudad"
                value={formData.ciudad}
                onChange={handleChange}
                placeholder="Ciudad"
                className="border p-3 rounded-lg w-full"
                required
              />
              {/* País */}
              <input
                type="text"
                name="pais"
                value={formData.pais}
                onChange={handleChange}
                placeholder="País"
                className="border p-3 rounded-lg w-full"
              />
              {/* Dirección */}
              <input
                type="text"
                name="direccion"
                value={formData.direccion}
                onChange={handleChange}
                placeholder="Dirección"
                className="border p-3 rounded-lg w-full"
                required
              />
              {/* Persona de contacto */}
              <input
                type="text"
                name="contacto"
                value={formData.contacto}
                onChange={handleChange}
                placeholder="Persona de contacto"
                className="border p-3 rounded-lg w-full"
              />
              {/* Teléfono */}
              <input
                type="tel"
                name="telefono"
                value={formData.telefono}
                onChange={handleChange}
                placeholder="Teléfono"
                className="border p-3 rounded-lg w-full"
              />
              {/* Persona a visitar */}
              <input
                type="text"
                name="personaVisita"
                value={formData.personaVisita}
                onChange={handleChange}
                placeholder="Persona a visitar"
                className="border p-3 rounded-lg w-full"
              />
            </div>
          </section>

          {/* 🔹 Sección: Información de la visita */}
          <section className="bg-gray-50 p-6 rounded-xl shadow-sm">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">
              📅 Información de la visita
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Fecha de ida */}
              <div>
                <label
                  htmlFor="fecha_ida"
                  className="block text-xs font-semibold text-gray-500 mb-2"
                >
                  Fecha de ida
                </label>
                <input
                  type="datetime-local"
                  id="fecha_ida"
                  name="fecha_ida"
                  value={formData.fecha_ida}
                  onChange={handleChange}
                  className="border p-3 rounded-lg w-full"
                  required
                />
              </div>
              {/* Fecha de regreso */}
              <div>
                <label
                  htmlFor="fecha_regreso"
                  className="block text-xs font-semibold text-gray-500 mb-2"
                >
                  Fecha de regreso
                </label>
                <input
                  type="datetime-local"
                  id="fecha_regreso"
                  name="fecha_regreso"
                  value={formData.fecha_regreso}
                  onChange={handleChange}
                  className="border p-3 rounded-lg w-full"
                  required
                />
              </div>
              {/* Lugar */}
              <input
                type="text"
                name="lugar"
                value={formData.lugar}
                onChange={handleChange}
                placeholder="Lugar (oficina, sucursal, etc.)"
                className="border p-3 rounded-lg w-full"
              />
              {/* Motivo */}
              <input
                type="text"
                name="motivo"
                value={formData.motivo}
                onChange={handleChange}
                placeholder="Motivo de la visita"
                className="border p-3 rounded-lg w-full"
                required
              />
            </div>
          </section>

          {/* 🔹 Botón de envío */}
          <div className="flex justify-center">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-8 py-3 rounded-xl shadow-md transition-all"
            >
              Agendar visita
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
