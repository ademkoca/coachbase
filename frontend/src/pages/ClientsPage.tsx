import { useState } from "react";
import { Link } from "react-router-dom";
import {
  useClients,
  useCreateClient,
  useDeleteClient,
} from "../hooks/useClients";

export default function ClientsPage() {
  const { data: clients, isPending } = useClients();
  const createClient = useCreateClient();
  const deleteClient = useDeleteClient();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState("");
  const [goal, setGoal] = useState("");
  const [injuryNotes, setInjuryNotes] = useState("");
  const [notes, setNotes] = useState("");

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    await createClient.mutateAsync({
      name,
      email: email || undefined,
      phone: phone || undefined,
      gender: gender || undefined,
      goal: goal || undefined,
      injuryNotes: injuryNotes || undefined,
      notes: notes || undefined,
    });
    setShowForm(false);
    setName("");
    setEmail("");
    setPhone("");
    setGender("");
    setGoal("");
    setInjuryNotes("");
    setNotes("");
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
        <button
          onClick={() => setShowForm(true)}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          + New client
        </button>
      </div>

      {showForm && (
        <div className="mb-6 rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 font-semibold text-gray-900">New client</h2>
          <form onSubmit={handleCreate} className="space-y-3">
            <input
              placeholder="Full name *"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-indigo-500 focus:outline-none"
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                placeholder="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-indigo-500 focus:outline-none"
              />
              <input
                placeholder="Phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <p className="mb-1.5 text-xs text-gray-500">Gender</p>
              <div className="flex gap-4 text-sm">
                {(["male", "female"] as const).map((g) => (
                  <label
                    key={g}
                    className="flex cursor-pointer items-center gap-1.5"
                  >
                    <input
                      type="radio"
                      name="gender"
                      value={g}
                      checked={gender === g}
                      onChange={() => setGender(g)}
                      className="accent-indigo-600"
                    />
                    {g.charAt(0).toUpperCase() + g.slice(1)}
                  </label>
                ))}
                <label className="flex cursor-pointer items-center gap-1.5 text-gray-400">
                  <input
                    type="radio"
                    name="gender"
                    value=""
                    checked={gender === ""}
                    onChange={() => setGender("")}
                    className="accent-indigo-600"
                  />
                  Not specified
                </label>
              </div>
            </div>
            <input
              placeholder="Goal (e.g. lose weight, build muscle)"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-indigo-500 focus:outline-none"
            />
            <textarea
              placeholder="Injury notes"
              value={injuryNotes}
              onChange={(e) => setInjuryNotes(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-base placeholder-amber-400 focus:border-amber-400 focus:outline-none"
            />
            <textarea
              placeholder="Notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-indigo-500 focus:outline-none"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={createClient.isPending}
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
      ) : clients?.length === 0 ? (
        <p className="text-gray-500">
          No clients yet. Add your first client above.
        </p>
      ) : (
        <>
          {/* Table — sm and up */}
          <div className="hidden sm:block overflow-hidden rounded-xl bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-100 bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Name</th>
                  <th className="px-4 py-3 text-left font-medium">Email</th>
                  <th className="px-4 py-3 text-left font-medium">Added</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {clients?.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link
                        to={`/clients/${c.id}`}
                        className="font-medium text-indigo-600 hover:underline"
                      >
                        {c.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {c.email ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => {
                          if (confirm(`Delete ${c.name}?`))
                            deleteClient.mutate(c.id);
                        }}
                        className="text-xs text-red-500 hover:text-red-700"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Card list — mobile */}
          <ul className="sm:hidden space-y-2">
            {clients?.map((c) => (
              <li key={c.id} className="rounded-xl bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <Link
                    to={`/clients/${c.id}`}
                    className="font-medium text-indigo-600 hover:underline"
                  >
                    {c.name}
                  </Link>
                  <button
                    onClick={() => {
                      if (confirm(`Delete ${c.name}?`))
                        deleteClient.mutate(c.id);
                    }}
                    className="shrink-0 text-xs text-red-500 hover:text-red-700"
                  >
                    Delete
                  </button>
                </div>
                <dl className="mt-2 space-y-0.5 text-xs">
                  <div className="flex gap-2">
                    <dt className="w-14 text-gray-400">Email</dt>
                    <dd className="min-w-0 truncate text-gray-600">
                      {c.email ?? "—"}
                    </dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="w-14 text-gray-400">Added</dt>
                    <dd className="text-gray-600">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </dd>
                  </div>
                </dl>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
