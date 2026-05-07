import { useState } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useMetrics } from "../hooks/useMetrics";
import { useAuthStore } from "../store/authStore";
import { formatCurrency } from "../lib/currency";
import type { Currency } from "../lib/currency";

function fmt(month: string) {
  return new Date(month).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

function defaultFrom() {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 1);
  d.setDate(1);
  return d.toISOString().slice(0, 10);
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function ChartCard({
  title,
  children,
  isEmpty,
}: {
  title: string;
  children: React.ReactNode;
  isEmpty: boolean;
}) {
  return (
    <div className="rounded-xl bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-base font-semibold text-gray-800">{title}</h2>
      {isEmpty ? (
        <p className="py-8 text-center text-sm text-gray-400">
          No data for this period.
        </p>
      ) : (
        children
      )}
    </div>
  );
}

export default function MetricsPage() {
  const trainer = useAuthStore((s) => s.trainer);
  const [from, setFrom] = useState(defaultFrom);
  const [to, setTo] = useState(today);

  const { data, isPending } = useMetrics(from, to);
  const currency = (trainer?.currency ?? "USD") as Currency;
  const fmtAmount = (v: number | undefined) => formatCurrency(v ?? 0, currency);

  const minDate = trainer?.createdAt
    ? trainer.createdAt.slice(0, 10)
    : undefined;

  const revenueData = (data?.revenueByMonth ?? []).map((r) => ({
    ...r,
    label: fmt(r.month),
  }));
  const clientsData = (data?.clientsByMonth ?? []).map((r) => ({
    ...r,
    label: fmt(r.month),
  }));
  const sessionsData = (data?.sessionsByMonth ?? []).map((r) => ({
    ...r,
    label: fmt(r.month),
  }));
  const avgData = (data?.avgSessionsPerClientByMonth ?? []).map((r) => ({
    ...r,
    label: fmt(r.month),
  }));
  const topClients = data?.topClientsByRevenue ?? [];

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Metrics</h1>

        {/* Date range picker */}
        <div className="flex items-center gap-2 text-sm">
          <label className="text-gray-500">From</label>
          <input
            type="date"
            value={from}
            min={minDate}
            max={to}
            onChange={(e) => setFrom(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-1.5 focus:border-indigo-500 focus:outline-none"
          />
          <label className="text-gray-500">To</label>
          <input
            type="date"
            value={to}
            min={from}
            max={today()}
            onChange={(e) => setTo(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-1.5 focus:border-indigo-500 focus:outline-none"
          />
        </div>
      </div>

      {isPending ? (
        <div className="grid gap-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-64 animate-pulse rounded-xl bg-white shadow-sm"
            />
          ))}
        </div>
      ) : (
        <div className="grid gap-6">
          {/* Revenue by month */}
          <ChartCard
            title="Revenue by Month"
            isEmpty={revenueData.length === 0}
          >
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis
                  tick={{ fontSize: 12 }}
                  tickFormatter={(v) => fmtAmount(v)}
                />
                <Tooltip formatter={(v) => [fmtAmount(Number(v)), "Revenue"]} />
                <Bar dataKey="revenue" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* New clients per month */}
          <ChartCard
            title="New Clients per Month"
            isEmpty={clientsData.length === 0}
          >
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={clientsData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip formatter={(v) => [Number(v), "New clients"]} />
                <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Session volume */}
          <ChartCard
            title="Session Volume by Month"
            isEmpty={sessionsData.length === 0}
          >
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={sessionsData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="completed"
                  name="Completed"
                  stackId="a"
                  fill="#6366f1"
                  radius={[0, 0, 0, 0]}
                />
                <Bar
                  dataKey="cancelled"
                  name="Cancelled"
                  stackId="a"
                  fill="#f87171"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Avg sessions per client */}
          <ChartCard
            title="Avg Completed Sessions per Client per Month"
            isEmpty={avgData.length === 0}
          >
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={avgData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip formatter={(v) => [Number(v), "Avg sessions"]} />
                <Line
                  type="monotone"
                  dataKey="avg"
                  name="Avg sessions"
                  stroke="#6366f1"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Top clients by revenue */}
          <ChartCard
            title="Top Clients by Revenue (Lifetime)"
            isEmpty={topClients.length === 0}
          >
            <ResponsiveContainer width="100%" height={Math.max(200, topClients.length * 44)}>
              <BarChart data={topClients} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(v) => fmtAmount(Number(v))}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 12 }}
                  width={120}
                />
                <Tooltip formatter={(v) => [fmtAmount(Number(v)), "Revenue"]} />
                <Bar dataKey="revenue" fill="#6366f1" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      )}
    </div>
  );
}
