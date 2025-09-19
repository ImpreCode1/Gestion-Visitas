"use client";

import { useState, useEffect } from "react";

export default function FacturasPage() {
  const [visitas, setVisitas] = useState([]);
  const [files, setFiles] = useState([]);
  const [descripcion, setDescripcion] = useState("");
  const [monto, setMonto] = useState("");
  const [fechaEmision, setFechaEmision] = useState("");

  useEffect(() => {
    fetch("/api/visites")
      .then((res) => res.json())
      .then((data) => setVisitas(data));
  }, []);

  const handleSubmit = async (e, visitaId) => {
    e.preventDefault();
    if (!files || files.length === 0) {
      return alert("Selecciona al menos un archivo");
    }

    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));

    formData.append("descripcion", descripcion);
    formData.append("monto", monto);
    formData.append("fechaEmision", fechaEmision);
    formData.append("visitaId", visitaId);

    const res = await fetch("/api/facturas", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();

    if (data.success) {
      alert("Factura(s) subida(s) correctamente ✅");
      setFiles([]);
      setDescripcion("");
      setMonto("");
      setFechaEmision("");
    } else {
      alert(data.error || "Error al subir factura ❌");
    }
  };

  const formatFecha = (fechaStr) => {
    const fecha = new Date(fechaStr);
    return new Intl.DateTimeFormat("es-CO", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(fecha);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto bg-white min-h-screen">
      <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">
        Subida de Facturas
      </h1>

      {visitas.length === 0 && (
        <p className="text-gray-500 text-center">No tienes visitas pendientes.</p>
      )}

      {visitas.map((visita) => (
        <div
          key={visita.id}
          className="mb-10 p-6 border border-gray-200 rounded-lg bg-gray-50 shadow-sm hover:shadow-md transition"
        >
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            Visita a <span className="text-blue-600">{visita.cliente}</span>
          </h2>
          <p className="text-gray-600 mb-4">
            Estado: <strong>{visita.estado}</strong> | {formatFecha(visita.fecha_ida)} → {formatFecha(visita.fecha_regreso)}
          </p>

          <form onSubmit={(e) => handleSubmit(e, visita.id)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Archivos</label>
              <input
                type="file"
                multiple
                onChange={(e) => setFiles(Array.from(e.target.files))}
                required
                className="block w-full text-sm text-gray-900 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
              <input
                type="text"
                placeholder="Descripción general"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                className="border border-gray-300 p-2 w-full rounded-md focus:ring-2 focus:ring-blue-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Monto</label>
              <input
                type="number"
                placeholder="Monto total"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                className="border border-gray-300 p-2 w-full rounded-md focus:ring-2 focus:ring-blue-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de emisión</label>
              <input
                type="date"
                value={fechaEmision}
                onChange={(e) => setFechaEmision(e.target.value)}
                className="border border-gray-300 p-2 w-full rounded-md focus:ring-2 focus:ring-blue-400"
              />
            </div>

            <button
              type="submit"
              className="bg-blue-600 text-white px-6 py-2 rounded-md font-semibold hover:bg-blue-700 transition"
            >
              Subir Facturas
            </button>
          </form>
        </div>
      ))}
    </div>
  );
}
