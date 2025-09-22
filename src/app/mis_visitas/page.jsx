"use client";

import { useState, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";

export default function MisVisitas() {
  const [visitas, setVisitas] = useState([]);
  const [isMobile, setIsMobile] = useState(false);
  const [tab, setTab] = useState("calendario");

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const fetchVisitas = async () => {
      try {
        const res = await fetch("/api/visites", { credentials: "include" });
        if (!res.ok) throw new Error("Error cargando visitas");

        const data = await res.json();

        const eventos = data.map((v) => ({
          id: v.id,
          title: `${v.cliente} - ${v.motivo}`,
          start: v.fecha_ida,
          end: v.fecha_regreso,
          estado: v.estado,
          cliente: v.cliente,
          motivo: v.motivo,
          ciudad: v.ciudad,
          pais: v.pais,
          personaVisita: v.personaVisita,
          aprobaciones: v.aprobaciones || [],
          facturas: v.facturas || null,
        }));

        setVisitas(eventos);
      } catch (err) {
        console.error(err);
      }
    };

    fetchVisitas();
  }, []);

  const estadoColor = (estado) => {
    switch (estado) {
      case "pendiente":
        return "bg-yellow-200 text-yellow-800";
      case "aprobada":
        return "bg-green-200 text-green-800";
      case "rechazada":
        return "bg-red-200 text-red-800";
      case "realizada":
        return "bg-blue-200 text-blue-800";
      default:
        return "bg-gray-200 text-gray-800";
    }
  };

  const eventosConColor = visitas.map((v) => {
    let backgroundColor = "#9ca3af";
    if (v.estado === "pendiente") backgroundColor = "#facc15";
    if (v.estado === "aprobada") backgroundColor = "#22c55e";
    if (v.estado === "rechazada") backgroundColor = "#ef4444";
    if (v.estado === "realizada") backgroundColor = "#3b82f6";

    return {
      ...v,
      backgroundColor,
      borderColor: backgroundColor,
    };
  });

  return (
    <div className="flex flex-col w-full h-full p-2 md:p-4">
      <h1 className="text-center text-lg md:text-2xl font-bold text-blue-800 mb-4">
        Mis Visitas
      </h1>

      {/* Tabs */}
      <div className="grid grid-cols-2 gap-2 mb-4 md:flex md:justify-center md:space-x-4">
        <button
          onClick={() => setTab("calendario")}
          className={`w-full px-3 py-2 rounded-lg font-semibold transition ${
            tab === "calendario"
              ? "bg-blue-600 text-white shadow-md"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          Calendario
        </button>
        <button
          onClick={() => setTab("estado")}
          className={`w-full px-3 py-2 rounded-lg font-semibold transition ${
            tab === "estado"
              ? "bg-blue-600 text-white shadow-md"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          Estado
        </button>
      </div>

      {/* Contenido */}
      {tab === "calendario" ? (
        <div className="bg-white rounded-xl shadow-md p-2 md:p-4">
          <FullCalendar
            plugins={[
              dayGridPlugin,
              interactionPlugin,
              timeGridPlugin,
              listPlugin,
            ]}
            initialView={isMobile ? "listWeek" : "dayGridMonth"}
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: isMobile
                ? "listWeek,dayGridMonth"
                : "dayGridMonth,timeGridWeek,listWeek",
            }}
            buttonText={{
              today: "Hoy",
              month: "Mes",
              week: "Semana",
              list: "Lista",
            }}
            events={eventosConColor}
            eventClick={(info) => {
              alert(
                `Visita: ${info.event.title}\nEstado: ${
                  visitas.find((v) => v.id === info.event.id)?.estado
                }`
              );
            }}
            height="auto"
            // 🔹 Mejoras visuales
            eventDisplay="block"
            dayMaxEventRows={3}
            views={{
              dayGridMonth: { dayMaxEventRows: 3 },
              timeGridWeek: { dayMaxEventRows: 3 },
              listWeek: {
                listDayFormat: {
                  weekday: "long",
                  day: "numeric",
                  month: "short",
                },
              },
            }}
            // 🔹 Clases Tailwind para que los botones se vean bonitos
            dayHeaderClassNames="bg-blue-50 text-blue-700 font-semibold text-xs md:text-sm"
            dayCellClassNames="hover:bg-blue-50 transition cursor-pointer"
            eventClassNames="rounded-md shadow-sm text-xs md:text-sm px-1 py-0.5"
            moreLinkClassNames="text-blue-600 hover:underline text-xs"
          />
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-md p-2 md:p-4">
          {/* Desktop → tabla enriquecida */}
          {!isMobile ? (
            <table className="w-full text-sm md:text-base border-collapse">
              <thead>
                <tr className="text-left border-b bg-gray-50">
                  <th className="p-2">Cliente</th>
                  <th className="p-2">Motivo</th>
                  <th className="p-2">Fechas</th>
                  <th className="p-2">Persona a Visitar</th>
                  <th className="p-2">Estado</th>
                  <th className="p-2">Aprobaciones</th>
                  <th className="p-2">Facturas</th>
                </tr>
              </thead>
              <tbody>
                {visitas.map((v) => (
                  <tr
                    key={v.id}
                    className="border-b hover:bg-gray-50 align-top"
                  >
                    <td className="p-2">{v.cliente}</td>
                    <td className="p-2">{v.motivo}</td>
                    <td className="p-2">
                      {new Date(v.start).toLocaleDateString()} -{" "}
                      {new Date(v.end).toLocaleDateString()}
                    </td>
                    <td className="p-2">{v.personaVisita || "-"}</td>
                    <td className="p-2">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${estadoColor(
                          v.estado
                        )}`}
                      >
                        {v.estado}
                      </span>
                    </td>
                    <td className="p-2">
                      {v.aprobaciones?.length ? (
                        <ul className="space-y-1">
                          {v.aprobaciones.map((ap) => (
                            <li key={ap.id}>
                              <b>{ap.rol}:</b>{" "}
                              <span className="font-medium">{ap.estado}</span>
                              {ap.comentario && (
                                <div className="text-xs text-gray-600 italic">
                                  "{ap.comentario}"
                                </div>
                              )}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-gray-500">Sin aprobaciones</span>
                      )}
                    </td>
                    <td className="p-2">
                      {v.facturas ? (
                        <div>
                          <p className="font-medium">
                            ${v.facturas.montoTotal?.toFixed(2)}
                          </p>
                          <ul className="text-xs text-blue-600">
                            {v.facturas.archivos.map((f) => (
                              <li key={f.id}>
                                <a
                                  href={f.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="hover:underline"
                                >
                                  {f.nombre}
                                </a>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : (
                        <span className="text-gray-500">Sin facturas</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            /* Mobile → Cards más completas */
            <div className="space-y-3">
              {visitas.map((v) => (
                <div
                  key={v.id}
                  className="p-3 border rounded-lg shadow-sm bg-gray-50"
                >
                  <div className="flex justify-between items-center">
                    <p className="font-semibold text-blue-700">{v.cliente}</p>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${estadoColor(
                        v.estado
                      )}`}
                    >
                      {v.estado}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{v.motivo}</p>
                  <p className="text-sm">
                    {new Date(v.start).toLocaleDateString()} -{" "}
                    {new Date(v.end).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-gray-700">
                    Persona: {v.personaVisita || "-"}
                  </p>

                  {/* Aprobaciones */}
                  <div className="mt-2">
                    <h4 className="text-xs font-bold text-gray-600">
                      Aprobaciones:
                    </h4>
                    {v.aprobaciones?.length ? (
                      <ul className="text-xs space-y-1">
                        {v.aprobaciones.map((ap) => (
                          <li key={ap.id}>
                            <b>{ap.rol}:</b> {ap.estado}
                            {ap.comentario && (
                              <div className="italic text-gray-500">
                                "{ap.comentario}"
                              </div>
                            )}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-xs text-gray-500">
                        Sin aprobaciones
                      </span>
                    )}
                  </div>

                  {/* Facturas */}
                  <div className="mt-2">
                    <h4 className="text-xs font-bold text-gray-600">
                      Facturas:
                    </h4>
                    {v.facturas ? (
                      <div>
                        <p className="text-xs font-medium">
                          Total: ${v.facturas.montoTotal?.toFixed(2)}
                        </p>
                        <ul className="text-xs list-disc ml-4 text-blue-600">
                          {v.facturas.archivos.map((f) => (
                            <li key={f.id}>
                              <a
                                href={f.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:underline"
                              >
                                {f.nombre}
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-500">
                        Sin facturas
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
