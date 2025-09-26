"use client";

import { useState, useEffect } from "react";
import { FileText, Upload, X, Trash2 } from "lucide-react";

export default function FacturasPage() {
  const [visitas, setVisitas] = useState([]);
  const [facturas, setFacturas] = useState({});
  const [newFiles, setNewFiles] = useState({});
  const [loading, setLoading] = useState(false);

  // 🔹 Cargar visitas aprobadas
  useEffect(() => {
    fetch("/api/visites")
      .then((res) => res.json())
      .then((data) => setVisitas(data.filter((v) => v.estado === "aprobada")));
  }, []);

  // 🔹 Cargar facturas de cada visita
  useEffect(() => {
    visitas.forEach((visita) => {
      fetch(`/api/facturas?visitaId=${visita.id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setFacturas((prev) => ({
              ...prev,
              [visita.id]: data.factura || {
                descripcion: "",
                montoTotal: "",
                archivos: [],
              },
            }));
          }
        });
    });
  }, [visitas]);

  // 🔹 Manejar cambios en los campos
  const handleChange = (visitaId, field, value) => {
    setFacturas((prev) => ({
      ...prev,
      [visitaId]: { ...prev[visitaId], [field]: value },
    }));
  };

  // 🔹 Subir archivos nuevos
  const handleFileChange = (visitaId, e) => {
    const files = Array.from(e.target.files);
    setNewFiles((prev) => ({
      ...prev,
      [visitaId]: [...(prev[visitaId] || []), ...files],
    }));
  };

  // 🔹 Eliminar archivo nuevo antes de enviar
  const removeNewFile = (visitaId, index) => {
    setNewFiles((prev) => ({
      ...prev,
      [visitaId]: prev[visitaId].filter((_, i) => i !== index),
    }));
  };

  // 🔹 Eliminar archivo existente
  const deleteArchivo = async (visitaId, idArchivo) => {
    if (!confirm("¿Seguro que deseas eliminar este archivo?")) return;

    const res = await fetch(`/api/facturas?idArchivo=${idArchivo}`, {
      method: "DELETE",
    });

    if (res.ok) {
      setFacturas((prev) => ({
        ...prev,
        [visitaId]: {
          ...prev[visitaId],
          archivos: prev[visitaId].archivos.filter((a) => a.id !== idArchivo),
        },
      }));
    }
  };

  // 🔹 Guardar cambios (archivos + campos)
  const handleSubmit = async (e, visitaId) => {
    e.preventDefault();
    setLoading(true);

    const factura = facturas[visitaId];
    const nuevos = newFiles[visitaId] || [];

    // 1. Subir/actualizar con archivos (si hay)
    if (nuevos.length > 0) {
      const formData = new FormData();
      nuevos.forEach((file) => formData.append("files", file));
      formData.append("descripcion", factura.descripcion || "");
      formData.append("monto", factura.montoTotal || "");
      formData.append("visitaId", visitaId);

      await fetch("/api/facturas", {
        method: "POST",
        body: formData,
      });
    } else {
      // 2. Solo actualizar descripción/monto
      await fetch(`/api/facturas?visitaId=${visitaId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          descripcion: factura.descripcion,
          monto: factura.montoTotal,
        }),
      });
    }

    // Refrescar datos
    const res = await fetch(`/api/facturas?visitaId=${visitaId}`);
    const data = await res.json();
    if (data.success) {
      setFacturas((prev) => ({ ...prev, [visitaId]: data.factura }));
      setNewFiles((prev) => ({ ...prev, [visitaId]: [] }));
    }

    setLoading(false);
    alert("Factura actualizada ✅");
  };

  const formatFecha = (fechaStr) => {
    const fecha = new Date(fechaStr);
    return new Intl.DateTimeFormat("es-CO", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(fecha);
  };

  const isVencida = (fecha_regreso) => {
    const limite = new Date(fecha_regreso);
    limite.setDate(limite.getDate() + 3);
    return new Date() > limite;
  };

  return (
    <div className="p-6 max-w-5xl mx-auto bg-white min-h-screen">
      <h1 className="text-4xl font-bold text-blue-700 mb-10 text-center">
        Subida y Gestión de Facturas
      </h1>

      {visitas.length === 0 && (
        <p className="text-gray-500 text-center text-lg">
          No tienes visitas aprobadas.
        </p>
      )}

      {visitas.map((visita) => {
        const factura = facturas[visita.id] || {
          descripcion: "",
          montoTotal: "",
          archivos: [],
        };
        const nuevos = newFiles[visita.id] || [];

        // 🔹 Calcular si ya pasó la fecha límite
        const fechaRegreso = new Date(visita.fecha_regreso);
        const fechaLimite = new Date(fechaRegreso);
        fechaLimite.setDate(fechaLimite.getDate() + 3);

        const hoy = new Date();
        const vencido = hoy > fechaLimite;
        return (
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

            {/* 🟢 Mostrar mensaje del plazo */}
            <p className="text-sm text-green-600 mb-6">
              ⚠️ Tienes plazo para subir las facturas hasta el{" "}
              <strong>{formatFecha(fechaLimite)}</strong>
            </p>

            {vencido ? (
              // 🔹 Mensaje si ya venció el plazo
              <div className="p-4 bg-red-100 border border-red-300 text-red-700 rounded-md">
                ⚠️ Ya venció el plazo para subir facturas. Tenías hasta:{" "}
                <b>{formatFecha(fechaLimite)}</b>
              </div>
            ) : (
              <form
                onSubmit={(e) => handleSubmit(e, visita.id)}
                className="space-y-6"
              >
                {/* Archivos existentes */}
                {factura.archivos?.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">
                      Archivos existentes
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {factura.archivos.map((archivo) => {
                        const esImagen = /\.(jpg|jpeg|png|gif)$/i.test(
                          archivo.url
                        );
                        return (
                          <div
                            key={archivo.id}
                            className="relative flex flex-col items-center bg-white border rounded-lg p-2 shadow-sm"
                          >
                            {esImagen ? (
                              <img
                                src={archivo.url}
                                alt={archivo.nombre}
                                className="w-20 h-20 object-cover mb-2 rounded"
                              />
                            ) : (
                              <FileText className="w-10 h-10 text-gray-600 mb-2" />
                            )}
                            <a
                              href={archivo.url}
                              target="_blank"
                              className="text-xs text-blue-600 truncate w-full text-center"
                            >
                              {archivo.nombre}
                            </a>
                            <button
                              type="button"
                              onClick={() =>
                                deleteArchivo(visita.id, archivo.id)
                              }
                              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Archivos nuevos */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subir nuevos archivos
                  </label>
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition">
                    <Upload className="w-8 h-8 text-blue-500 mb-2" />
                    <span className="text-gray-600 text-sm">
                      Haz clic para adjuntar archivos
                    </span>
                    <input
                      type="file"
                      multiple
                      onChange={(e) => handleFileChange(visita.id, e)}
                      className="hidden"
                    />
                  </label>

                  {nuevos.length > 0 && (
                    <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {nuevos.map((file, index) => {
                        const esImagen = /\.(jpg|jpeg|png|gif)$/i.test(
                          file.name
                        );
                        const previewUrl = esImagen
                          ? URL.createObjectURL(file)
                          : null;
                        return (
                          <div
                            key={index}
                            className="relative flex flex-col items-center bg-white border rounded-lg p-2 shadow-sm"
                          >
                            {esImagen ? (
                              <img
                                src={previewUrl}
                                alt={file.name}
                                className="w-20 h-20 object-cover mb-2 rounded"
                              />
                            ) : (
                              <FileText className="w-10 h-10 text-gray-600 mb-2" />
                            )}
                            <span className="text-xs text-gray-700 truncate w-full text-center">
                              {file.name}
                            </span>
                            <button
                              type="button"
                              onClick={() => removeNewFile(visita.id, index)}
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
                    value={factura.descripcion || ""}
                    onChange={(e) =>
                      handleChange(visita.id, "descripcion", e.target.value)
                    }
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
                    value={factura.montoTotal || ""}
                    onChange={(e) =>
                      handleChange(visita.id, "montoTotal", e.target.value)
                    }
                    className="border border-gray-300 p-3 w-full rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Botón */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 text-white px-6 py-3 rounded-md font-semibold hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {loading ? "Guardando..." : "Guardar Facturas"}
                </button>
              </form>
            )}
          </div>
        );
      })}
    </div>
  );
}
