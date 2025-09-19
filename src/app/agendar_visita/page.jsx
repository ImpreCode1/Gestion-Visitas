"use client";
import { useState } from "react";

export default function AgendarVisitaPage() {
  const [formData, setFormData] = useState({
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
    requiereAvion: false, // ✅ Nuevo campo
  });

  // Manejo de inputs (texto y checkbox)
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value, // ✅ soporta checkbox
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.fecha_ida && formData.fecha_regreso) {
      const fechaIda = new Date(formData.fecha_ida);
      const fechaRegreso = new Date(formData.fecha_regreso);

      if (fechaRegreso < fechaIda) {
        alert("❌ La fecha de regreso no puede ser anterior a la fecha de ida");
        return;
      }
    }

    try {
      const res = await fetch("/api/visites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error("Error al registrar visita");

      alert("✅ Visita registrada correctamente");

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
        requiereAvion: false, // reset
      });
    } catch (err) {
      alert("❌ " + err.message);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 p-4 sm:p-6">
      <div className="bg-white shadow-xl rounded-2xl w-full max-w-4xl p-6 sm:p-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6 sm:mb-8 text-center">
          📝 Agendar nueva visita
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
          {/* 🔹 Datos del Cliente */}
          <section className="bg-gray-50 p-4 sm:p-6 rounded-xl shadow-sm">
            <h3 className="text-md sm:text-lg font-semibold text-gray-700 mb-4">
              📌 Datos del cliente
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input
                type="text"
                name="clienteCodigo"
                value={formData.clienteCodigo}
                onChange={handleChange}
                placeholder="ID o código del cliente"
                className="border p-3 rounded-lg w-full text-sm sm:text-base"
                required
              />
              <input
                type="text"
                name="cliente"
                value={formData.cliente}
                onChange={handleChange}
                placeholder="Nombre del cliente"
                className="border p-3 rounded-lg w-full text-sm sm:text-base"
                required
              />
              <input
                type="text"
                name="ciudad"
                value={formData.ciudad}
                onChange={handleChange}
                placeholder="Ciudad"
                className="border p-3 rounded-lg w-full text-sm sm:text-base"
                required
              />
              <input
                type="text"
                name="pais"
                value={formData.pais}
                onChange={handleChange}
                placeholder="País"
                className="border p-3 rounded-lg w-full text-sm sm:text-base"
              />
              <input
                type="text"
                name="direccion"
                value={formData.direccion}
                onChange={handleChange}
                placeholder="Dirección"
                className="border p-3 rounded-lg w-full text-sm sm:text-base"
                required
              />
              <input
                type="text"
                name="contacto"
                value={formData.contacto}
                onChange={handleChange}
                placeholder="Persona de contacto"
                className="border p-3 rounded-lg w-full text-sm sm:text-base"
              />
              <input
                type="tel"
                name="telefono"
                value={formData.telefono}
                onChange={handleChange}
                placeholder="Teléfono"
                className="border p-3 rounded-lg w-full text-sm sm:text-base"
              />
              <input
                type="text"
                name="personaVisita"
                value={formData.personaVisita}
                onChange={handleChange}
                placeholder="Persona a visitar"
                className="border p-3 rounded-lg w-full text-sm sm:text-base"
              />
            </div>
          </section>

          {/* 🔹 Información de la visita */}
          <section className="bg-gray-50 p-4 sm:p-6 rounded-xl shadow-sm">
            <h3 className="text-md sm:text-lg font-semibold text-gray-700 mb-4">
              📅 Información de la visita
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="fecha_ida"
                  className="block text-xs sm:text-sm font-semibold text-gray-500 mb-2"
                >
                  Fecha de ida
                </label>
                <input
                  type="datetime-local"
                  id="fecha_ida"
                  name="fecha_ida"
                  value={formData.fecha_ida}
                  onChange={handleChange}
                  className="border p-3 rounded-lg w-full text-sm sm:text-base"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="fecha_regreso"
                  className="block text-xs sm:text-sm font-semibold text-gray-500 mb-2"
                >
                  Fecha de regreso
                </label>
                <input
                  type="datetime-local"
                  id="fecha_regreso"
                  name="fecha_regreso"
                  value={formData.fecha_regreso}
                  onChange={handleChange}
                  className="border p-3 rounded-lg w-full text-sm sm:text-base"
                  required
                />
              </div>
              <input
                type="text"
                name="lugar"
                value={formData.lugar}
                onChange={handleChange}
                placeholder="Lugar (oficina, sucursal, etc.)"
                className="border p-3 rounded-lg w-full text-sm sm:text-base"
              />
              <input
                type="text"
                name="motivo"
                value={formData.motivo}
                onChange={handleChange}
                placeholder="Motivo de la visita"
                className="border p-3 rounded-lg w-full text-sm sm:text-base"
                required
              />

              {/* ✅ Requiere avión */}
              <div className="col-span-1 sm:col-span-2">
                <h4 className="text-sm sm:text-md font-semibold text-gray-800 mb-2 flex items-center gap-2">
                  ✈️ ¿La visita requiere avión?
                </h4>

                <div className="flex items-center justify-between px-4 py-3 border rounded-lg shadow-sm bg-white">
                  <span className="text-gray-700 text-sm font-medium">
                    {formData.requiereAvion
                      ? "Sí, requiere avión"
                      : "No, no requiere avión"}
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        requiereAvion: !formData.requiereAvion,
                      })
                    }
                    className={`relative inline-flex h-6 w-12 items-center rounded-full transition-colors ${
                      formData.requiereAvion ? "bg-blue-600" : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                        formData.requiereAvion
                          ? "translate-x-6"
                          : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* 🔹 Botón */}
          <div className="flex justify-center">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 sm:px-8 py-3 sm:py-3 rounded-xl shadow-md transition-all w-full sm:w-auto"
            >
              Agendar visita
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
