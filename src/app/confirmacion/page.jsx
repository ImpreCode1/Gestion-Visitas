"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function ConfirmacionPage() {
  const [estado, setEstado] = useState("cargando");
  const [comentario, setComentario] = useState("");
  const [token, setToken] = useState(null);
  const [id, setId] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const url = new URL(window.location.href);
    const e = url.searchParams.get("estado");
    const t = url.searchParams.get("token");
    const i = url.searchParams.get("id");

    console.log("🔍 Parámetros URL:", { estado: e, token: t?.substring(0, 20), id: i });

    // 👉 Prioridad: si hay "estado" explícito en la URL, lo usamos directamente
    if (e) {
      console.log("✅ Estado explícito encontrado:", e);
      setEstado(e);
      return;
    }

    // 👉 Si no hay "estado" pero hay token + id, es formulario
    if (t && i) {
      console.log("📝 Mostrando formulario para ID:", i);
      setToken(t);
      setId(i);
      setEstado("formulario");
    } else {
      console.log("❌ Parámetros faltantes, mostrando error");
      setEstado("error");
    }
  }, []); // 👈 IMPORTANTE: array vacío para que solo se ejecute UNA VEZ

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    console.log("📤 Enviando aprobación para ID:", id);

    try {
      const res = await fetch(`/api/approvals/${id}/aprobar?token=${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comentario }),
      });

      console.log("📥 Respuesta del servidor:", res.status);

      if (res.ok) {
        console.log("✅ Aprobación exitosa");
        setEstado("exito");
      } else {
        console.error("❌ Error en la aprobación");
        setEstado("error");
      }
    } catch (error) {
      console.error("💥 Error de red:", error);
      setEstado("error");
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================
  // COMPONENTE CARD REUTILIZABLE
  // ==========================================================
  const Card = ({ icon, title, message, color = "text-gray-700" }) => (
    <div className="flex flex-col justify-center items-center h-screen text-center bg-gray-50 px-4">
      <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-200 max-w-md">
        <h2 className={`text-2xl font-bold mb-4 ${color}`}>
          {icon} {title}
        </h2>
        <p className="text-gray-700 mb-4">{message}</p>
        <p className="text-sm text-gray-500">
          Puedes cerrar esta ventana con seguridad.
        </p>
      </div>
    </div>
  );

  // ==========================================================
  // ESTADOS VISUALES
  // ==========================================================
  if (estado === "cargando") {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
        <p className="ml-2 text-gray-600">Cargando información...</p>
      </div>
    );
  }

  if (estado === "aprobado" || estado === "exito") {
    return (
      <Card
        icon="✅"
        title="¡Aprobación registrada con éxito!"
        message="Tu observación fue enviada y la visita ha sido aprobada correctamente."
        color="text-green-600"
      />
    );
  }

  if (estado === "usado") {
    return (
      <Card
        icon="⚠️"
        title="Este enlace ya fue utilizado"
        message="La aprobación ya fue registrada anteriormente. No es necesario realizar ninguna acción adicional."
        color="text-amber-600"
      />
    );
  }

  if (estado === "expirado") {
    return (
      <Card
        icon="⏰"
        title="Enlace expirado"
        message="Este enlace ha expirado (válido por 7 días). Solicita una nueva aprobación al sistema."
        color="text-orange-600"
      />
    );
  }

  if (estado === "error") {
    return (
      <Card
        icon="❌"
        title="Error en la aprobación"
        message="Ocurrió un problema al procesar la aprobación o el enlace no es válido."
        color="text-red-600"
      />
    );
  }

  // ==========================================================
  // FORMULARIO
  // ==========================================================
  console.log("📋 Renderizando formulario");
  
  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50 px-4">
      <div className="max-w-lg w-full bg-white p-8 rounded-2xl shadow-lg border border-gray-200">
        <h2 className="text-xl font-bold text-blue-700 mb-3">
          📝 Confirmación de Aprobación
        </h2>
        <p className="text-gray-600 mb-6">
          Antes de confirmar, por favor deja tu observación o comentario sobre
          esta solicitud.
        </p>

        <form onSubmit={handleSubmit}>
          <textarea
            required
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            placeholder="Escribe tu observación..."
            rows={5}
            className="w-full p-3 border rounded-lg text-sm mb-5 focus:ring-2 focus:ring-blue-400 focus:outline-none resize-none"
          />

          <button
            type="submit"
            disabled={loading}
            className={`w-full flex justify-center items-center gap-2 py-2.5 rounded-lg font-semibold text-white transition-all duration-150 ${
              loading
                ? "bg-blue-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? "Enviando..." : "Confirmar aprobación"}
          </button>
        </form>

        {/* DEBUG INFO */}
        <div className="mt-4 p-3 bg-gray-100 rounded text-xs text-gray-600">
          <strong>Debug Info:</strong>
          <br />
          Estado: {estado}
          <br />
          ID: {id}
          <br />
          Token: {token ? "Presente ✅" : "Ausente ❌"}
        </div>
      </div>
    </div>
  );
}