"use client";

import { useEffect, useState } from "react";
import { FileText, XCircle, CheckCircle2, Plane, User, X } from "lucide-react";

export default function VisitasPage() {
  const [visitas, setVisitas] = useState([]);
  const [loading, setLoading] = useState(true);

  // estados para modales
  const [selectedVisita, setSelectedVisita] = useState(null);
  const [showDetalles, setShowDetalles] = useState(false);
  const [showFacturas, setShowFacturas] = useState(false);

  // 🔹 Cargar visitas al montar
  useEffect(() => {
    const fetchVisitas = async () => {
      try {
        const res = await fetch("/api/visites/admin");
        if (!res.ok) throw new Error("Error al obtener visitas");
        const data = await res.json();
        setVisitas(data.visitas || []);
      } catch (error) {
        console.error(error);
        setVisitas([]);
      } finally {
        setLoading(false);
      }
    };
    fetchVisitas();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Encabezado */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-blue-800 text-center flex-1">
            Historial de Visitas
          </h1>
        </div>

        {/* Tabla */}
        <div className="bg-white shadow-lg rounded-xl overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead className="bg-blue-50">
              <tr>
                <th className="p-3 text-sm font-semibold text-gray-700">ID</th>
                <th className="p-3 text-sm font-semibold text-gray-700">
                  Gerente
                </th>
                <th className="p-3 text-sm font-semibold text-gray-700">
                  Cliente
                </th>
                <th className="p-3 text-sm font-semibold text-gray-700">
                  Fechas
                </th>
                <th className="p-3 text-sm font-semibold text-gray-700">
                  Estado
                </th>
                <th className="p-3 text-sm font-semibold text-gray-700">
                  Facturas
                </th>
                <th className="p-3 text-sm font-semibold text-gray-700">
                  Aprobaciones
                </th>
                <th className="p-3 text-sm font-semibold text-gray-700 text-center">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="text-center p-6 text-gray-500">
                    Cargando visitas...
                  </td>
                </tr>
              ) : visitas.length > 0 ? (
                visitas.map((visita, idx) => (
                  <tr
                    key={visita.id}
                    className={`border-b hover:bg-gray-50 transition ${
                      idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                    }`}
                  >
                    <td className="p-3">{visita.id}</td>

                    {/* Gerente */}
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-blue-600" />
                        <div>
                          <div className="font-medium">
                            {visita.gerente.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {visita.gerente.email}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Cliente */}
                    <td className="p-3">
                      <div className="font-medium">{visita.cliente}</div>
                      <div className="text-xs text-gray-500">
                        Código: {visita.clienteCodigo}
                      </div>
                    </td>

                    {/* Fechas */}
                    <td className="p-3 text-xs text-gray-700">
                      <div>
                        Ida: {new Date(visita.fecha_ida).toLocaleDateString()}
                      </div>
                      <div>
                        Regreso:{" "}
                        {new Date(visita.fecha_regreso).toLocaleDateString()}
                      </div>
                    </td>

                    {/* Estado */}
                    <td className="p-3">
                      <span
                        className={`px-2 py-1 text-xs rounded-lg ${
                          visita.estado === "pendiente"
                            ? "bg-yellow-100 text-yellow-700"
                            : visita.estado === "aprobada"
                            ? "bg-green-100 text-green-700"
                            : visita.estado === "rechazada"
                            ? "bg-red-100 text-red-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {visita.estado}
                      </span>
                      {visita.requiereAvion && (
                        <Plane className="w-4 h-4 text-blue-500 inline ml-1" />
                      )}
                    </td>

                    {/* Facturas */}
                    <td className="p-3 text-center">
                      {visita.facturas ? (
                        <div className="flex flex-col items-center">
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                          <span className="text-xs text-gray-500">
                            ${visita.facturas.montoTotal?.toFixed(2) || 0}
                          </span>
                        </div>
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600 inline-block" />
                      )}
                    </td>

                    {/* Aprobaciones */}
                    <td className="p-3">
                      <div className="flex flex-col gap-1 text-xs">
                        {visita.aprobaciones.map((ap) => (
                          <div key={ap.id}>
                            {ap.rol}:{" "}
                            <span
                              className={`font-semibold ${
                                ap.estado === "aprobado"
                                  ? "text-green-600"
                                  : ap.estado === "rechazado"
                                  ? "text-red-600"
                                  : "text-yellow-600"
                              }`}
                            >
                              {ap.estado}
                            </span>
                          </div>
                        ))}
                      </div>
                    </td>

                    {/* Acciones */}
                    <td className="p-3 flex flex-col gap-2 text-center">
                      <button
                        onClick={() => {
                          setSelectedVisita(visita);
                          setShowDetalles(true);
                        }}
                        className="px-3 py-1 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 transition"
                      >
                        Ver detalles
                      </button>
                      {visita.facturas && (
                        <button
                          onClick={() => {
                            setSelectedVisita(visita);
                            setShowFacturas(true);
                          }}
                          className="px-3 py-1 text-sm bg-green-500 text-white rounded-md hover:bg-green-600 transition flex items-center gap-1 justify-center"
                        >
                          <FileText className="w-4 h-4" /> Ver facturas
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="text-center p-6 text-gray-500">
                    No hay visitas registradas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Detalles */}
      {showDetalles && selectedVisita && (
        <div className="fixed inset-0 bg-black/10 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl relative border border-gray-200">
            <button
              onClick={() => setShowDetalles(false)}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold mb-4 text-blue-700">
              Detalles de la Visita {selectedVisita.id}
            </h2>
            <p>
              <b>Cliente:</b> {selectedVisita.cliente} (
              {selectedVisita.clienteCodigo})
            </p>
            <p>
              <b>Motivo:</b> {selectedVisita.motivo}
            </p>
            <p>
              <b>Lugar:</b> {selectedVisita.lugar}
            </p>
            <p>
              <b>Fechas:</b>{" "}
              {new Date(selectedVisita.fecha_ida).toLocaleDateString()} -{" "}
              {new Date(selectedVisita.fecha_regreso).toLocaleDateString()}
            </p>
            <p>
              <b>Estado:</b> {selectedVisita.estado}
            </p>
            <div className="mt-4">
              <h3 className="font-semibold">Aprobaciones:</h3>
              {selectedVisita.aprobaciones.map((ap) => (
                <div key={ap.id}>
                  {ap.rol}: <span className="font-medium">{ap.estado}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal Facturas */}
      {showFacturas && selectedVisita && selectedVisita.facturas && (
        <div className="fixed inset-0 bg-black/10 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl relative border border-gray-200">
            <button
              onClick={() => setShowFacturas(false)}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold mb-4 text-green-700">
              Facturas de la Visita {selectedVisita.id}
            </h2>
            <p>
              <b>Descripción:</b> {selectedVisita.facturas.descripcion}
            </p>
            <p>
              <b>Monto Total:</b> $
              {selectedVisita.facturas.montoTotal?.toFixed(2)}
            </p>
            <div className="mt-4">
              <h3 className="font-semibold">Archivos:</h3>
              <ul className="list-disc ml-6">
                {selectedVisita.facturas.archivos.map((f) => (
                  <li key={f.id}>
                    <a
                      href={f.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {f.nombre}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
