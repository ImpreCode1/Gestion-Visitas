"use client";

import { useEffect, useState } from "react";
import { Loader2, FileText, Printer } from "lucide-react";
import * as XLSX from "xlsx";

function getCurrentWeekBounds() {
  const now = new Date();
  const day = now.getDay();
  const diff = (day + 6) % 7;
  const monday = new Date(now);
  monday.setDate(now.getDate() - diff);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return { monday, sunday };
}

function getCurrentMonthBounds() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

function daysBetween(createdAt, fechaIda) {
  const c = new Date(createdAt);
  const f = new Date(fechaIda);
  return Math.round((f - c) / (1000 * 60 * 60 * 24));
}

function groupByGerente(visitas) {
  const map = {};
  for (const v of visitas) {
    const id = v.gerente.id;
    if (!map[id]) {
      map[id] = { gerenteId: id, gerente: v.gerente.name, visitas: [] };
    }
    map[id].visitas.push(v);
  }
  return Object.values(map)
    .map((g) => {
      const total = g.visitas.length;
      const sumDias = g.visitas.reduce(
        (acc, v) => acc + daysBetween(v.createdAt, v.fecha_ida),
        0
      );
      const promedio = total > 0 ? Math.round((sumDias / total) * 10) / 10 : 0;
      const menos5 = g.visitas.filter(
        (v) => daysBetween(v.createdAt, v.fecha_ida) < 5
      ).length;
      return { gerenteId: g.gerenteId, gerente: g.gerente, total, promedio, menos5 };
    })
    .sort((a, b) => b.total - a.total);
}

function fmtDate(iso) {
  if (!iso) return "-";
  try {
    return new Date(iso).toLocaleDateString();
  } catch {
    return "-";
  }
}

const meses = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

export default function ReportesPage() {
  const [user, setUser] = useState(null);
  const [visitas, setVisitas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const meRes = await fetch("/api/me", { credentials: "include" });
        if (!meRes.ok) throw new Error("No autorizado");
        const meData = await meRes.json();
        if (meData.role !== "admin") throw new Error("Acceso denegado");
        setUser(meData);

        const visRes = await fetch("/api/visites/admin", {
          credentials: "include",
        });
        if (!visRes.ok) throw new Error("Error al cargar visitas");
        const visData = await visRes.json();
        setVisitas(visData.visitas || []);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const semana = getCurrentWeekBounds();
  const mes = getCurrentMonthBounds();

  const visitasSemana = visitas.filter((v) => {
    const f = new Date(v.fecha_ida);
    return f >= semana.monday && f <= semana.sunday;
  });

  const visitasMes = visitas.filter((v) => {
    const f = new Date(v.createdAt);
    return f >= mes.start && f <= mes.end;
  });

  const grupos = groupByGerente(visitasMes);

  const exportSemanal = () => {
    const data = visitasSemana.map((v) => ({
      Cliente: v.cliente,
      Gerente: v.gerente?.name || "-",
      "Ciudad origen": v.ciudad_origen || "-",
      "Ciudad destino": v.ciudad || "-",
      "Fecha salida": fmtDate(v.fecha_ida),
      "Fecha regreso": fmtDate(v.fecha_regreso),
      Estado: v.estado,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Semanal");
    XLSX.writeFile(wb, "reporte-semanal.xlsx");
  };

  const exportMensual = () => {
    const data = grupos.map((g) => ({
      Gerente: g.gerente,
      "Total visitas": g.total,
      "Promedio días anticipación": g.promedio,
      "Visitas con <5 días": g.menos5,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Anticipación");
    XLSX.writeFile(wb, "reporte-mensual-anticipacion.xlsx");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-gray-500 gap-2">
        <Loader2 className="w-5 h-5 animate-spin" /> Cargando reportes...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 sm:p-6 max-w-7xl mx-auto">
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print-area, .print-area * { visibility: visible; }
          .print-area { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
        }
      `}</style>
      <h1 className="text-2xl sm:text-3xl font-bold text-blue-900 mb-8">
        Reportes
      </h1>

      {/* Reporte Semanal */}
      <section className="mb-10 print-area">
        <div className="flex items-center justify-between mb-4 no-print">
          <h2 className="text-xl font-semibold text-gray-800">
            Reporte Semanal
          </h2>
          <div className="flex gap-2">
            <button
              onClick={exportSemanal}
              className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm flex items-center gap-2"
            >
              <FileText className="w-4 h-4" /> Exportar Excel
            </button>
            <button
              onClick={() => window.print()}
              className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm flex items-center gap-2"
            >
              <Printer className="w-4 h-4" /> Exportar PDF
            </button>
          </div>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          {semana.monday.toLocaleDateString()} —{" "}
          {semana.sunday.toLocaleDateString()}
        </p>
        <div className="bg-white shadow-lg rounded-xl overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead className="bg-blue-50">
              <tr>
                <th className="p-3 text-sm font-semibold text-gray-700">
                  Cliente
                </th>
                <th className="p-3 text-sm font-semibold text-gray-700">
                  Gerente
                </th>
                <th className="p-3 text-sm font-semibold text-gray-700">
                  Ciudad origen
                </th>
                <th className="p-3 text-sm font-semibold text-gray-700">
                  Ciudad destino
                </th>
                <th className="p-3 text-sm font-semibold text-gray-700">
                  Fecha salida
                </th>
                <th className="p-3 text-sm font-semibold text-gray-700">
                  Fecha regreso
                </th>
                <th className="p-3 text-sm font-semibold text-gray-700">
                  Estado
                </th>
              </tr>
            </thead>
            <tbody>
              {visitasSemana.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="text-center p-6 text-gray-500"
                  >
                    No hay visitas programadas para esta semana.
                  </td>
                </tr>
              ) : (
                visitasSemana.map((v, i) => (
                  <tr
                    key={v.id}
                    className={`border-b hover:bg-gray-50 ${
                      i % 2 === 0 ? "bg-white" : "bg-gray-50"
                    }`}
                  >
                    <td className="p-3 font-medium">{v.cliente}</td>
                    <td className="p-3">{v.gerente?.name || "-"}</td>
                    <td className="p-3">{v.ciudad_origen || "-"}</td>
                    <td className="p-3">{v.ciudad || "-"}</td>
                    <td className="p-3">{fmtDate(v.fecha_ida)}</td>
                    <td className="p-3">{fmtDate(v.fecha_regreso)}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-1 text-xs rounded-lg ${
                          v.estado === "aprobada"
                            ? "bg-green-100 text-green-700"
                            : v.estado === "rechazada"
                            ? "bg-red-100 text-red-700"
                            : v.estado === "completada"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {v.estado}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Reporte Mensual de Anticipación */}
      <section className="print-area">
        <div className="flex items-center justify-between mb-4 no-print">
          <h2 className="text-xl font-semibold text-gray-800">
            Reporte Mensual de Anticipación
          </h2>
          <button
            onClick={exportMensual}
            className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm flex items-center gap-2"
          >
            <FileText className="w-4 h-4" /> Exportar Excel
          </button>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          {meses[new Date().getMonth()]} {new Date().getFullYear()}
        </p>
        <div className="bg-white shadow-lg rounded-xl overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead className="bg-blue-50">
              <tr>
                <th className="p-3 text-sm font-semibold text-gray-700">
                  Gerente
                </th>
                <th className="p-3 text-sm font-semibold text-gray-700">
                  Total visitas
                </th>
                <th className="p-3 text-sm font-semibold text-gray-700">
                  Promedio días anticipación
                </th>
                <th className="p-3 text-sm font-semibold text-gray-700">
                  Visitas con &lt;5 días
                </th>
              </tr>
            </thead>
            <tbody>
              {grupos.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="text-center p-6 text-gray-500"
                  >
                    No hay visitas registradas este mes.
                  </td>
                </tr>
              ) : (
                grupos.map((g, i) => (
                  <tr
                    key={g.gerenteId}
                    className={`border-b hover:bg-gray-50 ${
                      i % 2 === 0 ? "bg-white" : "bg-gray-50"
                    }`}
                  >
                    <td className="p-3 font-medium">{g.gerente}</td>
                    <td className="p-3">{g.total}</td>
                    <td className="p-3">{g.promedio}</td>
                    <td className="p-3">{g.menos5}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <p className="text-center text-sm text-gray-400 mt-8 no-print">
        Para exportar a PDF, usa el botón &quot;Exportar PDF&quot; y selecciona
        &quot;Guardar como PDF&quot; en el diálogo de impresión.
      </p>
    </div>
  );
}
