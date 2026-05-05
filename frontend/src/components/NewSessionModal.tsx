import { useEffect, useState } from "react";
import { useClients } from "../hooks/useClients";
import { useGroups } from "../hooks/useGroups";
import { useWorkoutPlans } from "../hooks/useWorkoutPlans";
import {
  useCreateSession,
  useCreateRecurringSessions,
} from "../hooks/useSessions";
import { useCheckCoverage } from "../hooks/usePayments";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface NewSessionModalProps {
  open: boolean;
  onClose: () => void;
  initialScheduledAt?: string;
  initialStartDate?: string;
}

export function NewSessionModal({
  open,
  onClose,
  initialScheduledAt,
  initialStartDate,
}: NewSessionModalProps) {
  const { data: clients } = useClients();
  const { data: groups } = useGroups();
  const { data: plans } = useWorkoutPlans();
  const createSession = useCreateSession();
  const createRecurring = useCreateRecurringSessions();

  const [sessionType, setSessionType] = useState<"individual" | "group">(
    "individual",
  );
  const [isRecurring, setIsRecurring] = useState(false);
  const [title, setTitle] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [time, setTime] = useState("09:00");
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([]);
  const [durationMinutes, setDurationMinutes] = useState("60");
  const [selectedClientIds, setSelectedClientIds] = useState<string[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [selectedPlanId, setSelectedPlanId] = useState("");

  useEffect(() => {
    if (open) {
      if (initialScheduledAt) {
        setScheduledAt(initialScheduledAt);
        setStartDate(initialStartDate ?? initialScheduledAt.slice(0, 10));
      } else {
        const now = new Date();
        now.setMinutes(0, 0, 0);
        now.setHours(now.getHours() + 1);
        const pad = (n: number) => String(n).padStart(2, "0");
        const dt = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:00`;
        setScheduledAt(dt);
        setStartDate(dt.slice(0, 10));
      }
      setTitle("");
      setIsRecurring(false);
      setSessionType("individual");
      setEndDate("");
      setTime("09:00");
      setDaysOfWeek([]);
      setDurationMinutes("60");
      setSelectedClientIds([]);
      setSelectedGroupId("");
      setSelectedPlanId("");
    }
  }, [open, initialScheduledAt, initialStartDate]);

  const isPending = createSession.isPending || createRecurring.isPending;
  const coverageDate =
    !isRecurring && scheduledAt ? scheduledAt.slice(0, 10) : "";
  const coverageClientIds =
    sessionType === "individual" && !isRecurring ? selectedClientIds : [];
  const { data: coverage } = useCheckCoverage(coverageClientIds, coverageDate);
  const uncoveredClients =
    clients?.filter(
      (c) => coverageClientIds.includes(c.id) && coverage?.[c.id] === false,
    ) ?? [];

  function toggleClient(id: string) {
    setSelectedClientIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    );
  }

  function toggleDay(day: number) {
    setDaysOfWeek((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const sharedPayload = {
      title,
      durationMinutes: Number(durationMinutes) || 60,
      workoutPlanId: selectedPlanId || undefined,
      groupId:
        sessionType === "group" ? selectedGroupId || undefined : undefined,
      clientIds: sessionType === "individual" ? selectedClientIds : undefined,
    };
    if (isRecurring) {
      await createRecurring.mutateAsync({
        ...sharedPayload,
        startDate,
        endDate,
        time,
        daysOfWeek,
      });
    } else {
      await createSession.mutateAsync({ ...sharedPayload, scheduledAt });
    }
    onClose();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">New session</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>
        <form onSubmit={handleCreate} className="space-y-3">
          <input
            placeholder="Session title *"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-indigo-500 focus:outline-none"
          />

          <div className="flex gap-2">
            {(["single", "recurring"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setIsRecurring(mode === "recurring")}
                className={`flex-1 rounded-lg border py-2 text-sm capitalize transition-colors ${
                  (mode === "recurring") === isRecurring
                    ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                    : "border-gray-300 text-gray-600"
                }`}
              >
                {mode === "single" ? "Single session" : "Recurring"}
              </button>
            ))}
          </div>

          {!isRecurring ? (
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="mb-1 block text-xs text-gray-500">
                  Date & time
                </label>
                <input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div className="w-28">
                <label className="mb-1 block text-xs text-gray-500">
                  Duration (min)
                </label>
                <input
                  type="number"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(e.target.value)}
                  min={15}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          ) : (
            <>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="mb-1 block text-xs text-gray-500">
                    Start date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div className="flex-1">
                  <label className="mb-1 block text-xs text-gray-500">
                    End date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                    min={startDate}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="mb-1 block text-xs text-gray-500">
                    Time
                  </label>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    required
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div className="w-28">
                  <label className="mb-1 block text-xs text-gray-500">
                    Duration (min)
                  </label>
                  <input
                    type="number"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(e.target.value)}
                    min={15}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="mb-2 block text-xs text-gray-500">
                  Days of week
                </label>
                <div className="flex gap-1.5">
                  {DAYS.map((day, i) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(i)}
                      className={`flex-1 rounded-lg border py-1.5 text-xs font-medium transition-colors ${
                        daysOfWeek.includes(i)
                          ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                          : "border-gray-200 text-gray-500 hover:border-gray-300"
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          <div className="flex gap-2">
            {(["individual", "group"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setSessionType(t)}
                className={`flex-1 rounded-lg border py-2 text-sm capitalize transition-colors ${
                  sessionType === t
                    ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                    : "border-gray-300 text-gray-600"
                }`}
              >
                {t === "individual" ? "1-on-1" : "Group"}
              </button>
            ))}
          </div>

          {sessionType === "individual" ? (
            <div>
              <label className="mb-1 block text-xs text-gray-500">
                Clients
              </label>
              <div className="max-h-32 overflow-y-auto rounded-lg border border-gray-200 p-2 space-y-1">
                {clients?.map((c) => (
                  <label
                    key={c.id}
                    className="flex items-center gap-2 text-sm cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedClientIds.includes(c.id)}
                      onChange={() => toggleClient(c.id)}
                      className="rounded"
                    />
                    {c.name}
                  </label>
                ))}
              </div>
              {uncoveredClients.length > 0 && (
                <div className="mt-2 rounded-lg bg-yellow-50 px-3 py-2 text-xs text-yellow-800">
                  ⚠ No active payment covering this date for:{" "}
                  <span className="font-medium">
                    {uncoveredClients.map((c) => c.name).join(", ")}
                  </span>
                  . You can still proceed — payment can be recorded later.
                </div>
              )}
            </div>
          ) : (
            <div>
              <label className="mb-1 block text-xs text-gray-500">Group</label>
              <select
                value={selectedGroupId}
                onChange={(e) => setSelectedGroupId(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              >
                <option value="">— Select group —</option>
                {groups?.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {(() => {
            const injuredClients =
              clients?.filter(
                (c) => selectedClientIds.includes(c.id) && c.injuryNotes,
              ) ?? [];
            return injuredClients.length > 0 ? (
              <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                <span className="mt-0.5">⚠️</span>
                <div className="space-y-0.5">
                  {injuredClients.map((c) => (
                    <p key={c.id}>
                      <strong>{c.name}:</strong> {c.injuryNotes}
                    </p>
                  ))}
                </div>
              </div>
            ) : null;
          })()}

          <div>
            <label className="mb-1 block text-xs text-gray-500">
              Workout plan (optional)
            </label>
            <select
              value={selectedPlanId}
              onChange={(e) => setSelectedPlanId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            >
              <option value="">— None —</option>
              {plans?.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={isPending || (isRecurring && daysOfWeek.length === 0)}
              className="flex-1 rounded-lg bg-indigo-600 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {isPending
                ? "Creating..."
                : isRecurring
                  ? "Create recurring sessions"
                  : "Create session"}
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
