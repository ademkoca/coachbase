import { useState } from "react";
import { Link } from "react-router-dom";
import {
  useWorkoutPlans,
  useCreateWorkoutPlan,
} from "../hooks/useWorkoutPlans";

export default function WorkoutPlansPage() {
  const { data: plans, isPending } = useWorkoutPlans();
  const createPlan = useCreateWorkoutPlan();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    await createPlan.mutateAsync({ name, description });
    setShowForm(false);
    setName("");
    setDescription("");
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Workout Plans</h1>
        <button
          onClick={() => setShowForm(true)}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          + New plan
        </button>
      </div>

      {showForm && (
        <div className="mb-6 rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 font-semibold">New workout plan</h2>
          <form onSubmit={handleCreate} className="space-y-3">
            <input
              placeholder="Plan name *"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-indigo-500 focus:outline-none"
            />
            <textarea
              placeholder="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-indigo-500 focus:outline-none"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={createPlan.isPending}
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
      ) : plans?.length === 0 ? (
        <p className="text-gray-500">No workout plans yet.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {plans?.map((p) => (
            <Link
              key={p.id}
              to={`/workout-plans/${p.id}`}
              className="block rounded-xl bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <p className="font-semibold text-gray-900">{p.name}</p>
              {p.description && (
                <p className="mt-1 text-sm text-gray-500">{p.description}</p>
              )}
              {p.exerciseNames.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {p.exerciseNames.map((name) => (
                    <span
                      key={name}
                      className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs text-indigo-700"
                    >
                      {name}
                    </span>
                  ))}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
