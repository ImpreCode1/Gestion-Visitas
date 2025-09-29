"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, CheckCircle2, XCircle, Eye, RefreshCw } from "lucide-react";

const ESTADOS = [
  { value: "todos", label: "Todos" },
  { value: "pendiente", label: "Pendiente" },
  { value: "aprobado", label: "Aprobado" },
  { value: "rechazado", label: "Rechazado" },
];

const mensajesPorRol = {
  vicepresidencia: {
    aprobar:
      "Esta acción aprobará la visita y notificará a Compras Internas y Suministros Internos para que continúen con el proceso de autorización.",
    rechazar:
      "Esta acción rechazará la visita y se notificará al solicitante por correo electrónico. Por favor agrega el motivo.",
  },
  transporte: {
    aprobar:
      "Con esta autorización confirmas que se iniciará el proceso de gestión de plataformas de transporte. ",
    rechazar:
      "Rechazarás la solicitud de plataformas de transporte y se notificará al solicitante.",
  },
  tiquetes: {
    aprobar:
      "Con esta autorización confirmas que se iniciará el proceso de gestión de tiquetes aéreos y compras internas.",
    rechazar:
      "Rechazarás la solicitud de tiquetes aéreos y compras internas, se notificará al solicitante.",
  },
  "notas-credito": {
    aprobar:
      "Esta aprobación confirma que los gastos de la visita serán cubiertos mediante nota crédito por la fábrica.",
    rechazar:
      "Se rechazará la solicitud de realizar la visita y se notificará al solicitante.",
  },
  default: {
    aprobar:
      "Esta acción aprobará la visita y continuará el flujo de autorización.",
    rechazar:
      "Esta acción rechazará la visita y se notificará al solicitante por correo electrónico.",
  },
};

// formatea fecha ISO
function fmtDate(iso) {
  try {
    const d = new Date(iso);
    return (
      d.toLocaleDateString() +
      " " +
      d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    );
  } catch {
    return "-";
  }
}

// badge para estado (acepta variantes "aprobada"/"aprobado")
function EstadoBadge({ estado }) {
  const key = (estado || "").toLowerCase();
  const map = {
    pendiente: "bg-yellow-100 text-yellow-800",
    aprobado: "bg-green-100 text-green-800",
    aprobada: "bg-green-100 text-green-800",
    rechazado: "bg-red-100 text-red-800",
  };
  return (
    <span
      className={`px-2 py-1 rounded text-sm capitalize ${
        map[key] || "bg-gray-100 text-gray-800"
      }`}
    >
      {estado || "-"}
    </span>
  );
}

export default function VerAprobaciones() {
  // --- state / lógica ---
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [estado, setEstado] = useState("pendiente");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmType, setConfirmType] = useState(null); // "aprobar" | "rechazar"
  const [currentRow, setCurrentRow] = useState(null);
  const [comentario, setComentario] = useState("");
  const [mutating, setMutating] = useState(false);

  const [detailOpen, setDetailOpen] = useState(false);

  // debounce búsqueda
  const [qDebounced, setQDebounced] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setQDebounced(q.trim()), 350);
    return () => clearTimeout(t);
  }, [q]);

  // query params
  const qp = useMemo(() => {
    const p = new URLSearchParams();
    if (estado && estado !== "todos") p.set("estado", estado);
    if (qDebounced) p.set("q", qDebounced);
    p.set("page", String(page));
    p.set("perPage", String(perPage));
    return p.toString();
  }, [estado, qDebounced, page, perPage]);

  async function fetchAprobaciones(signal) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/approvals?${qp}`, { signal });
      if (!res.ok) {
        if (res.status === 403) {
          throw new Error("No tienes permisos para aprobar visitas");
        }
        throw new Error(`Error ${res.status}`);
      }
      const json = await res.json();
      setData(json.rows || []);
      setTotal(json.total || 0);
    } catch (e) {
      if (e.name !== "AbortError") {
        console.error("fetchAprobaciones error:", e);
        setError(e.message || "Error al cargar");
      }
    } finally {
      setLoading(false);
    }
  }

  // carga inicial y cuando qp cambie
  useEffect(() => {
    const ctrl = new AbortController();
    fetchAprobaciones(ctrl.signal);
    return () => ctrl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qp]);

  const totalPages = Math.max(1, Math.ceil(total / perPage));

  function openConfirm(type, row) {
    setConfirmType(type);
    setCurrentRow(row);
    setComentario("");
    setConfirmOpen(true);
  }

  function closeConfirm() {
    setConfirmOpen(false);
    setComentario("");
    setCurrentRow(null);
    setConfirmType(null);
  }

  // muta la aprobación (aprobar/rechazar)
  async function mutateAprobacion(action) {
    if (!currentRow) return;
    const id = currentRow.id;
    const body = { comentario };
    const prev = [...data];
    // optimista
    setData((rows) =>
      rows.map((r) =>
        r.id === id
          ? { ...r, estado: action === "aprobar" ? "aprobado" : "rechazado" }
          : r
      )
    );
    setMutating(true);
    try {
      const res = await fetch(`/api/approvals/${id}/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(txt || `No se pudo ${action}`);
      }
      await fetchAprobaciones();
    } catch (e) {
      console.error("mutateAprobacion error:", e);
      setData(prev);
      setError(e.message || `Error al ${action}`);
    } finally {
      setMutating(false);
      closeConfirm();
    }
  }

  // --- Row (presentación responsive) ---
  function Row({ row }) {
    const cliente = row?.visita?.cliente || "-";
    const contacto = row?.visita?.contacto || "";
    const ciudad = row?.visita?.ciudad || "-";
    const pais = row?.visita?.pais || "";
    const fechaIda = row?.visita?.fecha_ida
      ? fmtDate(row.visita.fecha_ida)
      : "-";
    const fechaRegreso = row?.visita?.fecha_regreso
      ? fmtDate(row.visita.fecha_regreso)
      : "-";
    const gerente = row?.visita?.gerente?.name || "-";
    const estadoRow = row?.estado || "pendiente";
    const rol = row?.rol || "-";
    const fechaCreacion = row?.createdAt ? fmtDate(row.createdAt) : "-";
    const comentarioRow = row?.comentario || "-";
    const visitaEstado = row?.visita?.estado || "-";

    const getRolLegible = (rol) => {
      switch (rol) {
        case "transporte":
          return "Suministros internos";
        case "tiquetes":
          return "Compras internas";
        case "notas-credito":
          return "Notas-Crédito";
        case "vicepresidencia":
          return "Vicepresidencia";
        default:
          return rol; // fallback por si llega otro valor
      }
    };

    return (
      // tarjeta en móvil, fila en desktop (grid)
      <div className="bg-white md:bg-transparent md:px-6 md:py-3 border-b md:border-0">
        <div className="p-4 bg-white rounded-lg shadow-sm md:shadow-none md:border md:border-gray-100 md:rounded-none md:bg-transparent md:flex md:items-center">
          {/* Desktop grid */}
          <div className="w-full md:grid md:grid-cols-12 md:gap-4 md:items-center">
            {/* Cliente */}
            <div className="md:col-span-3 mb-3 md:mb-0">
              <div className="font-semibold text-lg text-gray-800 truncate">
                {cliente}
              </div>
              {contacto && (
                <div className="text-sm text-gray-500 truncate">{contacto}</div>
              )}
              <div className="text-xs text-gray-400 mt-1">
                {ciudad}
                {pais ? `, ${pais}` : ""}
              </div>
            </div>

            {/* Gerente */}
            <div className="md:col-span-2 text-sm mb-2 md:mb-0">
              <div className="text-gray-500">Gerente</div>
              <div className="font-medium text-gray-700 truncate">
                {gerente}
              </div>
            </div>

            {/* Rol */}
            <div className="md:col-span-2 text-sm mb-2 md:mb-0">
              <div className="text-gray-500">Rol</div>
              <div className="font-medium text-gray-700">{getRolLegible(rol)}</div>
            </div>

            {/* Fecha de creación */}
            <div className="md:col-span-2 text-sm mb-2 md:mb-0">
              <div className="text-gray-500">Creada</div>
              <div className="font-medium text-gray-700">{fechaCreacion}</div>
            </div>

            {/* Comentario */}
            <div className="md:col-span-2 text-sm mb-2 md:mb-0">
              <div className="text-gray-500">Comentario</div>
              <div className="font-medium text-gray-700 truncate max-w-[12rem]">
                {comentarioRow}
              </div>
            </div>

            {/* Estado */}
            <div className="md:col-span-1 flex flex-col items-start md:items-center mb-3 md:mb-0">
              <EstadoBadge estado={estadoRow} />
              <div className="text-xs text-gray-400 mt-2 md:mt-1">
                Visita:{" "}
                <span className="font-medium text-gray-600">
                  {visitaEstado}
                </span>
              </div>
            </div>

            {/* Acciones */}
            <div className="md:col-span-12 lg:col-span-0 flex gap-2 justify-end md:justify-center mt-3 md:mt-0">
              <button
                className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                title="Ver detalle"
                onClick={() => {
                  setCurrentRow(row);
                  setDetailOpen(true);
                }}
                aria-label="Ver detalle"
              >
                <Eye className="w-5 h-5 text-gray-600" />
              </button>
              <button
                className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                title="Aprobar"
                onClick={() => openConfirm("aprobar", row)}
                disabled={estadoRow !== "pendiente" || mutating}
                aria-label="Aprobar"
              >
                <CheckCircle2 className="w-5 h-5" />
              </button>
              <button
                className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50"
                title="Rechazar"
                onClick={() => openConfirm("rechazar", row)}
                disabled={estadoRow !== "pendiente" || mutating}
                aria-label="Rechazar"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- render principal ---
  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl sm:text-3xl font-bold text-blue-900 mb-6">
        Autorizaciones
      </h1>

      {error === "No tienes permisos para aprobar visitas" ? (
        <div className="p-6 bg-white border border-red-100 rounded-lg text-center text-red-600 font-semibold shadow-sm">
          {error}
        </div>
      ) : (
        <>
          {/* Filtros */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 w-full sm:w-auto">
              <button
                className="px-4 py-2 bg-white border rounded-lg flex items-center gap-2 shadow-sm hover:bg-gray-50 transition text-sm"
                onClick={() => fetchAprobaciones()}
                disabled={loading}
                aria-label="Refrescar"
              >
                <RefreshCw className="w-4 h-4" /> Refrescar
              </button>

              <select
                value={estado}
                onChange={(e) => {
                  setPage(1);
                  setEstado(e.target.value);
                }}
                className="px-3 py-2 border rounded-lg bg-white text-sm shadow-sm"
                aria-label="Filtrar estado"
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
                className="px-4 py-2 border rounded-lg w-full sm:w-[340px] text-sm shadow-sm"
                aria-label="Buscar"
              />
            </div>
          </div>

          {/* Contenido */}
          <div className="bg-white border rounded-xl shadow-md overflow-hidden">
            {error && (
              <div className="p-4 text-sm text-red-600 bg-red-50 border-b">
                {error}
              </div>
            )}

            {loading ? (
              <div className="flex items-center justify-center py-16 text-gray-500 gap-2">
                <Loader2 className="w-5 h-5 animate-spin" /> Cargando
                aprobaciones...
              </div>
            ) : data.length === 0 ? (
              <div className="py-16 text-center text-gray-500">
                No hay aprobaciones para mostrar.
              </div>
            ) : (
              <>
                {/* header tabla en desktop */}
                <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-gray-100 text-sm font-semibold text-gray-700 border-b">
                  <div className="col-span-3">Cliente</div>
                  <div className="col-span-2">Gerente</div>
                  <div className="col-span-2">Rol</div>
                  <div className="col-span-2">Creada</div>
                  <div className="col-span-2">Comentario</div>
                  <div className="col-span-1 text-center">Estado</div>
                </div>

                {/* filas/cards */}
                <div className="divide-y">
                  {data.map((row) => (
                    <Row key={row.id} row={row} />
                  ))}
                </div>
              </>
            )}

            {/* Paginación */}
            <div className="flex flex-col sm:flex-row items-center justify-between p-6 gap-4 border-t bg-gray-50">
              <div className="text-sm text-gray-600">
                Página <span className="font-medium">{page}</span> de{" "}
                <span className="font-medium">{totalPages}</span>
              </div>
              <div className="flex items-center gap-3">
                <select
                  value={perPage}
                  onChange={(e) => {
                    setPage(1);
                    setPerPage(Number(e.target.value));
                  }}
                  className="px-3 py-2 border rounded-lg bg-white shadow-sm"
                  aria-label="Filas por página"
                >
                  {[10, 20, 50].map((n) => (
                    <option key={n} value={n}>
                      {n} / pág
                    </option>
                  ))}
                </select>

                <div className="flex gap-2">
                  <button
                    className="px-3 py-2 border rounded-lg bg-white shadow-sm disabled:opacity-50 hover:bg-gray-100 transition"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Anterior
                  </button>
                  <button
                    className="px-3 py-2 border rounded-lg bg-white shadow-sm disabled:opacity-50 hover:bg-gray-100 transition"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Confirm modal */}
      {confirmOpen && currentRow && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
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
            <p className="text-sm text-gray-600 mb-6 leading-relaxed">
              {
                (mensajesPorRol[currentRow?.rol] || mensajesPorRol.default)[
                  confirmType
                ]
              }
            </p>

            <div className="mb-6">
              <label className="text-sm block mb-1 font-medium text-gray-700">
                Comentario (opcional)
              </label>
              <textarea
                className="w-full border rounded-lg p-3 text-sm focus:ring focus:ring-blue-200"
                rows={3}
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                className="px-4 py-2 border rounded-lg bg-white hover:bg-gray-100 transition"
                onClick={closeConfirm}
                disabled={mutating}
              >
                Cancelar
              </button>
              {confirmType === "aprobar" ? (
                <button
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                  onClick={() => mutateAprobacion("aprobar")}
                  disabled={mutating}
                >
                  {mutating ? "Procesando..." : "Aprobar"}
                </button>
              ) : (
                <button
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                  onClick={() => mutateAprobacion("rechazar")}
                  disabled={mutating}
                >
                  {mutating ? "Procesando..." : "Rechazar"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Detail modal */}
      {detailOpen && currentRow && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-xl font-semibold">Detalle de aprobación</h2>
              <button
                className="text-gray-500"
                onClick={() => setDetailOpen(false)}
              >
                Cerrar
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div>
                <span className="font-medium">Cliente:</span>{" "}
                {currentRow.visita?.cliente}
              </div>
              <div>
                <span className="font-medium">Gerente:</span>{" "}
                {currentRow.visita?.gerente?.name}
              </div>
              <div>
                <span className="font-medium">Ciudad / País:</span>{" "}
                {currentRow.visita?.ciudad}{" "}
                {currentRow.visita?.pais ? ` / ${currentRow.visita?.pais}` : ""}
              </div>
              <div>
                <span className="font-medium">Lugar:</span>{" "}
                {currentRow.visita?.lugar || "-"}
              </div>
              <div>
                <span className="font-medium">Fechas:</span>{" "}
                {currentRow.visita?.fecha_ida
                  ? fmtDate(currentRow.visita.fecha_ida)
                  : "-"}{" "}
                →{" "}
                {currentRow.visita?.fecha_regreso
                  ? fmtDate(currentRow.visita.fecha_regreso)
                  : "-"}
              </div>
              <div>
                <span className="font-medium">Estado visita:</span>{" "}
                <EstadoBadge estado={currentRow.visita?.estado} />
              </div>
              <div>
                <span className="font-medium">Requiere tiquetes aéreos:</span>{" "}
                {currentRow.visita?.requiereAvion ? "Sí" : "No"}
              </div>
              <div>
                <span className="font-medium">Fondos de fábrica:</span>{" "}
                {currentRow.visita?.fondos_fabrica ? "Sí" : "No"}
              </div>
              <div className="col-span-2">
                <span className="font-medium">Motivo:</span>{" "}
                {currentRow.visita?.motivo || "-"}
              </div>

              <div className="col-span-2 mt-2">
                <h3 className="font-semibold mb-2">
                  Aprobaciones relacionadas
                </h3>
                <div className="space-y-2">
                  {Array.isArray(currentRow.visita?.aprobaciones) &&
                  currentRow.visita.aprobaciones.length > 0 ? (
                    currentRow.visita.aprobaciones.map((a) => (
                      <div
                        key={a.id}
                        className="p-3 border rounded flex items-center justify-between"
                      >
                        <div>
                          <div className="font-medium">{a.rol}</div>
                          <div className="text-xs text-gray-500">
                            {a.comentario || "-"}
                          </div>
                        </div>
                        <div className="text-right">
                          <EstadoBadge estado={a.estado} />
                          <div className="text-xs text-gray-400 mt-1">
                            {a.updatedAt ? fmtDate(a.updatedAt) : ""}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-gray-500">
                      No hay aprobaciones relacionadas.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button
                className="px-3 py-2 border rounded hover:bg-gray-100"
                onClick={() => setDetailOpen(false)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
