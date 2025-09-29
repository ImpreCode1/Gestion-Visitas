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
    requiereAvion: false,
    fondos_fabrica: false,
    ciudad_origen: "",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);

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
        requiereAvion: false,
        fondos_fabrica: false,
        ciudad_origen: "",
      });
    } catch (err) {
      alert("❌ " + err.message);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="bg-white shadow-lg rounded-xl w-full max-w-3xl p-6 sm:p-8">
        {/* Título principal */}
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-8 text-center">
          Agendar nueva visita
        </h2>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* 🔹 Datos del Cliente */}
          <section className="bg-gray-50 p-5 rounded-lg shadow-sm space-y-6">
            <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">
              Datos del cliente
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input
                type="text"
                name="clienteCodigo"
                value={formData.clienteCodigo}
                onChange={handleChange}
                placeholder="ID o código del cliente"
                className="border p-2.5 rounded-lg w-full text-sm focus:ring focus:ring-blue-200"
                required
              />
              <input
                type="text"
                name="cliente"
                value={formData.cliente}
                onChange={handleChange}
                placeholder="Nombre del cliente"
                className="border p-2.5 rounded-lg w-full text-sm focus:ring focus:ring-blue-200"
                required
              />
              <input
                type="text"
                name="ciudad"
                value={formData.ciudad}
                onChange={handleChange}
                placeholder="Ciudad"
                className="border p-2.5 rounded-lg w-full text-sm focus:ring focus:ring-blue-200"
                required
              />
              <input
                type="text"
                name="pais"
                value={formData.pais}
                onChange={handleChange}
                placeholder="País"
                className="border p-2.5 rounded-lg w-full text-sm focus:ring focus:ring-blue-200"
              />
              <input
                type="text"
                name="direccion"
                value={formData.direccion}
                onChange={handleChange}
                placeholder="Dirección"
                className="border p-2.5 rounded-lg w-full text-sm focus:ring focus:ring-blue-200"
                required
              />
              <input
                type="text"
                name="contacto"
                value={formData.contacto}
                onChange={handleChange}
                placeholder="Persona de contacto"
                className="border p-2.5 rounded-lg w-full text-sm focus:ring focus:ring-blue-200"
              />
              <input
                type="tel"
                name="telefono"
                value={formData.telefono}
                onChange={handleChange}
                placeholder="Teléfono"
                className="border p-2.5 rounded-lg w-full text-sm focus:ring focus:ring-blue-200"
              />
              <input
                type="text"
                name="personaVisita"
                value={formData.personaVisita}
                onChange={handleChange}
                placeholder="Persona a visitar"
                className="border p-2.5 rounded-lg w-full text-sm focus:ring focus:ring-blue-200"
              />
            </div>
          </section>

          {/* 🔹 Información de la visita */}
          <section className="bg-gray-50 p-5 rounded-lg shadow-sm space-y-6">
            <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">
              Información de la visita
            </h3>

            {/* ✅ Fondos de fábrica */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Fondos de fábrica
              </label>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-4 py-2 border rounded-lg bg-white">
                <span className="text-gray-600 text-sm mb-2 sm:mb-0">
                  {formData.fondos_fabrica
                    ? "Los gastos los cubre el cliente/fábrica"
                    : "Los gastos los cubre Impresistem"}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      fondos_fabrica: !formData.fondos_fabrica,
                      requiereAvion: false,
                    })
                  }
                  className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors ${
                    formData.fondos_fabrica ? "bg-green-600" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                      formData.fondos_fabrica
                        ? "translate-x-5"
                        : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* ✅ Ciudad de origen */}
            <div className="space-y-1">
              <label
                htmlFor="ciudad_origen"
                className="block text-sm font-medium text-gray-700"
              >
                Ciudad de origen
              </label>
              <select
                id="ciudad_origen"
                name="ciudad_origen"
                value={formData.ciudad_origen}
                onChange={handleChange}
                className="border p-2.5 rounded-lg w-full text-sm focus:ring focus:ring-blue-200"
                required
              >
                <option value="">Selecciona una ciudad</option>
                <option value="Leticia">Leticia</option>
                <option value="Bello">Bello</option>
                <option value="Envigado">Envigado</option>
                <option value="Itagüí">Itagüí</option>
                <option value="Medellín">Medellín</option>
                <option value="Puerto Berrío">Puerto Berrío</option>
                <option value="Arauca">Arauca</option>
                <option value="Barranquilla">Barranquilla</option>
                <option value="Soledad">Soledad</option>
                <option value="Bogotá">Bogotá</option>
                <option value="Girardot">Girardot</option>
                <option value="Cartagena">Cartagena</option>
                <option value="Magangué">Magangué</option>
                <option value="Duitama">Duitama</option>
                <option value="Sogamoso">Sogamoso</option>
                <option value="Tunja">Tunja</option>
                <option value="Manizales">Manizales</option>
                <option value="Florencia">Florencia</option>
                <option value="Yopal">Yopal</option>
                <option value="Popayán">Popayán</option>
                <option value="Sevilla">Sevilla</option>
                <option value="Valledupar">Valledupar</option>
                <option value="Quibdó">Quibdó</option>
                <option value="Montería">Montería</option>
                <option value="Guainía">Guainía</option>
                <option value="Guaviare">Guaviare</option>
                <option value="San José del Guaviare">
                  San José del Guaviare
                </option>
                <option value="Neiva">Neiva</option>
                <option value="Ríohacha">Ríohacha</option>
                <option value="El Banco">El Banco</option>
                <option value="Ciénaga">Ciénaga</option>
                <option value="Santa Marta">Santa Marta</option>
                <option value="Villavicencio">Villavicencio</option>
                <option value="Ipiales">Ipiales</option>
                <option value="Pasto">Pasto</option>
                <option value="Tumaco">Tumaco</option>
                <option value="Cúcuta">Cúcuta</option>
                <option value="Ocaña">Ocaña</option>
                <option value="Pamplona">Pamplona</option>
                <option value="Mocoa">Mocoa</option>
                <option value="Armenia">Armenia</option>
                <option value="Calarcá">Calarcá</option>
                <option value="Pereira">Pereira</option>
                <option value="Santa Rosa de Cabal">Santa Rosa de Cabal</option>
                <option value="San Andrés y Providencia">
                  San Andrés y Providencia
                </option>
                <option value="Barrancabermeja">Barrancabermeja</option>
                <option value="Bucaramanga">Bucaramanga</option>
                <option value="Sincelejo">Sincelejo</option>
                <option value="Ibagué">Ibagué</option>
                <option value="Buenaventura">Buenaventura</option>
                <option value="Buga">Buga</option>
                <option value="Cali">Cali</option>
                <option value="Palmira">Palmira</option>
                <option value="Tuluá">Tuluá</option>
                <option value="Puerto Carreño">Puerto Carreño</option>
              </select>
            </div>

            {/* ✅ Fechas y lugar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label
                  htmlFor="fecha_ida"
                  className="block text-sm font-medium text-gray-700"
                >
                  Fecha y hora de ida
                </label>
                <input
                  type="datetime-local"
                  id="fecha_ida"
                  name="fecha_ida"
                  value={formData.fecha_ida}
                  onChange={handleChange}
                  className="border p-2.5 rounded-lg w-full text-sm focus:ring focus:ring-blue-200"
                  required
                />
              </div>
              <div className="space-y-1">
                <label
                  htmlFor="fecha_regreso"
                  className="block text-sm font-medium text-gray-700"
                >
                  Fecha y hora de regreso
                </label>
                <input
                  type="datetime-local"
                  id="fecha_regreso"
                  name="fecha_regreso"
                  value={formData.fecha_regreso}
                  onChange={handleChange}
                  className="border p-2.5 rounded-lg w-full text-sm focus:ring focus:ring-blue-200"
                  required
                />
              </div>
              <input
                type="text"
                name="lugar"
                value={formData.lugar}
                onChange={handleChange}
                placeholder="Lugar (oficina, sucursal, etc.)"
                className="border p-2.5 rounded-lg w-full text-sm focus:ring focus:ring-blue-200"
              />
              <input
                type="text"
                name="motivo"
                value={formData.motivo}
                onChange={handleChange}
                placeholder="Motivo de la visita"
                className="border p-2.5 rounded-lg w-full text-sm focus:ring focus:ring-blue-200"
                required
              />
            </div>

            {/* ✅ Requiere avión */}
            {!formData.fondos_fabrica && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  ¿La visita requiere tiquetes aéreos?
                </label>
                <div className="flex items-center justify-between px-4 py-2 border rounded-lg bg-white">
                  <span className="text-gray-600 text-sm">
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
                    className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors ${
                      formData.requiereAvion ? "bg-blue-600" : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                        formData.requiereAvion
                          ? "translate-x-5"
                          : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* 🔹 Botón */}
          <div className="flex justify-center">
            <button
              type="submit"
              disabled={loading}
              className={`${
                loading
                  ? "bg-blue-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              } text-white font-medium px-8 py-3 rounded-lg shadow-md transition-all w-full sm:w-auto`}
            >
              {loading ? "Agendando..." : "Agendar visita"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
