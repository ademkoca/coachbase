import { useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  useWorkoutPlan,
  useReplacePlanExercises,
  useDeleteWorkoutPlan,
} from "../hooks/useWorkoutPlans";
import { useExercises } from "../hooks/useExercises";
import { auth } from "../firebase";

interface EditableItem {
  exerciseId: string;
  exerciseName: string;
  sets?: number;
  reps?: number;
  durationSeconds?: number;
  restSeconds?: number;
  notes?: string;
}

export default function PlanDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: plan, isPending } = useWorkoutPlan(id!);
  const { data: allExercises } = useExercises();
  const replacePlanExercises = useReplacePlanExercises();
  const deletePlan = useDeleteWorkoutPlan();

  async function handleDelete() {
    if (!confirm(`Delete "${plan?.name}"? This cannot be undone.`)) return;
    await deletePlan.mutateAsync(id!);
    navigate("/workout-plans");
  }

  const [items, setItems] = useState<EditableItem[]>([]);
  const [initialized, setInitialized] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [search, setSearch] = useState("");
  const [saved, setSaved] = useState(false);

  if (!initialized && plan) {
    setItems(
      plan.exercises.map((pe) => ({
        exerciseId: pe.exercise.id,
        exerciseName: pe.exercise.name,
        sets: pe.sets ?? undefined,
        reps: pe.reps ?? undefined,
        durationSeconds: pe.durationSeconds ?? undefined,
        restSeconds: pe.restSeconds ?? undefined,
        notes: pe.notes ?? undefined,
      })),
    );
    setInitialized(true);
  }

  if (isPending) return <p className="text-gray-500">Loading...</p>;
  if (!plan) return <p className="text-gray-500">Plan not found.</p>;

  function updateItem(index: number, patch: Partial<EditableItem>) {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    );
    setSaved(false);
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
    setSaved(false);
  }

  function addExercise(exerciseId: string, exerciseName: string) {
    setItems((prev) => [...prev, { exerciseId, exerciseName }]);
    setShowExercisePicker(false);
    setSaved(false);
  }

  async function handleExportPdf() {
    setIsExporting(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await axios.get(`/api/workout-plans/${id}/export`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: "blob",
      });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${plan!.name}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsExporting(false);
    }
  }

  async function handleSave() {
    await replacePlanExercises.mutateAsync({ planId: id!, exercises: items });
    setSaved(true);
  }

  const filteredExercises = allExercises?.filter(
    (ex) =>
      ex.name.toLowerCase().includes(search.toLowerCase()) &&
      !items.some((item) => item.exerciseId === ex.id),
  );

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to="/workout-plans"
            className="text-sm text-gray-400 hover:text-gray-600"
          >
            ← Workout Plans
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{plan.name}</h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExportPdf}
            disabled={isExporting}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-60"
          >
            {isExporting ? "Exporting..." : "Export PDF"}
          </button>
          <button
            onClick={handleDelete}
            disabled={deletePlan.isPending}
            className="rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-500 hover:bg-red-50 disabled:opacity-60"
          >
            Delete plan
          </button>
        </div>
      </div>

      {plan.description && (
        <p className="mb-4 text-sm text-gray-500">{plan.description}</p>
      )}

      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="mb-4 font-semibold text-gray-800">Exercises</h2>

        {items.length === 0 ? (
          <p className="mb-4 text-sm text-gray-400">No exercises added yet.</p>
        ) : (
          <div className="mb-4 space-y-3">
            {items.map((item, i) => (
              <div key={i} className="rounded-lg border border-gray-200 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <p className="font-medium text-gray-800">
                    {item.exerciseName}
                  </p>
                  <button
                    onClick={() => removeItem(i)}
                    className="text-xs text-red-400 hover:text-red-600"
                  >
                    Remove
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
                  {[
                    { key: "sets", label: "Sets" },
                    { key: "reps", label: "Reps" },
                    { key: "durationSeconds", label: "Duration (s)" },
                    { key: "restSeconds", label: "Rest (s)" },
                  ].map(({ key, label }) => (
                    <div key={key}>
                      <label className="mb-0.5 block text-xs text-gray-500">
                        {label}
                      </label>
                      <input
                        type="number"
                        value={
                          (
                            item as unknown as Record<
                              string,
                              number | undefined
                            >
                          )[key] ?? ""
                        }
                        onChange={(e) =>
                          updateItem(i, {
                            [key]: e.target.value
                              ? Number(e.target.value)
                              : undefined,
                          })
                        }
                        className="w-full rounded border border-gray-200 px-2 py-1 text-base focus:border-indigo-400 focus:outline-none"
                      />
                    </div>
                  ))}
                </div>
                <input
                  placeholder="Notes"
                  value={item.notes ?? ""}
                  onChange={(e) =>
                    updateItem(i, { notes: e.target.value || undefined })
                  }
                  className="mt-2 w-full rounded border border-gray-200 px-2 py-1 text-base focus:border-indigo-400 focus:outline-none"
                />
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowExercisePicker(true)}
            className="rounded-lg border border-indigo-300 px-3 py-1.5 text-sm text-indigo-600 hover:bg-indigo-50"
          >
            + Add exercise
          </button>
          <button
            onClick={handleSave}
            disabled={replacePlanExercises.isPending}
            className="rounded-lg bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {replacePlanExercises.isPending
              ? "Saving..."
              : saved
                ? "Saved ✓"
                : "Save changes"}
          </button>
        </div>
      </div>

      {showExercisePicker && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center">
          <div className="w-full max-w-md rounded-t-2xl bg-white p-6 shadow-xl sm:rounded-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold">Add exercise</h3>
              <button
                onClick={() => setShowExercisePicker(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <input
              autoFocus
              placeholder="Search exercises..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="mb-3 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            />
            <div className="max-h-64 overflow-y-auto space-y-1">
              {filteredExercises?.map((ex) => (
                <button
                  key={ex.id}
                  onClick={() => addExercise(ex.id, ex.name)}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm hover:bg-gray-50"
                >
                  <span>{ex.name}</span>
                  <span className="text-xs text-gray-400 capitalize">
                    {ex.muscleGroup}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
