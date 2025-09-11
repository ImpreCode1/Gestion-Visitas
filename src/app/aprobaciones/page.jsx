"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle2, XCircle, Eye, RefreshCw } from "lucide-react";

// Opciones de filtro de estado para las aprobaciones
const ESTADOS = [
  { value: "todos", label: "Todos" },
  { value: "pendiente", label: "Pendiente" },
  { value: "aprobado", label: "Aprobado" },
  { value: "rechazado", label: "Rechazado" },
];

// Función para formatear fechas ISO a string legible
function fmtDate(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString();
  } catch {
    return "-";
  }
}

// Componente que muestra un badge con color según el estado
function EstadoBadge({ estado }) {
  const map = {
    pendiente: "bg-yellow-100 text-yellow-800",
    aprobado: "bg-green-100 text-green-800",
    rechazado: "bg-red-100 text-red-800",
  };
  return (
    <span
      className={`px-2 py-1 rounded text-sm capitalize ${
        map[estado] || "bg-gray-100 text-gray-800"
      }`}
    >
      {estado}
    </span>
  );
}

// Componente principal para ver y gestionar aprobaciones
export default function VerAprobaciones() {
  const router = useRouter();

  // Estado del componente
  const [data, setData] = useState([]); // Datos de aprobaciones
  const [total, setTotal] = useState(0); // Total de elementos para paginación
  const [loading, setLoading] = useState(false); // Estado de carga
  const [error, setError] = useState(""); // Mensaje de error

  const [estado, setEstado] = useState("pendiente"); // Filtro de estado
  const [q, setQ] = useState(""); // Texto de búsqueda
  const [page, setPage] = useState(1); // Página actual
  const [perPage, setPerPage] = useState(10); // Elementos por página

  const [confirmOpen, setConfirmOpen] = useState(false); // Modal de confirmación
  const [confirmType, setConfirmType] = useState(null); // Tipo de acción (aprobar/rechazar)
  const [currentRow, setCurrentRow] = useState(null); // Fila actual para acción
  const [comentario, setComentario] = useState(""); // Comentario opcional

  // Búsqueda con debounce para no enviar demasiadas solicitudes
  const [qDebounced, setQDebounced] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setQDebounced(q.trim()), 350);
    return () => clearTimeout(t);
  }, [q]);

  // Construye parámetros de consulta para la API
  const qp = useMemo(() => {
    const p = new URLSearchParams();
    if (estado && estado !== "todos") p.set("estado", estado);
    if (qDebounced) p.set("q", qDebounced);
    p.set("page", String(page));
    p.set("perPage", String(perPage));
    return p.toString();
  }, [estado, qDebounced, page, perPage]);

  // Función para obtener las aprobaciones desde la API
  async function fetchAprobaciones(signal) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/approvals?${qp}`, { signal });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const json = await res.json();
      setData(json.rows || []);
      setTotal(json.total || 0);
    } catch (e) {
      if (e.name !== "AbortError") setError(e.message || "Error al cargar");
    } finally {
      setLoading(false);
    }
  }

  // Efecto para cargar datos cada vez que cambian los parámetros de consulta
  useEffect(() => {
    const ctrl = new AbortController();
    fetchAprobaciones(ctrl.signal);
    return () => ctrl.abort();
  }, [qp]);

  const totalPages = Math.max(1, Math.ceil(total / perPage));

  // Abre modal de confirmación
  function openConfirm(type, row) {
    setConfirmType(type);
    setCurrentRow(row);
    setComentario("");
    setConfirmOpen(true);
  }

  // Ejecuta la acción de aprobar o rechazar
  async function mutateAprobacion(action) {
    if (!currentRow) return;
    const id = currentRow.id;
    const body = { comentario };
    const prev = [...data]; // Guardamos estado previo en caso de error
    setData((rows) =>
      rows.map((r) =>
        r.id === id
          ? { ...r, estado: action === "aprobar" ? "aprobado" : "rechazado" }
          : r
      )
    );

    try {
      const res = await fetch(`/api/approvals/${id}/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`No se pudo ${action}`);
    } catch (e) {
      setData(prev); // Revertir cambios en caso de error
      setError(e.message || `Error al ${action}`);
    } finally {
      setConfirmOpen(false);
    }
  }

  // Componente de fila de aprobación
  function Row({ row }) {
    const cliente = row?.visita?.cliente || row?.cliente || "-";
    const contacto = row?.visita?.contacto || row?.contacto || "";
    const ciudad = row?.visita?.ciudad || row?.ciudad || "-";
    const pais = row?.visita?.pais || row?.pais || "";
    const fechaIda = fmtDate(row?.visita?.fecha_ida || row?.fecha_ida);
    const fechaRegreso = fmtDate(row?.visita?.fecha_regreso || row?.fecha_regreso);
    const gerente = row?.visita?.gerente?.name || row?.gerente?.name || "-";
    const estado = row?.estado || "pendiente";

    return (
      <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition p-4 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        {/* Cliente */}
        <div className="md:col-span-3">
          <div className="font-semibold text-lg">{cliente}</div>
          {contacto && <div className="text-sm text-gray-500">{contacto}</div>}
        </div>

        {/* Ciudad / País */}
        <div className="md:col-span-2">
          <div className="text-sm">{ciudad}</div>
          {pais && <div className="text-xs text-gray-400">{pais}</div>}
        </div>

        {/* Fechas */}
        <div className="md:col-span-3 text-sm">
          <div>
            <span className="text-gray-500">Ida: </span>
            <span className="font-medium">{fechaIda}</span>
          </div>
          <div>
            <span className="text-gray-500">Regreso: </span>
            <span className="font-medium">{fechaRegreso}</span>
          </div>
        </div>

        {/* Gerente */}
        <div className="md:col-span-2 text-sm">
          <div className="text-gray-500">Gerente</div>
          <div className="font-medium">{gerente}</div>
        </div>

        {/* Estado */}
        <div className="md:col-span-1 flex justify-center">
          <EstadoBadge estado={estado} />
        </div>

        {/* Acciones */}
        <div className="md:col-span-1 flex gap-2 justify-end md:justify-center">
          <button
            className="p-2 border rounded hover:bg-gray-50"
            title="Ver detalle"
            onClick={() => router.push(`/approvals/${row.id}`)}
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            className="p-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
            title="Aprobar"
            onClick={() => openConfirm("aprobar", row)}
            disabled={estado !== "pendiente"}
          >
            <CheckCircle2 className="w-4 h-4" />
          </button>
          <button
            className="p-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
            title="Rechazar"
            onClick={() => openConfirm("rechazar", row)}
            disabled={estado !== "pendiente"}
          >
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Encabezado y filtros */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-blue-800">
          Aprobaciones
        </h1>
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full sm:w-auto">
          <button
            className="px-3 py-2 border rounded flex items-center gap-2 hover:bg-gray-100 transition"
            onClick={() => fetchAprobaciones()}
          >
            <RefreshCw className="w-4 h-4" /> Refrescar
          </button>
          <select
            value={estado}
            onChange={(e) => {
              setPage(1);
              setEstado(e.target.value);
            }}
            className="px-2 py-2 border rounded bg-white"
          >
            {ESTADOS.map((e) => (
              <option key={e.value} value={e.value}>
                {e.label}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Buscar cliente, ciudad, gerente..."
            value={q}
            onChange={(e) => {
              setPage(1);
              setQ(e.target.value);
            }}
            className="px-3 py-2 border rounded w-full sm:w-[320px]"
          />
        </div>
      </div>

      {/* Contenido principal */}
      <div className="border rounded-lg shadow-sm bg-white">
        {error && <div className="p-3 text-sm text-red-600">{error}</div>}

        {loading ? (
          <div className="flex items-center justify-center py-12 text-gray-500 gap-2">
            <Loader2 className="w-5 h-5 animate-spin" /> Cargando
            aprobaciones...
          </div>
        ) : data.length === 0 ? (
          <div className="py-12 text-center text-gray-500">
            No hay aprobaciones para mostrar.
          </div>
        ) : (
          <div className="flex flex-col divide-y">
            {/* Encabezados */}
            <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-2 bg-gray-50 border-b text-sm font-semibold text-gray-700">
              <div className="col-span-3">Cliente</div>
              <div className="col-span-2">Ciudad / País</div>
              <div className="col-span-3">Fechas</div>
              <div className="col-span-2">Gerente</div>
              <div className="col-span-1 text-center">Estado</div>
              <div className="col-span-1 text-center">Acciones</div>
            </div>

            {/* Filas */}
            {data.map((row) => (
              <Row key={row.id} row={row} />
            ))}
          </div>
        )}

        {/* Paginación */}
        <div className="flex flex-col sm:flex-row items-center justify-between p-4 gap-4">
          <div className="text-sm text-gray-500">
            Página {page} de {totalPages} • {total} elementos
          </div>
          <div className="flex items-center gap-2">
            <select
              value={perPage}
              onChange={(e) => {
                setPage(1);
                setPerPage(Number(e.target.value));
              }}
              className="px-2 py-2 border rounded bg-white"
            >
              {[10, 20, 50].map((n) => (
                <option key={n} value={n}>
                  {n} / pág
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <button
                className="px-3 py-1 border rounded disabled:opacity-50 hover:bg-gray-100 transition"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Anterior
              </button>
              <button
                className="px-3 py-1 border rounded disabled:opacity-50 hover:bg-gray-100 transition"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Siguiente
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Diálogo de confirmación */}
      {confirmOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold flex items-center gap-2 mb-2">
              {confirmType === "aprobar" ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-green-500" /> Confirmar
                  aprobación
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5 text-red-500" /> Confirmar rechazo
                </>
              )}
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              {confirmType === "aprobar"
                ? "Esta acción aprobará la visita y notificará al solicitante."
                : "Esta acción rechazará la visita. Puedes agregar un motivo."}
            </p>
            <div className="mb-4">
              <label className="text-sm block mb-1">
                Comentario (opcional)
              </label>
              <textarea
                className="w-full border rounded p-2"
                rows={3}
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                className="px-3 py-2 border rounded hover:bg-gray-100 transition"
                onClick={() => setConfirmOpen(false)}
              >
                Cancelar
              </button>
              {confirmType === "aprobar" ? (
                <button
                  className="px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition"
                  onClick={() => mutateAprobacion("aprobar")}
                >
                  Aprobar
                </button>
              ) : (
                <button
                  className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
                  onClick={() => mutateAprobacion("rechazar")}
                >
                  Rechazar
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}