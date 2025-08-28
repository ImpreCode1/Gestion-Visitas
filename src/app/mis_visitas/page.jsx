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
  const [tab, setTab] = useState("calendario"); // 👈 controla vista activa

  useEffect(() => {
    // Detectar si es móvil
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
          estado: v.estado, // 👈 asegurarse de que la API lo devuelva
          cliente: v.cliente,
          motivo: v.motivo,
          ciudad: v.ciudad,
          pais: v.pais,
          personaVisita: v.personaVisita
        }));

        setVisitas(eventos);
      } catch (err) {
        console.error(err);
      }
    };

    fetchVisitas();
  }, []);

  // 🎨 Colores según estado
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

  // 🎨 Colores de eventos en el calendario
  const eventosConColor = visitas.map((v) => {
    let backgroundColor = "#9ca3af"; // gris por defecto
    if (v.estado === "pendiente") backgroundColor = "#facc15"; // amarillo
    if (v.estado === "aprobada") backgroundColor = "#22c55e"; // verde
    if (v.estado === "rechazada") backgroundColor = "#ef4444"; // rojo
    if (v.estado === "realizada") backgroundColor = "#3b82f6"; // azul

    return {
      ...v,
      backgroundColor,
      borderColor: backgroundColor,
    };
  });

  return (
    <div className="flex flex-col w-full h-full p-4">
      <h1 className="text-center text-xl md:text-2xl font-bold text-blue-800 mb-4">
        Mis Visitas
      </h1>

      {/* 🔹 Tabs */}
      <div className="flex justify-center space-x-4 mb-4">
        <button
          onClick={() => setTab("calendario")}
          className={`px-4 py-2 rounded-lg font-semibold transition ${
            tab === "calendario"
              ? "bg-blue-600 text-white shadow-md"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          Calendario
        </button>
        <button
          onClick={() => setTab("estado")}
          className={`px-4 py-2 rounded-lg font-semibold transition ${
            tab === "estado"
              ? "bg-blue-600 text-white shadow-md"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          Estado de Visitas
        </button>
      </div>

      {/* 🔹 Vista según el tab */}
      {tab === "calendario" ? (
        <div className="bg-white rounded-2xl shadow-md p-2 md:p-4">
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
                ? "dayGridMonth,listWeek"
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
          />
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-md p-4 overflow-x-auto">
          <table className="w-full text-sm md:text-base border-collapse">
            <thead>
              <tr className="text-left border-b bg-gray-50">
                <th className="p-2">Cliente</th>
                <th className="p-2">Motivo</th>
                <th className="p-2">Ciudad</th>
                <th className="p-2">País</th>
                <th className="p-2">Persona a Visitar</th>
                <th className="p-2">Fecha</th>
                <th className="p-2">Estado</th>
              </tr>
            </thead>
            <tbody>
              {visitas.map((v) => (
                <tr key={v.id} className="border-b hover:bg-gray-50">
                  <td className="p-2">{v.cliente}</td>
                  <td className="p-2">{v.motivo}</td>
                  <td className="p-2">{v.ciudad || "-"}</td>
                  <td className="p-2">{v.pais || "-"}</td>
                  <td className="p-2">{v.personaVisita || "-"}</td>
                  <td className="p-2">
                    {new Date(v.start).toLocaleDateString()} -{" "}
                    {new Date(v.end).toLocaleDateString()}
                  </td>
                  <td className="p-2">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${estadoColor(
                        v.estado
                      )}`}
                    >
                      {v.estado}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
