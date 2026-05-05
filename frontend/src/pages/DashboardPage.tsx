import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Calendar, dateFnsLocalizer, type View } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { enUS } from "date-fns/locale/en-US";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { NewSessionModal } from "../components/NewSessionModal";
import { EditSessionModal } from "../components/EditSessionModal";
import { useClients, useCreateClient } from "../hooks/useClients";
import { useWorkoutPlans } from "../hooks/useWorkoutPlans";
import { useSessions, useDeleteSession } from "../hooks/useSessions";
import { useExpiringPayments } from "../hooks/usePayments";
import { useStaleClients } from "../hooks/useStaleClients";
import { useAuthStore } from "../store/authStore";
import type { Session } from "../types/api";

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales: { "en-US": enUS },
});

interface SlotInfo {
  start: Date;
  end: Date;
}

const BILLING_LABELS: Record<string, string> = {
  per_session: "Per session",
  monthly: "Monthly",
  half_yearly: "Half-yearly",
  yearly: "Yearly",
};

function StatCard({
  label,
  value,
  to,
}: {
  label: string;
  value: number | string;
  to: string;
}) {
  return (
    <Link
      to={to}
      className="rounded-xl bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
    >
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-1 text-3xl font-bold text-gray-900">{value}</p>
    </Link>
  );
}

function NewClientModal({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const createClient = useCreateClient();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const client = await createClient.mutateAsync({
      name,
      email: email || undefined,
    });
    onClose();
    navigate(`/clients/${client.id}`);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">New client</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="mb-1 block text-xs text-gray-500">Name *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-500">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Optional"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={createClient.isPending}
              className="flex-1 rounded-lg bg-indigo-600 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {createClient.isPending ? "Creating…" : "Create client"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const trainer = useAuthStore((s) => s.trainer);
  const { data: clients } = useClients();
  const { data: plans } = useWorkoutPlans();
  const { data: expiringPayments } = useExpiringPayments();
  const { data: staleClients } = useStaleClients();
  const { data: sessions } = useSessions();
  const deleteSession = useDeleteSession();

  const [showNewClient, setShowNewClient] = useState(false);
  const [showNewSession, setShowNewSession] = useState(false);
  const [calDate, setCalDate] = useState(new Date());
  const [calView, setCalView] = useState<View>("day");
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [pendingScheduledAt, setPendingScheduledAt] = useState("");
  const [pendingStartDate, setPendingStartDate] = useState("");

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const { data: todaySessions } = useSessions({
    from: todayStart.toISOString(),
    to: todayEnd.toISOString(),
    status: "scheduled",
  });

  function openModal(slot?: SlotInfo) {
    const base = new Date(slot?.start ?? new Date());
    const localDatetime = `${base.getFullYear()}-${String(base.getMonth() + 1).padStart(2, "0")}-${String(base.getDate()).padStart(2, "0")}T${String(base.getHours()).padStart(2, "0")}:${String(base.getMinutes()).padStart(2, "0")}`;
    setPendingScheduledAt(localDatetime);
    setPendingStartDate(localDatetime.slice(0, 10));
    setShowNewSession(true);
  }

  const events = sessions?.map((s) => ({
    id: s.id,
    title: s.title,
    start: new Date(s.scheduledAt),
    end: new Date(
      new Date(s.scheduledAt).getTime() + s.durationMinutes * 60000,
    ),
    resource: s,
  }));

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back{trainer?.displayName ? `, ${trainer.displayName}` : ""}
        </h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowNewClient(true)}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            + New client
          </button>
          <button
            onClick={() => openModal()}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            + New session
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Clients"
          value={clients?.length ?? "—"}
          to="/clients"
        />
        <StatCard
          label="Workout Plans"
          value={plans?.length ?? "—"}
          to="/workout-plans"
        />
        <StatCard
          label="Sessions Today"
          value={todaySessions?.length ?? "—"}
          to="/sessions"
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        {/* Calendar — takes 2 cols */}
        <div className="lg:col-span-2">
          <h2 className="mb-3 text-lg font-semibold text-gray-800">Schedule</h2>
          <div
            className="rounded-xl bg-white p-4 shadow-sm"
            style={{ height: 600 }}
          >
            <Calendar
              localizer={localizer}
              events={events ?? []}
              startAccessor="start"
              endAccessor="end"
              selectable
              date={calDate}
              view={calView}
              defaultView="day"
              onNavigate={setCalDate}
              onView={setCalView}
              onSelectSlot={openModal}
              onSelectEvent={(event) =>
                setEditingSession(event.resource as Session)
              }
              style={{ height: "100%" }}
            />
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Today's sessions detail */}
          <div>
            <h2 className="mb-3 text-lg font-semibold text-gray-800">
              Today's sessions
            </h2>
            {!todaySessions || todaySessions.length === 0 ? (
              <p className="text-sm text-gray-400">
                No sessions scheduled for today.
              </p>
            ) : (
              <div className="space-y-2">
                {todaySessions.map((s) => {
                  const time = new Date(s.scheduledAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  });
                  const participants =
                    s.groupName ??
                    (s.clientNames.length > 0
                      ? s.clientNames.join(", ")
                      : "No clients assigned");
                  return (
                    <div
                      key={s.id}
                      className="flex items-center gap-3 rounded-xl bg-white p-4 shadow-sm"
                    >
                      <div className="flex w-14 flex-col items-center rounded-lg bg-indigo-50 px-2 py-2 text-indigo-700">
                        <span className="text-lg font-bold leading-none">
                          {time.split(":")[0]}
                        </span>
                        <span className="text-xs">:{time.split(":")[1]}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900">{s.title}</p>
                        <p className="mt-0.5 truncate text-sm text-gray-500">
                          {participants}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600">
                        {s.durationMinutes} min
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Clients needing attention */}
          <div>
            <h2 className="mb-3 text-lg font-semibold text-gray-800">
              Clients needing attention
            </h2>
            {!staleClients || staleClients.length === 0 ? (
              <p className="text-sm text-gray-400">All clients are active 🎉</p>
            ) : (
              <div className="space-y-2">
                {staleClients.map((c) => (
                  <Link
                    key={c.id}
                    to={`/clients/${c.id}`}
                    className="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-amber-500">⚠</span>
                      <p className="font-medium text-gray-900 truncate">
                        {c.name}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                      {c.daysSinceLastSession == null
                        ? "Never"
                        : `${c.daysSinceLastSession}d ago`}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Expiring payments */}
          <div>
            <h2 className="mb-3 text-lg font-semibold text-gray-800">
              Payments expiring this week
            </h2>
            {!expiringPayments || expiringPayments.length === 0 ? (
              <p className="text-sm text-gray-400">
                No payments expiring this week.
              </p>
            ) : (
              <div className="space-y-2">
                {expiringPayments.map((p) => (
                  <Link
                    key={p.id}
                    to={`/clients/${p.clientId}`}
                    className="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div>
                      <p className="font-medium text-gray-900">
                        {p.clientName}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Expires{" "}
                        {new Date(p.periodEnd).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                    <span className="rounded-full bg-yellow-50 px-2 py-0.5 text-xs font-medium text-yellow-700">
                      {BILLING_LABELS[p.billingType] ?? p.billingType}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {editingSession && (
        <EditSessionModal
          session={editingSession}
          onClose={() => setEditingSession(null)}
          onDelete={() => {
            deleteSession.mutate(editingSession.id);
            setEditingSession(null);
          }}
        />
      )}

      {showNewClient && (
        <NewClientModal onClose={() => setShowNewClient(false)} />
      )}
      <NewSessionModal
        open={showNewSession}
        onClose={() => setShowNewSession(false)}
        initialScheduledAt={pendingScheduledAt}
        initialStartDate={pendingStartDate}
      />
    </div>
  );
}
