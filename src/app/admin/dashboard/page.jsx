"use client";
import { useEffect, useState } from "react";
import { Card, CardContent } from "../../../../components/Card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";
import { DollarSign, Percent, TrendingUp, Calendar } from "lucide-react";

export default function Dashboard() {
  const [visitasMensuales, setVisitasMensuales] = useState([]);
  const [estadoVisitas, setEstadoVisitas] = useState([]);
  const [costos, setCostos] = useState({ total: 0, promedio: 0 });
  const [duracionPromedio, setDuracionPromedio] = useState({ promedio: 0 });
  const [legalizaciones, setLegalizaciones] = useState({ porcentaje: 0 });
  const [clientesTop, setClientesTop] = useState([]);

  useEffect(() => {
    fetch("/api/reports/visitas-mensuales")
      .then((r) => r.json())
      .then(setVisitasMensuales);

    fetch("/api/reports/estado-visitas")
      .then((r) => r.json())
      .then(setEstadoVisitas);

    fetch("/api/reports/costos-totales")
      .then((r) => r.json())
      .then(setCostos);

    fetch("/api/reports/duracion-promedio")
      .then((r) => r.json())
      .then(setDuracionPromedio);

    fetch("/api/reports/legalizaciones-tiempo")
      .then((r) => r.json())
      .then(setLegalizaciones);

    fetch("/api/reports/clientes-top")
      .then((r) => r.json())
      .then(setClientesTop);
  }, []);

  const KPI = ({ icon: Icon, title, description, value, color }) => (
    <Card className={`bg-gradient-to-br ${color} text-white shadow-xl`}>
      <CardContent className="p-6 flex flex-col gap-2 justify-between h-full">
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          <p className="text-sm opacity-80">{description}</p>
        </div>
        <div className="flex items-center justify-between mt-4">
          <p className="text-3xl font-bold">{value}</p>
          <Icon className="w-10 h-10 opacity-70" />
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="p-6 space-y-8">
      {/* KPIs principales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <KPI
          icon={DollarSign}
          title="Gasto Total"
          description="Suma de todos los gastos legalizados en el periodo."
          value={`$${costos.total.toFixed(2)}`}
          color="from-blue-600 to-blue-400"
        />
        <KPI
          icon={TrendingUp}
          title="Promedio por Visita"
          description="Costo promedio asociado a cada visita registrada."
          value={`$${costos.promedio.toFixed(2)}`}
          color="from-emerald-600 to-emerald-400"
        />
        <KPI
          icon={Percent}
          title="Legalizaciones a Tiempo"
          description="Porcentaje de facturas subidas en los 3 días posteriores al viaje."
          value={`${legalizaciones.porcentaje.toFixed(1)}%`}
          color="from-pink-600 to-pink-400"
        />
        <KPI
          icon={Calendar}
          title="Duración Promedio"
          description="Tiempo promedio de cada visita registrada."
          value={`${duracionPromedio.promedio.toFixed(1)} días`}
          color="from-purple-600 to-purple-400"
        />
      </div>

      {/* Gráficas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Visitas por mes */}
        <Card className="shadow-lg">
          <CardContent>
            <h2 className="text-xl font-bold">
              Visitas Programadas vs Completadas
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              Comparación mensual entre las visitas planeadas y las que se
              llevaron a cabo.
            </p>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={visitasMensuales}>
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip />
                <Bar
                  dataKey="programadas"
                  fill="#2563EB"
                  name="Programadas"
                  radius={[6, 6, 0, 0]}
                />
                <Bar
                  dataKey="completadas"
                  fill="#10B981"
                  name="Completadas"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Estado de visitas */}
        <Card className="shadow-lg">
          <CardContent>
            <h2 className="text-xl font-bold">Estado de Visitas</h2>
            <p className="text-sm text-gray-500 mb-4">
              Distribución de visitas según su estado actual.
            </p>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={estadoVisitas}
                  dataKey="value"
                  nameKey="estado"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  {estadoVisitas.map((entry, index) => {
                    let fill = "#9CA3AF"; // gris por defecto
                    if (entry.estado === "pendiente") fill = "#F59E0B"; // amarillo
                    if (entry.estado === "aprobada") fill = "#16A34A"; // verde
                    if (entry.estado === "rechazada") fill = "#DC2626"; // rojo
                    if (entry.estado === "completada") fill = "#2563EB"; // azul

                    return <Cell key={index} fill={fill} />;
                  })}
                </Pie>
                <Tooltip
                  formatter={(value, name) => [`${value}`, `Estado: ${name}`]}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Clientes top */}
        <Card className="shadow-lg">
          <CardContent className="flex flex-col h-full">
            <div className="mb-4">
              <h2 className="text-xl font-bold">Clientes más Visitados</h2>
              <p className="text-sm text-gray-500">
                Top 5 clientes con mayor número de visitas programadas.
              </p>
            </div>
            <div className="flex-1">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={clientesTop}
                  layout="vertical"
                  margin={{ top: 10, right: 20, left: 40, bottom: 10 }}
                >
                  <XAxis
                    type="number"
                    tickFormatter={(v) => v.toFixed(0)}
                    domain={[0, "dataMax + 2"]}
                  />
                  <YAxis
                    dataKey="cliente"
                    type="category"
                    width={100}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip formatter={(v) => `${v} visitas`} />
                  <Bar dataKey="visitas" fill="#EC4899" radius={[4, 4, 4, 4]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
