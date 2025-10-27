"use client";
import { useState } from "react";
import { Building2, ClipboardList, Plane, MapPin } from "lucide-react";
import Swal from "sweetalert2";

function getLocalDateTimeNow() {
  const now = new Date();
  now.setSeconds(0, 0);
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

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

    tipoVisita: "por_definir",
    otroTipo: "",
    motivo: "",
    descripcion: "",
    proposito: "",

    ciudad_origen: "",
    fecha_ida: "",
    fecha_regreso: "",
    lugar: "",
    requiereAvion: false,
    fondos_fabrica: false,
    oportunidadCRM: "",
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

    const hoy = new Date();
    hoy.setSeconds(0, 0);

    // 🧭 Validación de fechas
    if (formData.fecha_ida && new Date(formData.fecha_ida) < hoy) {
      alert("❌ La fecha de ida no puede ser anterior al día actual");
      setLoading(false);
      return;
    }

    if (formData.fecha_ida && formData.fecha_regreso) {
      const ida = new Date(formData.fecha_ida);
      const regreso = new Date(formData.fecha_regreso);
      if (regreso < ida) {
        alert("❌ La fecha de regreso no puede ser anterior a la de ida");
        setLoading(false);
        return;
      }
    }

    // 🧩 Validación tipo de visita
    if (
      formData.tipoVisita === "otros" &&
      formData.otroTipo.trim().length < 10
    ) {
      alert(
        "❌ Si seleccionas 'Otros', debes especificar un tipo con al menos 10 caracteres"
      );
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/visites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error("Error al registrar la visita");

      // ✅ Popup de éxito
      await Swal.fire({
        title: "¡Visita registrada!",
        text: "La solicitud se ha enviado correctamente.",
        icon: "success",
        confirmButtonText: "Aceptar",
        confirmButtonColor: "#2563EB", // azul Tailwind 600
        background: "#f9fafb",
        color: "#111827",
        iconColor: "#22c55e",
        customClass: {
          popup: "rounded-xl shadow-lg",
          title: "text-lg font-semibold",
          confirmButton: "rounded-md px-5 py-2",
        },
      });

      // 🔄 Reset form
      setFormData({
        clienteCodigo: "",
        cliente: "",
        ciudad: "",
        pais: "",
        direccion: "",
        contacto: "",
        telefono: "",
        personaVisita: "",
        tipoVisita: "por_definir",
        otroTipo: "",
        motivo: "",
        descripcion: "",
        proposito: "",
        ciudad_origen: "",
        fecha_ida: "",
        fecha_regreso: "",
        lugar: "",
        requiereAvion: false,
        fondos_fabrica: false,
        oportunidadCRM: "",
      });
    } catch (err) {
      console.error("Error al registrar visita:", err);

      // ❌ Popup de error
      Swal.fire({
        title: "Error",
        text: err.message || "No se pudo registrar la visita.",
        icon: "error",
        confirmButtonText: "Cerrar",
        confirmButtonColor: "#DC2626", // rojo Tailwind 600
        background: "#fef2f2",
        color: "#7f1d1d",
        customClass: {
          popup: "rounded-xl shadow-lg",
          title: "text-lg font-semibold",
          confirmButton: "rounded-md px-5 py-2",
        },
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50 px-4 py-6">
      <div className="bg-white shadow-lg rounded-xl w-full max-w-3xl p-8 border border-gray-100">
        <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">
          Agendar nueva visita
        </h2>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* 🔹 Datos del Cliente */}
          <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-6">
            <div className="flex items-center gap-2 border-b pb-2">
              <Building2 className="w-5 h-5 text-blue-500" />
              <h3 className="text-lg font-semibold text-gray-800">
                Datos del cliente
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                ["clienteCodigo", "Código del cliente"],
                ["cliente", "Nombre del cliente"],
                ["ciudad", "Ciudad"],
                ["pais", "País"],
                ["direccion", "Dirección"],
                ["contacto", "Persona de contacto"],
                ["telefono", "Teléfono"],
                ["personaVisita", "Persona a visitar"],
              ].map(([name, placeholder]) => (
                <input
                  key={name}
                  name={name}
                  value={formData[name]}
                  onChange={handleChange}
                  placeholder={placeholder}
                  className="border border-gray-300 bg-gray-50 p-2.5 rounded-lg w-full focus:border-blue-500 focus:ring-2 focus:ring-blue-200 shadow-sm transition-all text-sm"
                  required={
                    ["pais", "contacto", "telefono"].includes(name)
                      ? false
                      : true
                  }
                />
              ))}
            </div>
          </section>

          {/* 🔹 Información de la Visita */}
          <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-6">
            <div className="flex items-center gap-2 border-b pb-2">
              <ClipboardList className="w-5 h-5 text-blue-500" />
              <h3 className="text-lg font-semibold text-gray-800">
                Información de la visita
              </h3>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de visita
              </label>
              <select
                name="tipoVisita"
                value={formData.tipoVisita}
                onChange={handleChange}
                className="border border-gray-300 bg-gray-50 p-2.5 rounded-lg w-full text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                required
              >
                <option value="por_definir">Seleccione un tipo</option>
                <option value="comercial">Comercial</option>
                <option value="tecnica">Técnica</option>
                <option value="capacitacion">Capacitación</option>
                <option value="auditoria">Auditoría</option>
                <option value="otros">Otros</option>
              </select>

              {formData.tipoVisita === "otros" && (
                <input
                  type="text"
                  name="otroTipo"
                  value={formData.otroTipo}
                  onChange={handleChange}
                  placeholder="Especificar tipo de visita (mínimo 10 caracteres)"
                  className="border border-gray-300 bg-gray-50 p-2.5 rounded-lg w-full mt-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                  required
                />
              )}
            </div>

            <div className="grid grid-cols-1 gap-4">
              <input
                name="motivo"
                value={formData.motivo}
                onChange={handleChange}
                placeholder="Motivo de la visita (ej: almuerzo, reunión técnica...)"
                className="border border-gray-300 bg-gray-50 p-2.5 rounded-lg w-full text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                required
              />
              <textarea
                name="descripcion"
                value={formData.descripcion}
                onChange={handleChange}
                placeholder="Descripción detallada de la visita"
                rows={2}
                className="border border-gray-300 bg-gray-50 p-2.5 rounded-lg w-full text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
              />
              <input
                name="proposito"
                value={formData.proposito}
                onChange={handleChange}
                placeholder="Propósito (ej: presentación de producto, negociación...)"
                className="border border-gray-300 bg-gray-50 p-2.5 rounded-lg w-full text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
              />
              <input
                name="oportunidadCRM"
                value={formData.oportunidadCRM}
                onChange={handleChange}
                placeholder="Número de oportunidad CRM (opcional)"
                className="border border-gray-300 bg-gray-50 p-2.5 rounded-lg w-full text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
              />
            </div>
          </section>

          {/* 🔹 Logística */}
          <section className="bg-white p-6 rounded-xl shadow-md border border-gray-100 space-y-6">
            <div className="flex items-center gap-2 border-b pb-2">
              <MapPin className="w-5 h-5 text-blue-500" />
              <h3 className="text-lg font-semibold text-gray-800">
                Logística del viaje
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Ciudad de origen */}
              <div className="relative">
                <label
                  htmlFor="ciudad_origen"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Ciudad de origen
                </label>
                <div className="relative">
                  <select
                    id="ciudad_origen"
                    name="ciudad_origen"
                    value={formData.ciudad_origen}
                    onChange={handleChange}
                    className="appearance-none w-full rounded-lg border border-gray-300 bg-gray-50 py-2.5 pl-3 pr-10 text-sm text-gray-700 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all cursor-pointer"
                    required
                  >
                    <option value="">Selecciona una ciudad</option>
                    <option value="Bogotá">Bogotá</option>
                    <option value="Medellín">Medellín</option>
                    <option value="Cali">Cali</option>
                    <option value="Barranquilla">Barranquilla</option>
                    <option value="Bucaramanga">Bucaramanga</option>
                    <option value="Pereira">Pereira</option>
                    <option value="Villavicencio">Villavicencio</option>
                    <option value="Cartagena">Cartagena</option>
                    <option value="Manizales">Manizales</option>
                    <option value="Neiva">Neiva</option>
                  </select>

                  <svg
                    className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>

              {/* Lugar */}
              <div>
                <label
                  htmlFor="lugar"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Lugar de visita
                </label>
                <input
                  id="lugar"
                  name="lugar"
                  value={formData.lugar}
                  onChange={handleChange}
                  placeholder="Oficina, planta, sucursal, etc."
                  className="border border-gray-300 bg-gray-50 p-2.5 rounded-lg w-full focus:border-blue-500 focus:ring-2 focus:ring-blue-200 shadow-sm transition-all text-sm"
                />
              </div>

              {/* Fechas */}
              {[
                ["fecha_ida", "Fecha de salida", getLocalDateTimeNow()],
                [
                  "fecha_regreso",
                  "Fecha de regreso",
                  formData.fecha_ida || getLocalDateTimeNow(),
                ],
              ].map(([name, label, min]) => (
                <div key={name}>
                  <label
                    htmlFor={name}
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    {label}
                  </label>
                  <input
                    type="datetime-local"
                    id={name}
                    name={name}
                    value={formData[name]}
                    onChange={handleChange}
                    min={min}
                    className="border border-gray-300 bg-gray-50 p-2.5 rounded-lg w-full focus:border-blue-500 focus:ring-2 focus:ring-blue-200 shadow-sm transition-all text-sm"
                    required
                  />
                </div>
              ))}
            </div>

            {/* Switches con tooltips */}
            <div className="space-y-3">
              {/* Requiere avión */}
              <div className="flex items-center justify-between py-2 group relative">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                  ¿Requiere avión?
                  <span className="text-gray-400 text-xs cursor-help group-hover:text-blue-500">
                    ✈️
                  </span>
                  <div className="absolute opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-1 group-hover:translate-y-0 bg-gray-800 text-white text-xs rounded-md px-2 py-1 top-[-40px] left-0 shadow-md whitespace-nowrap">
                    Actívalo si el viaje requiere transporte aéreo.
                  </div>
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      requiereAvion: !formData.requiereAvion,
                    })
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    formData.requiereAvion ? "bg-blue-600" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      formData.requiereAvion ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {/* Fondos de fábrica */}
              <div className="flex items-center justify-between py-2 group relative">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                  ¿Fondos de fábrica?
                  <span className="text-gray-400 text-xs cursor-help group-hover:text-blue-500">
                    💰
                  </span>
                  <div className="absolute opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-1 group-hover:translate-y-0 bg-gray-800 text-white text-xs rounded-md px-2 py-1 top-[-40px] left-0 shadow-md whitespace-nowrap">
                    Indica si la visita será cubierta con fondos de fábrica.
                  </div>
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      fondos_fabrica: !formData.fondos_fabrica,
                    })
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    formData.fondos_fabrica ? "bg-blue-600" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      formData.fondos_fabrica
                        ? "translate-x-6"
                        : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>
          </section>

          {/* Botón final */}
          <div className="flex justify-center pt-4">
            <button
              type="submit"
              disabled={loading}
              className={`flex items-center justify-center gap-2 text-white font-medium px-8 py-3 rounded-lg shadow-md transition-all w-full sm:w-auto transform active:scale-95 ${
                loading
                  ? "bg-blue-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              <Plane
                className={`w-5 h-5 transition-all duration-500 ${
                  loading
                    ? "animate-spin text-white"
                    : "text-white group-hover:translate-x-1"
                }`}
              />
              {loading ? "Agendando..." : "Agendar visita"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
