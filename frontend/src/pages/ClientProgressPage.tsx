import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  useProgress,
  useCreateProgressEntry,
  useDeleteProgressEntry,
  useUploadProgressPhoto,
} from "../hooks/useProgress";
import { useClientPRs } from "../hooks/useWorkoutLogs";
import { useClient } from "../hooks/useClients";
import { useAuthStore } from "../store/authStore";
import type { ProgressEntry } from "../types/api";

type MeasurementKey =
  | "weightKg"
  | "bicepCm"
  | "shouldersCm"
  | "chestCm"
  | "waistCm"
  | "buttCm"
  | "thighCm";

interface Measurement {
  key: MeasurementKey;
  label: string;
  color: string;
}

function buildMeasurements(
  weightUnit: "kg" | "lbs",
  measurementUnit: "cm" | "in",
): Measurement[] {
  return [
    { key: "weightKg", label: `Weight (${weightUnit})`, color: "#2563eb" },
    { key: "bicepCm", label: `Bicep (${measurementUnit})`, color: "#16a34a" },
    {
      key: "shouldersCm",
      label: `Shoulders (${measurementUnit})`,
      color: "#d97706",
    },
    { key: "chestCm", label: `Chest (${measurementUnit})`, color: "#dc2626" },
    { key: "waistCm", label: `Waist (${measurementUnit})`, color: "#7c3aed" },
    { key: "buttCm", label: `Butt (${measurementUnit})`, color: "#db2777" },
    { key: "thighCm", label: `Thigh (${measurementUnit})`, color: "#0891b2" },
  ];
}

const OVERVIEW_FIELDS: { key: MeasurementKey; short: string }[] = [
  { key: "weightKg", short: "Weight" },
  { key: "waistCm", short: "Waist" },
  { key: "chestCm", short: "Chest" },
  { key: "bicepCm", short: "Bicep" },
  { key: "thighCm", short: "Thigh" },
];

function PhotoUploader({
  clientId,
  entryId,
}: {
  clientId: string;
  entryId: string;
}) {
  const upload = useUploadProgressPhoto(clientId, entryId);
  return (
    <div className="flex gap-2">
      {(["front", "side"] as const).map((view) => (
        <label
          key={view}
          className="cursor-pointer rounded-lg border-2 border-dashed border-gray-300 px-4 py-2 text-sm text-gray-500 hover:border-indigo-400 hover:text-indigo-600"
        >
          + {view} photo
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) upload.mutate({ file, view });
            }}
          />
        </label>
      ))}
    </div>
  );
}

function EntryCard({
  entry,
  clientId,
  measurements,
}: {
  entry: ProgressEntry;
  clientId: string;
  measurements: Measurement[];
}) {
  const deleteEntry = useDeleteProgressEntry(clientId);
  const [expanded, setExpanded] = useState(false);

  const overviewItems = OVERVIEW_FIELDS.filter(
    ({ key }) =>
      entry[key as keyof ProgressEntry] != null &&
      entry[key as keyof ProgressEntry] !== "",
  );

  return (
    <div className="rounded-xl bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={() => setExpanded(!expanded)}
          className="shrink-0 font-medium text-gray-900 hover:text-indigo-600"
        >
          {new Date(entry.measuredAt).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </button>

        {/* Overview pills — hidden on mobile, visible from md (tablet) up */}
        {overviewItems.length > 0 && (
          <div className="hidden md:flex flex-wrap gap-2 flex-1">
            {overviewItems.map(({ key, short }) => (
              <span
                key={key}
                className="rounded-full bg-gray-100 px-3 py-0.5 text-xs text-gray-600"
              >
                <span className="text-gray-400">{short} </span>
                {String(entry[key as keyof ProgressEntry])}
              </span>
            ))}
            {entry.photos.length > 0 && (
              <span className="rounded-full bg-indigo-50 px-3 py-0.5 text-xs text-indigo-600">
                {entry.photos.length} photo{entry.photos.length > 1 ? "s" : ""}
              </span>
            )}
          </div>
        )}

        <button
          onClick={() => {
            if (confirm("Delete this entry?")) deleteEntry.mutate(entry.id);
          }}
          className="shrink-0 text-xs text-red-400 hover:text-red-600"
        >
          Delete
        </button>
      </div>

      {expanded && (
        <div className="mt-4">
          <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-3 lg:grid-cols-4">
            {measurements.map(({ key, label }) => {
              const val = entry[key as keyof ProgressEntry];
              if (!val) return null;
              return (
                <div key={key} className="rounded-lg bg-gray-50 p-2">
                  <p className="text-xs text-gray-500">{label}</p>
                  <p className="font-medium">{String(val)}</p>
                </div>
              );
            })}
          </div>

          {entry.notes && (
            <p className="mt-3 text-sm text-gray-500">{entry.notes}</p>
          )}

          {entry.photos.length > 0 && (
            <div className="mt-3 flex gap-3">
              {entry.photos.map((p) => (
                <div key={p.id} className="text-center">
                  <img
                    src={p.storageUrl}
                    alt={p.view}
                    className="h-32 w-24 rounded-lg object-cover"
                  />
                  <p className="mt-1 text-xs text-gray-400 capitalize">
                    {p.view}
                  </p>
                </div>
              ))}
            </div>
          )}

          {entry.photos.length < 2 && (
            <div className="mt-3">
              <PhotoUploader clientId={clientId} entryId={entry.id} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ClientProgressPage() {
  const { id } = useParams<{ id: string }>();
  const trainer = useAuthStore((s) => s.trainer);
  const { data: client } = useClient(id!);
  const { data: entries, isPending } = useProgress(id!);
  const { data: prs } = useClientPRs(id);
  const createEntry = useCreateProgressEntry(id!);

  const measurements = buildMeasurements(
    trainer?.weightUnit ?? "kg",
    trainer?.measurementUnit ?? "cm",
  );

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<{ [key: string]: string }>({
    measuredAt: new Date().toISOString().slice(0, 10),
  });
  function defaultMeasurements(gender?: string): Set<MeasurementKey> {
    if (gender === "female")
      return new Set<MeasurementKey>([
        "weightKg",
        "waistCm",
        "buttCm",
        "thighCm",
      ]);
    if (gender === "male")
      return new Set<MeasurementKey>([
        "weightKg",
        "chestCm",
        "shouldersCm",
        "bicepCm",
      ]);
    return new Set<MeasurementKey>(["weightKg"]);
  }

  const [activeLines, setActiveLines] = useState<Set<MeasurementKey>>(() =>
    defaultMeasurements(client?.gender),
  );

  function toggleLine(key: MeasurementKey) {
    setActiveLines((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    await createEntry.mutateAsync(form as Partial<ProgressEntry>);
    setShowForm(false);
    setForm({ measuredAt: new Date().toISOString().slice(0, 10) });
  }

  const chartData = entries?.map((e) => ({
    date: new Date(e.measuredAt).toLocaleDateString(),
    ...Object.fromEntries(
      measurements.map(({ key }) => [
        key,
        e[key as keyof ProgressEntry]
          ? Number(e[key as keyof ProgressEntry])
          : null,
      ]),
    ),
  }));

  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <Link
          to={`/clients/${id}`}
          className="text-sm text-gray-400 hover:text-gray-600"
        >
          ← {client?.name ?? "Client"}
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Progress</h1>
      </div>

      {/* Chart */}
      {entries && entries.length > 1 && (
        <div className="mb-6 rounded-xl bg-white p-5 shadow-sm">
          <div className="mb-3 flex flex-wrap gap-2">
            {measurements.map(({ key, label, color }) => (
              <button
                key={key}
                onClick={() => toggleLine(key)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-opacity ${
                  activeLines.has(key) ? "opacity-100" : "opacity-30"
                }`}
                style={{ background: `${color}20`, color }}
              >
                {label}
              </button>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              {measurements
                .filter(({ key }) => activeLines.has(key))
                .map(({ key, label, color }) => (
                  <Line
                    key={key}
                    type="monotone"
                    dataKey={key}
                    name={label}
                    stroke={color}
                    dot={{ r: 3 }}
                    connectNulls
                  />
                ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {prs && prs.length > 0 && (
        <div className="mb-6 rounded-xl bg-white p-5 shadow-sm">
          <h2 className="mb-4 font-semibold text-gray-800">Personal Records</h2>
          <ResponsiveContainer
            width="100%"
            height={Math.max(180, prs.length * 36)}
          >
            <BarChart
              data={prs.map((pr) => ({
                name: pr.exerciseName,
                weight: parseFloat(pr.weightKg),
                reps: pr.reps,
              }))}
              layout="vertical"
              margin={{ left: 8, right: 32, top: 0, bottom: 0 }}
            >
              <XAxis type="number" tick={{ fontSize: 11 }} unit=" kg" />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 11 }}
                width={120}
              />
              <Tooltip
                formatter={(value, _name, props) => [
                  `${value} kg × ${props.payload.reps} reps`,
                  "Best",
                ]}
              />
              <Bar dataKey="weight" fill="#6366f1" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-semibold text-gray-800">Measurement sessions</h2>
        <button
          onClick={() => setShowForm(true)}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          + Add measurement
        </button>
      </div>

      {showForm && (
        <div className="mb-6 rounded-xl bg-white p-6 shadow-sm">
          <h3 className="mb-4 font-semibold">New measurement session</h3>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="mb-1 block text-xs text-gray-500">Date *</label>
              <input
                type="date"
                value={form.measuredAt}
                onChange={(e) =>
                  setForm((f) => ({ ...f, measuredAt: e.target.value }))
                }
                required
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {measurements.map(({ key, label }) => (
                <div key={key}>
                  <label className="mb-1 block text-xs text-gray-500">
                    {label}
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={form[key] ?? ""}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, [key]: e.target.value }))
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              ))}
            </div>
            <textarea
              placeholder="Notes (optional)"
              value={form.notes ?? ""}
              onChange={(e) =>
                setForm((f) => ({ ...f, notes: e.target.value }))
              }
              rows={2}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-indigo-500 focus:outline-none"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={createEntry.isPending}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {isPending ? (
        <p className="text-gray-500">Loading...</p>
      ) : entries?.length === 0 ? (
        <p className="text-gray-500">
          No measurements yet. Add the first one above.
        </p>
      ) : (
        <div className="space-y-3">
          {[...(entries ?? [])].reverse().map((entry) => (
            <EntryCard
              key={entry.id}
              entry={entry}
              clientId={id!}
              measurements={measurements}
            />
          ))}
        </div>
      )}
    </div>
  );
}
