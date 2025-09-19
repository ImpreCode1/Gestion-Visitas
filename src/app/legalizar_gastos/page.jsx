"use client";

import { useState, useEffect } from "react";
import { FileText, Upload, X } from "lucide-react";

export default function FacturasPage() {
  const [visitas, setVisitas] = useState([]);
  const [files, setFiles] = useState([]);
  const [descripcion, setDescripcion] = useState("");
  const [monto, setMonto] = useState("");
  const [fechaEmision, setFechaEmision] = useState("");

  useEffect(() => {
    fetch("/api/visites")
      .then((res) => res.json())
      .then((data) => setVisitas(data.filter((v) => v.estado === "aprobada")));
  }, []);

  const handleFileChange = (e) => {
    const nuevosArchivos = Array.from(e.target.files);
    setFiles((prev) => [...prev, ...nuevosArchivos]);
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e, visitaId) => {
    e.preventDefault();
    if (files.length === 0) {
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
    <div className="p-6 max-w-5xl mx-auto bg-white min-h-screen">
      <h1 className="text-4xl font-bold text-blue-700 mb-10 text-center">
        Subida de Facturas
      </h1>

      {visitas.length === 0 && (
        <p className="text-gray-500 text-center text-lg">
          No tienes visitas aprobadas.
        </p>
      )}

      {visitas.map((visita) => (
        <div
          key={visita.id}
          className="mb-12 p-6 border border-gray-200 rounded-xl bg-gray-50 shadow-sm hover:shadow-md transition"
        >
          <h2 className="text-2xl font-semibold text-gray-800 mb-3">
            Visita a <span className="text-blue-600">{visita.cliente}</span>
          </h2>
          <p className="text-gray-600 mb-6">
            Estado: <strong>{visita.estado}</strong> |{" "}
            {formatFecha(visita.fecha_ida)} →{" "}
            {formatFecha(visita.fecha_regreso)}
          </p>

          <form
            onSubmit={(e) => handleSubmit(e, visita.id)}
            className="space-y-6"
          >
            {/* Subida de archivos */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Archivos
              </label>
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition">
                <Upload className="w-8 h-8 text-blue-500 mb-2" />
                <span className="text-gray-600 text-sm">
                  Haz clic para adjuntar tus archivos aquí
                </span>
                <input
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>

              {/* Vista previa */}
              {files.length > 0 && (
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {files.map((file, index) => {
                    const esImagen = file.type.startsWith("image/");
                    const esPDF = file.type === "application/pdf";

                    return (
                      <div
                        key={index}
                        className="relative flex flex-col items-center bg-white border rounded-lg p-2 shadow-sm"
                      >
                        {esImagen ? (
                          <img
                            src={URL.createObjectURL(file)}
                            alt={file.name}
                            className="w-full h-24 object-cover rounded-md"
                          />
                        ) : (
                          <div className="w-full h-24 flex items-center justify-center bg-gray-100 rounded-md">
                            <FileText
                              className={`w-10 h-10 ${
                                esPDF ? "text-red-500" : "text-gray-500"
                              }`}
                            />
                          </div>
                        )}
                        <span className="mt-2 text-xs text-gray-700 text-center truncate w-full">
                          {file.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Descripción */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción
              </label>
              <input
                type="text"
                placeholder="Ej: Factura por servicios"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                className="border border-gray-300 p-3 w-full rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Monto */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Monto total de las facturas
              </label>
              <input
                type="number"
                placeholder="Ej: 250000"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                className="border border-gray-300 p-3 w-full rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Botón */}
            <button
              type="submit"
              className="w-full bg-blue-600 text-white px-6 py-3 rounded-md font-semibold hover:bg-blue-700 transition"
            >
              Subir Facturas
            </button>
          </form>
        </div>
      ))}
    </div>
  );
}
