// 'use client'

// import { useEffect, useMemo, useState } from "react";
// import { useRouter } from "next/navigation";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
// import { Badge } from "@/components/ui/badge";
// import { Textarea } from "@/components/ui/textarea";
// import { Loader2, CheckCircle2, XCircle, Eye, RefreshCw } from "lucide-react";

// // Utilidades
// const ESTADOS = [
//   { value: "todos", label: "Todos" },
//   { value: "pendiente", label: "Pendiente" },
//   { value: "aprobado", label: "Aprobado" },
//   { value: "rechazado", label: "Rechazado" },
// ];

// function classNames(...cls) {
//   return cls.filter(Boolean).join(" ");
// }

// function fmtDate(iso) {
//   try {
//     const d = new Date(iso);
//     return d.toLocaleDateString();
//   } catch {
//     return "-";
//   }
// }

// function EstadoBadge({ estado }) {
//   const map = {
//     pendiente: "bg-yellow-100 text-yellow-800",
//     aprobado: "bg-green-100 text-green-800",
//     rechazado: "bg-red-100 text-red-800",
//   };
//   return (
//     <Badge className={classNames("capitalize", map[estado] || "bg-gray-100 text-gray-800")}>{estado}</Badge>
//   );
// }

// // Componente principal
// export default function VerAprobaciones() {
//   const router = useRouter();
//   const [data, setData] = useState([]);
//   const [total, setTotal] = useState(0);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");

//   // Filtros / búsqueda / paginación
//   const [estado, setEstado] = useState("pendiente");
//   const [q, setQ] = useState("");
//   const [page, setPage] = useState(1);
//   const [perPage, setPerPage] = useState(10);

//   const [confirmOpen, setConfirmOpen] = useState(false);
//   const [confirmType, setConfirmType] = useState(/** @type {"aprobar" | "rechazar" | null} */(null));
//   const [currentRow, setCurrentRow] = useState(null);
//   const [comentario, setComentario] = useState("");

//   // Debounce de búsqueda
//   const [qDebounced, setQDebounced] = useState("");
//   useEffect(() => {
//     const t = setTimeout(() => setQDebounced(q.trim()), 350);
//     return () => clearTimeout(t);
//   }, [q]);

//   const qp = useMemo(() => {
//     const p = new URLSearchParams();
//     if (estado && estado !== "todos") p.set("estado", estado);
//     if (qDebounced) p.set("q", qDebounced);
//     p.set("page", String(page));
//     p.set("perPage", String(perPage));
//     return p.toString();
//   }, [estado, qDebounced, page, perPage]);

//   // Carga de datos
//   async function fetchAprobaciones(signal) {
//     setLoading(true);
//     setError("");
//     try {
//       const res = await fetch(`/api/aprobaciones?${qp}`, { signal, headers: { "Content-Type": "application/json" } });
//       if (!res.ok) throw new Error(`Error ${res.status}`);
//       const json = await res.json();
//       setData(json.data || []);
//       setTotal(json.total || 0);
//     } catch (e) {
//       if (e.name !== "AbortError") setError(e.message || "Error al cargar");
//     } finally {
//       setLoading(false);
//     }
//   }

//   useEffect(() => {
//     const ctrl = new AbortController();
//     fetchAprobaciones(ctrl.signal);
//     return () => ctrl.abort();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [qp]);

//   const totalPages = Math.max(1, Math.ceil(total / perPage));

//   function openConfirm(type, row) {
//     setConfirmType(type);
//     setCurrentRow(row);
//     setComentario("");
//     setConfirmOpen(true);
//   }

//   async function mutateAprobacion(action) {
//     if (!currentRow) return;
//     const id = currentRow.id;
//     const body = { comentario };
//     // Optimistic UI
//     const prev = [...data];
//     setData((rows) => rows.map((r) => (r.id === id ? { ...r, estado: action === "aprobar" ? "aprobado" : "rechazado" } : r)));

//     try {
//       const res = await fetch(`/api/aprobaciones/${id}/${action}` /* aprobar | rechazar */, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(body),
//       });
//       if (!res.ok) throw new Error(`No se pudo ${action}`);
//     } catch (e) {
//       // revertir
//       setData(prev);
//       setError(e.message || `Error al ${action}`);
//     } finally {
//       setConfirmOpen(false);
//     }
//   }

//   function Row({ row }) {
//     return (
//       <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center p-3 rounded-xl border hover:shadow-sm transition">
//         <div className="md:col-span-3">
//           <div className="font-medium">{row?.visita?.cliente || row?.cliente || "-"}</div>
//           <div className="text-sm text-gray-500">{row?.visita?.contacto || row?.contacto || ""}</div>
//         </div>
//         <div className="md:col-span-2">
//           <div className="text-sm">{row?.visita?.ciudad || row?.ciudad || "-"}</div>
//           <div className="text-xs text-gray-500">{row?.visita?.pais || row?.pais || ""}</div>
//         </div>
//         <div className="md:col-span-3 text-sm">
//           <div>Ida: <span className="font-medium">{fmtDate(row?.visita?.fecha_ida || row?.fecha_ida)}</span></div>
//           <div>Regreso: <span className="font-medium">{fmtDate(row?.visita?.fecha_regreso || row?.fecha_regreso)}</span></div>
//         </div>
//         <div className="md:col-span-2 text-sm">
//           <div className="text-gray-500">Gerente</div>
//           <div className="font-medium">{row?.visita?.gerente?.name || row?.gerente?.name || "-"}</div>
//         </div>
//         <div className="md:col-span-1 flex md:justify-center">
//           <EstadoBadge estado={row?.estado || "pendiente"} />
//         </div>
//         <div className="md:col-span-1 flex gap-2 justify-end md:justify-center">
//           <Button variant="outline" size="icon" onClick={() => router.push(`/aprobaciones/${row.id}`)} title="Ver detalle">
//             <Eye className="w-4 h-4" />
//           </Button>
//           <Button variant="default" size="icon" onClick={() => openConfirm("aprobar", row)} title="Aprobar" disabled={(row?.estado||"")!=="pendiente"}>
//             <CheckCircle2 className="w-4 h-4" />
//           </Button>
//           <Button variant="destructive" size="icon" onClick={() => openConfirm("rechazar", row)} title="Rechazar" disabled={(row?.estado||"")!=="pendiente"}>
//             <XCircle className="w-4 h-4" />
//           </Button>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="p-4 sm:p-6 max-w-7xl mx-auto">
//       <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
//         <h1 className="text-2xl sm:text-3xl font-bold text-blue-800">Aprobaciones</h1>
//         <div className="flex items-center gap-2 w-full sm:w-auto">
//           <Button variant="outline" className="gap-2" onClick={() => fetchAprobaciones()}> <RefreshCw className="w-4 h-4"/> Refrescar</Button>
//           <Select value={estado} onValueChange={(v) => { setPage(1); setEstado(v); }}>
//             <SelectTrigger className="w-[160px]"><SelectValue placeholder="Estado" /></SelectTrigger>
//             <SelectContent>
//               {ESTADOS.map((e) => (<SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>))}
//             </SelectContent>
//           </Select>
//           <Input placeholder="Buscar cliente, ciudad, gerente..." value={q} onChange={(e) => { setPage(1); setQ(e.target.value); }} className="w-full sm:w-[320px]"/>
//         </div>
//       </div>

//       <Card className="shadow-sm">
//         <CardHeader className="pb-2">
//           <CardTitle className="text-base text-gray-700">Resultados</CardTitle>
//         </CardHeader>
//         <CardContent>
//           {error && (
//             <div className="mb-3 text-sm text-red-600">{error}</div>
//           )}

//           {loading ? (
//             <div className="flex items-center justify-center py-12 text-gray-500 gap-2">
//               <Loader2 className="w-5 h-5 animate-spin" /> Cargando aprobaciones...
//             </div>
//           ) : data.length === 0 ? (
//             <div className="py-12 text-center text-gray-500">No hay aprobaciones para mostrar.</div>
//           ) : (
//             <div className="flex flex-col gap-2">
//               {data.map((row) => (
//                 <Row key={row.id} row={row} />
//               ))}
//             </div>
//           )}

//           {/* Paginación */}
//           <div className="flex items-center justify-between mt-6">
//             <div className="text-sm text-gray-500">Página {page} de {totalPages} • {total} elementos</div>
//             <div className="flex items-center gap-2">
//               <Select value={String(perPage)} onValueChange={(v) => { setPage(1); setPerPage(Number(v)); }}>
//                 <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
//                 <SelectContent>
//                   {[10, 20, 50].map(n => (<SelectItem key={n} value={String(n)}>{n} / pág</SelectItem>))}
//                 </SelectContent>
//               </Select>
//               <div className="flex gap-2">
//                 <Button variant="outline" disabled={page<=1} onClick={() => setPage(p => Math.max(1, p-1))}>Anterior</Button>
//                 <Button variant="outline" disabled={page>=totalPages} onClick={() => setPage(p => Math.min(totalPages, p+1))}>Siguiente</Button>
//               </div>
//             </div>
//           </div>
//         </CardContent>
//       </Card>

//       {/* Dialogo de confirmación */}
//       <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
//         <DialogContent className="sm:max-w-md">
//           <DialogHeader>
//             <DialogTitle className="flex items-center gap-2">
//               {confirmType === "aprobar" ? (
//                 <><CheckCircle2 className="w-5 h-5"/> Confirmar aprobación</>
//               ) : (
//                 <><XCircle className="w-5 h-5"/> Confirmar rechazo</>
//               )}
//             </DialogTitle>
//             <DialogDescription>
//               {confirmType === "aprobar" ? "Esta acción aprobará la visita y notificará al solicitante." : "Esta acción rechazará la visita. Puedes agregar un motivo."}
//             </DialogDescription>
//           </DialogHeader>

//           <div className="space-y-2">
//             <div className="text-sm text-gray-600">
//               <span className="font-medium">Cliente:</span> {currentRow?.visita?.cliente || currentRow?.cliente || "-"}
//             </div>
//             <Textarea placeholder="Comentario (opcional)" value={comentario} onChange={(e) => setComentario(e.target.value)} />
//           </div>

//           <DialogFooter className="gap-2">
//             <Button variant="outline" onClick={() => setConfirmOpen(false)}>Cancelar</Button>
//             {confirmType === "aprobar" ? (
//               <Button onClick={() => mutateAprobacion("aprobar")} className="gap-2"><CheckCircle2 className="w-4 h-4"/> Aprobar</Button>
//             ) : (
//               <Button variant="destructive" onClick={() => mutateAprobacion("rechazar")} className="gap-2"><XCircle className="w-4 h-4"/> Rechazar</Button>
//             )}
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>
//     </div>
//   );
// }
