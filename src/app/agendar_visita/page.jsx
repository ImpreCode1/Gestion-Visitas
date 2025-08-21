"use client";

import { useState } from "react";

export default function FormularioVisita() {
  const [formData, setFormData] = useState({
    cliente: "",
    direccion: "",
    contacto: "",
    telefono: "",
    personaVisita: "",
    justificacion: "",
    fecha: "",
    lugar: "",
    objetivo: "",
  });

  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMensaje("");

    try {
      const res = await fetch("/api/visitas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error("Error al registrar visita");

      setMensaje("¡Visita registrada correctamente!");
      setFormData({
        cliente: "",
        direccion: "",
        contacto: "",
        telefono: "",
        personaVisita: "",
        justificacion: "",
        fecha:"",
        lugar: "",
        objetivo: "",
      });
    } catch (err) {
      setMensaje(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white shadow-md rounded-xl mt-10">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Registrar Visita</h1>
      <form onSubmit={handleSubmit} className="space-y-5">
        {[
          { label: "Cliente", name: "cliente", type: "text", required: true },
          { label: "Dirección", name: "direccion", type: "text" },
          { label: "Contacto", name: "contacto", type: "text" },
          { label: "Teléfono", name: "telefono", type: "tel" },
          { label: "Persona a visitar", name: "personaVisita", type: "text" },
          { label: "Justificación", name: "justificacion", type: "text" },
          { label: "Fecha de la visita", name: "fecha", type: "date", required: true },
          { label: "Lugar", name: "lugar", type: "text" },
        ].map(({ label, name, type, required }) => (
          <div key={name}>
            <label className="block text-gray-700 font-medium mb-1">{label}</label>
            <input
              type={type}
              name={name}
              value={formData[name]}
              onChange={handleChange}
              required={required}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
        ))}

        <div>
          <label className="block text-gray-700 font-medium mb-1">Objetivo de la visita</label>
          <textarea
            name="objetivo"
            value={formData.objetivo}
            onChange={handleChange}
            rows={3}
            placeholder="Escribe el objetivo de la visita..."
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        {mensaje && (
          <p
            className={`text-center font-medium ${
              mensaje.toLowerCase().includes("error") ? "text-red-500" : "text-green-500"
            }`}
          >
            {mensaje}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition duration-200 font-semibold disabled:opacity-50"
        >
          {loading ? "Registrando..." : "Registrar Visita"}
        </button>
      </form>
    </div>
  );
}
