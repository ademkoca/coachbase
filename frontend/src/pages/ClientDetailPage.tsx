import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "axios";
import { useClient, useUpdateClient } from "../hooks/useClients";
import { useSessions } from "../hooks/useSessions";
import {
  usePayments,
  useCreatePayment,
  useDeletePayment,
} from "../hooks/usePayments";
import { useClientLogs, useClientPRs } from "../hooks/useWorkoutLogs";
import { useWorkoutPlans } from "../hooks/useWorkoutPlans";
import { useAuthStore } from "../store/authStore";
import { auth } from "../firebase";
import type { BillingType } from "../types/api";

const BILLING_LABELS: Record<BillingType, string> = {
  per_session: "Per session",
  monthly: "Monthly",
  half_yearly: "Half-yearly",
  yearly: "Yearly",
};

function PaymentsPanel({ clientId }: { clientId: string }) {
  const trainer = useAuthStore((s) => s.trainer);
  const { data: payments } = usePayments(clientId);
  const createPayment = useCreatePayment(clientId);
  const deletePayment = useDeletePayment(clientId);

  const [showForm, setShowForm] = useState(false);
  const [billingType, setBillingType] = useState<BillingType>("monthly");
  const [amount, setAmount] = useState("");
  const [sessionsIncluded, setSessionsIncluded] = useState("");
  const [periodStart, setPeriodStart] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [status, setStatus] = useState<"paid" | "pending">("paid");
  const [notes, setNotes] = useState("");

  const defaultFee: Record<BillingType, string> = {
    per_session: trainer?.feePerSession ?? "",
    monthly: trainer?.feeMonthly ?? "",
    half_yearly: trainer?.feeHalfYearly ?? "",
    yearly: trainer?.feeYearly ?? "",
  };

  function handleBillingTypeChange(type: BillingType) {
    setBillingType(type);
    setAmount(defaultFee[type]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await createPayment.mutateAsync({
      billingType,
      amount,
      sessionsIncluded:
        billingType === "per_session" && sessionsIncluded
          ? Number(sessionsIncluded)
          : undefined,
      periodStart,
      status,
      notes: notes || undefined,
    });
    setShowForm(false);
    setAmount("");
    setSessionsIncluded("");
    setNotes("");
    setBillingType("monthly");
    setStatus("paid");
    setPeriodStart(new Date().toISOString().slice(0, 10));
  }

  return (
    <div className="rounded-xl bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-semibold text-gray-800">Payments</h2>
        <button
          onClick={() => {
            setShowForm(true);
            if (!amount) setAmount(defaultFee[billingType]);
          }}
          className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700"
        >
          + Add payment
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-4 space-y-3 rounded-lg border border-gray-200 p-4"
        >
          <div>
            <label className="mb-1 block text-xs text-gray-500">
              Billing type
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {(Object.keys(BILLING_LABELS) as BillingType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => handleBillingTypeChange(t)}
                  className={`rounded-lg border py-1.5 text-xs font-medium transition-colors ${
                    billingType === t
                      ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                      : "border-gray-200 text-gray-600"
                  }`}
                >
                  {BILLING_LABELS[t]}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="mb-1 block text-xs text-gray-500">Amount</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                placeholder="0.00"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-indigo-500 focus:outline-none"
              />
            </div>
            {billingType === "per_session" && (
              <div className="w-32">
                <label className="mb-1 block text-xs text-gray-500">
                  Sessions included
                </label>
                <input
                  type="number"
                  min="1"
                  value={sessionsIncluded}
                  onChange={(e) => setSessionsIncluded(e.target.value)}
                  placeholder="e.g. 10"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-indigo-500 focus:outline-none"
                />
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="mb-1 block text-xs text-gray-500">
                Period start
              </label>
              <input
                type="date"
                value={periodStart}
                onChange={(e) => setPeriodStart(e.target.value)}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-xs text-gray-500">Status</label>
              <select
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value as "paid" | "pending")
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              >
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs text-gray-500">Notes</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={createPayment.isPending}
              className="rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {createPayment.isPending ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-lg border border-gray-200 px-4 py-1.5 text-xs hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {!payments || payments.length === 0 ? (
        <p className="text-sm text-gray-400">No payment records yet.</p>
      ) : (
        <ul className="space-y-2">
          {payments.map((p) => (
            <li
              key={p.id}
              className="flex items-start justify-between gap-3 rounded-lg border border-gray-100 p-3 text-sm"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">${p.amount}</span>
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                    {BILLING_LABELS[p.billingType as BillingType]}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${p.status === "paid" ? "bg-green-50 text-green-700" : "bg-yellow-50 text-yellow-700"}`}
                  >
                    {p.status}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-gray-400">
                  {p.periodStart} → {p.periodEnd}
                  {p.sessionsIncluded
                    ? ` · ${p.sessionsIncluded} sessions`
                    : ""}
                </p>
                {p.notes && (
                  <p className="mt-0.5 truncate text-xs text-gray-400">
                    {p.notes}
                  </p>
                )}
              </div>
              <button
                onClick={() => {
                  if (confirm("Delete payment record?"))
                    deletePayment.mutate(p.id);
                }}
                className="shrink-0 text-xs text-red-400 hover:text-red-600"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: client, isPending } = useClient(id!);
  const { data: sessions } = useSessions({ clientId: id });
  const { data: prs } = useClientPRs(id);
  const { data: logs } = useClientLogs(id);
  const { data: plans } = useWorkoutPlans();
  const updateClient = useUpdateClient();
  const [exportPlanId, setExportPlanId] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileName, setProfileName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [profilePhone, setProfilePhone] = useState("");
  const [profileNotes, setProfileNotes] = useState("");
  const [profileGender, setProfileGender] = useState("");
  const [profileGoal, setProfileGoal] = useState("");
  const [profileInjuryNotes, setProfileInjuryNotes] = useState("");

  function startEditProfile() {
    setProfileName(client?.name ?? "");
    setProfileEmail(client?.email ?? "");
    setProfilePhone(client?.phone ?? "");
    setProfileNotes(client?.notes ?? "");
    setProfileGender(client?.gender ?? "");
    setProfileGoal(client?.goal ?? "");
    setProfileInjuryNotes(client?.injuryNotes ?? "");
    setEditingProfile(true);
  }

  async function saveProfile() {
    if (!client) return;
    await updateClient.mutateAsync({
      id: client.id,
      name: profileName || client.name,
      email: profileEmail || undefined,
      phone: profilePhone || undefined,
      notes: profileNotes || undefined,
      gender: profileGender || undefined,
      goal: profileGoal || undefined,
      injuryNotes: profileInjuryNotes || undefined,
    });
    setEditingProfile(false);
  }

  async function handleExportPdf() {
    if (!exportPlanId || !client) return;
    setIsExporting(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await axios.get(
        `/api/workout-plans/${exportPlanId}/export?clientId=${client.id}`,
        { headers: { Authorization: `Bearer ${token}` }, responseType: "blob" },
      );
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${client.name}_workout_plan.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsExporting(false);
    }
  }

  if (isPending) return <p className="text-gray-500">Loading...</p>;
  if (!client) return <p className="text-gray-500">Client not found.</p>;

  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <Link
          to="/clients"
          className="text-sm text-gray-400 hover:text-gray-600"
        >
          ← Clients
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">{client.name}</h1>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-gray-800">Profile</h2>
            {!editingProfile && (
              <button
                onClick={startEditProfile}
                className="text-xs text-indigo-600 hover:underline"
              >
                Edit
              </button>
            )}
          </div>

          {editingProfile ? (
            <div className="space-y-3 text-sm">
              {[
                {
                  label: "Name",
                  value: profileName,
                  setter: setProfileName,
                  type: "text",
                },
                {
                  label: "Email",
                  value: profileEmail,
                  setter: setProfileEmail,
                  type: "email",
                },
                {
                  label: "Phone",
                  value: profilePhone,
                  setter: setProfilePhone,
                  type: "tel",
                },
              ].map(({ label, value, setter, type }) => (
                <div key={label}>
                  <label className="mb-0.5 block text-xs text-gray-500">
                    {label}
                  </label>
                  <input
                    type={type}
                    value={value}
                    onChange={(e) => setter(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-base focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              ))}
              <div>
                <label className="mb-0.5 block text-xs text-gray-500">
                  Gender
                </label>
                <select
                  value={profileGender}
                  onChange={(e) => setProfileGender(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
                >
                  <option value="">— not specified —</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="mb-0.5 block text-xs text-gray-500">
                  Goal
                </label>
                <input
                  type="text"
                  value={profileGoal}
                  onChange={(e) => setProfileGoal(e.target.value)}
                  placeholder="e.g. lose weight, build muscle"
                  className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-base focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-0.5 block text-xs text-gray-500">
                  Notes
                </label>
                <textarea
                  value={profileNotes}
                  onChange={(e) => setProfileNotes(e.target.value)}
                  rows={2}
                  className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-base focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-0.5 block text-xs text-amber-700">
                  Injury notes
                </label>
                <textarea
                  value={profileInjuryNotes}
                  onChange={(e) => setProfileInjuryNotes(e.target.value)}
                  rows={2}
                  placeholder="Any injuries or physical limitations the trainer should know about"
                  className="w-full rounded-lg border border-amber-200 px-3 py-1.5 text-base focus:border-amber-400 focus:outline-none bg-amber-50"
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={saveProfile}
                  disabled={updateClient.isPending}
                  className="rounded-lg bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
                >
                  {updateClient.isPending ? "Saving..." : "Save"}
                </button>
                <button
                  onClick={() => setEditingProfile(false)}
                  className="rounded-lg border border-gray-300 px-4 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              {client.injuryNotes && (
                <div className="mb-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                  <span>⚠️</span>
                  <span>
                    <strong>Injury notes:</strong> {client.injuryNotes}
                  </span>
                </div>
              )}
              <dl className="space-y-2 text-sm">
                {[
                  { label: "Email", value: client.email },
                  { label: "Phone", value: client.phone },
                  {
                    label: "Gender",
                    value: client.gender
                      ? client.gender.charAt(0).toUpperCase() +
                        client.gender.slice(1)
                      : undefined,
                  },
                  { label: "Goal", value: client.goal },
                  { label: "Notes", value: client.notes },
                ].map(({ label, value }) => (
                  <div key={label} className="flex gap-2">
                    <dt className="w-24 text-gray-500">{label}</dt>
                    <dd className="whitespace-pre-wrap">{value ?? "—"}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-4">
                <Link
                  to={`/clients/${id}/progress`}
                  className="inline-block rounded-lg bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-100"
                >
                  View Progress →
                </Link>
              </div>
            </>
          )}
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 font-semibold text-gray-800">Sessions</h2>
          {!sessions || sessions.length === 0 ? (
            <p className="text-sm text-gray-400">No sessions yet.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {sessions.map((s) => (
                <li key={s.id} className="flex items-center justify-between">
                  <span className="font-medium">{s.title}</span>
                  <span className="text-gray-400">
                    {new Date(s.scheduledAt).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 font-semibold text-gray-800">Personal records</h2>
          {!prs || prs.length === 0 ? (
            <p className="text-sm text-gray-400">No PRs yet.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {prs.map((pr) => (
                <li key={pr.id} className="flex items-center justify-between">
                  <span className="font-medium">{pr.exerciseName}</span>
                  <span className="text-gray-600">
                    {pr.weightKg} kg × {pr.reps}
                    <span className="ml-2 text-xs text-gray-400">
                      {new Date(pr.achievedAt).toLocaleDateString()}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 font-semibold text-gray-800">Workout history</h2>
          {!logs || logs.length === 0 ? (
            <p className="text-sm text-gray-400">No completed workouts yet.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {logs.map((log) => (
                <li key={log.id}>
                  <Link
                    to={`/sessions/${log.sessionId}/log`}
                    className="flex items-center justify-between rounded-lg p-2 hover:bg-gray-50"
                  >
                    <div className="min-w-0">
                      <p className="font-medium">{log.sessionTitle}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(log.startedAt).toLocaleDateString()} ·{" "}
                        {log.exerciseCount} exercise
                        {log.exerciseCount !== 1 ? "s" : ""}
                        {log.durationMinutes
                          ? ` · ${log.durationMinutes} min`
                          : ""}
                      </p>
                    </div>
                    <span className="text-xs text-gray-400">
                      {log.endedAt ? "✓" : "in progress"}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="lg:col-span-2">
          <PaymentsPanel clientId={id!} />
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm lg:col-span-2">
          <h2 className="mb-4 font-semibold text-gray-800">
            Export Workout Plan
          </h2>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label className="mb-1 block text-xs text-gray-500">
                Select plan
              </label>
              <select
                value={exportPlanId}
                onChange={(e) => setExportPlanId(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              >
                <option value="">— choose a plan —</option>
                {plans?.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={handleExportPdf}
              disabled={!exportPlanId || isExporting}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {isExporting ? "Exporting..." : "Export PDF"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
