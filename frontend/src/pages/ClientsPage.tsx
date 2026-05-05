import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useClients, useDeleteClient } from "../hooks/useClients";
import { NewClientModal } from "../components/NewClientModal";

export default function ClientsPage() {
  const { data: clients, isPending } = useClients();
  const deleteClient = useDeleteClient();
  const [showModal, setShowModal] = useState(false);

  const [search, setSearch] = useState("");
  const [genderFilter, setGenderFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const displayedClients = useMemo(() => {
    let list = clients ?? [];
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((c) => c.name.toLowerCase().includes(q));
    }
    if (genderFilter === "unspecified") list = list.filter((c) => !c.gender);
    else if (genderFilter) list = list.filter((c) => c.gender === genderFilter);
    if (statusFilter)
      list = list.filter((c) => (c.status ?? "ACTIVE") === statusFilter);
    return [...list].sort((a, b) =>
      sortDir === "asc"
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name),
    );
  }, [clients, search, genderFilter, statusFilter, sortDir]);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
        <button
          onClick={() => setShowModal(true)}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          + New client
        </button>
      </div>

      <NewClientModal open={showModal} onClose={() => setShowModal(false)} />

      {/* Search / Filter / Sort toolbar */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          type="search"
          placeholder="Search by name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="min-w-40 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-indigo-500 focus:outline-none"
        />
        <select
          value={genderFilter}
          onChange={(e) => setGenderFilter(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
        >
          <option value="">All genders</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="unspecified">Unspecified</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
        >
          <option value="">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
        <button
          onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50"
        >
          Name {sortDir === "asc" ? "↑" : "↓"}
        </button>
      </div>

      {isPending ? (
        <p className="text-gray-500">Loading...</p>
      ) : clients?.length === 0 ? (
        <p className="text-gray-500">
          No clients yet. Add your first client above.
        </p>
      ) : displayedClients.length === 0 ? (
        <p className="text-gray-500">No clients match your filters.</p>
      ) : (
        <>
          {/* Table — sm and up */}
          <div className="hidden overflow-hidden rounded-xl bg-white shadow-sm sm:block">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-100 bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Name</th>
                  <th className="px-4 py-3 text-left font-medium">Email</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-left font-medium">Added</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {displayedClients.map((c) => (
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
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          (c.status ?? "ACTIVE") === "ACTIVE"
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {(c.status ?? "ACTIVE") === "ACTIVE"
                          ? "Active"
                          : "Inactive"}
                      </span>
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
          <ul className="space-y-2 sm:hidden">
            {displayedClients.map((c) => (
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
                    <dt className="w-14 text-gray-400">Status</dt>
                    <dd>
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          (c.status ?? "ACTIVE") === "ACTIVE"
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {(c.status ?? "ACTIVE") === "ACTIVE"
                          ? "Active"
                          : "Inactive"}
                      </span>
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
