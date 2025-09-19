"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  XCircle,
  CheckCircle2,
  Clock,
  Plane,
  User,
} from "lucide-react";

export default function VisitasPage() {
  const [visitas, setVisitas] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // 🔹 Cargar visitas al montar
  useEffect(() => {
    const fetchVisitas = async () => {
      try {
        const res = await fetch("/api/visites/admin"); // 👈 endpoint especial para admin
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
                          <div className="font-medium">{visita.gerente.name}</div>
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
                        onClick={() =>
                          router.push(`/admin/visitas/${visita.id}`)
                        }
                        className="px-3 py-1 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 transition"
                      >
                        Ver detalles
                      </button>
                      {visita.facturas && (
                        <button
                          onClick={() =>
                            router.push(`/admin/visitas/${visita.id}/facturas`)
                          }
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
    </div>
  );
}
