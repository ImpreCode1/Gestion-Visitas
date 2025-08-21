"use client";

import { useState } from "react";

export default function FormularioVisita() {
  const [formData, setFormData] = useState({
    cliente: "",
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
      setFormData({ cliente: "", fecha: "", lugar: "", objetivo: "" });
    } catch (err) {
      setMensaje(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white shadow-md rounded-xl mt-10">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">
        Registrar Visita
      </h1>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-gray-700 font-medium mb-1">
            Cliente
          </label>
          <input
            type="text"
            name="cliente"
            value={formData.cliente}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        <div>
          <label className="block text-gray-700 font-medium mb-1">
            Fecha de la visita
          </label>
          <input
            type="date"
            name="fecha"
            value={formData.fecha}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        <div>
          <label className="block text-gray-700 font-medium mb-1">
            Lugar
          </label>
          <input
            type="text"
            name="lugar"
            value={formData.lugar}
            onChange={handleChange}
            placeholder="Dirección u observaciones"
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        <div>
          <label className="block text-gray-700 font-medium mb-1">
            Objetivo de la visita
          </label>
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
              mensaje.includes("error") ? "text-red-500" : "text-green-500"
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
