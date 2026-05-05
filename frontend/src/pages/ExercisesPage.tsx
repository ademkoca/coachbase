import { useState } from "react";
import {
  useExercises,
  useCreateExercise,
  useDeleteExercise,
} from "../hooks/useExercises";

const MUSCLE_GROUPS = [
  "",
  "chest",
  "back",
  "legs",
  "shoulders",
  "arms",
  "core",
  "cardio",
];
const CATEGORIES = ["", "strength", "cardio", "flexibility", "plyometric"];

export default function ExercisesPage() {
  const [muscleGroup, setMuscleGroup] = useState("");
  const [category, setCategory] = useState("");
  const { data: exercises, isPending } = useExercises(
    muscleGroup || category
      ? {
          muscleGroup: muscleGroup || undefined,
          category: category || undefined,
        }
      : undefined,
  );
  const createExercise = useCreateExercise();
  const deleteExercise = useDeleteExercise();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    muscleGroup: "chest",
    category: "strength",
    description: "",
  });

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    await createExercise.mutateAsync(form);
    setShowForm(false);
    setForm({
      name: "",
      muscleGroup: "chest",
      category: "strength",
      description: "",
    });
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Exercises</h1>
        <button
          onClick={() => setShowForm(true)}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          + Custom exercise
        </button>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-3">
        <select
          value={muscleGroup}
          onChange={(e) => setMuscleGroup(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
        >
          {MUSCLE_GROUPS.map((g) => (
            <option key={g} value={g}>
              {g || "All muscle groups"}
            </option>
          ))}
        </select>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c || "All categories"}
            </option>
          ))}
        </select>
      </div>

      {showForm && (
        <div className="mb-6 rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 font-semibold">New custom exercise</h2>
          <form onSubmit={handleCreate} className="space-y-3">
            <input
              placeholder="Exercise name *"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-indigo-500 focus:outline-none"
            />
            <div className="flex gap-3">
              <select
                value={form.muscleGroup}
                onChange={(e) =>
                  setForm((f) => ({ ...f, muscleGroup: e.target.value }))
                }
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              >
                {MUSCLE_GROUPS.filter(Boolean).map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
              <select
                value={form.category}
                onChange={(e) =>
                  setForm((f) => ({ ...f, category: e.target.value }))
                }
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              >
                {CATEGORIES.filter(Boolean).map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <textarea
              placeholder="Description (optional)"
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              rows={2}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-indigo-500 focus:outline-none"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={createExercise.isPending}
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
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {exercises?.map((ex) => (
            <div key={ex.id} className="rounded-xl bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between">
                <p className="font-medium text-gray-900">{ex.name}</p>
                {ex.trainerId && (
                  <button
                    onClick={() => deleteExercise.mutate(ex.id)}
                    className="text-xs text-red-400 hover:text-red-600"
                  >
                    ✕
                  </button>
                )}
              </div>
              <div className="mt-1 flex gap-2">
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600 capitalize">
                  {ex.muscleGroup}
                </span>
                <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs text-indigo-600 capitalize">
                  {ex.category}
                </span>
                {!ex.trainerId && (
                  <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs text-green-600">
                    standard
                  </span>
                )}
              </div>
              {ex.description && (
                <p className="mt-2 text-xs text-gray-400">{ex.description}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
