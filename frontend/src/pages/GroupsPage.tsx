import { useState } from "react";
import {
  useGroups,
  useGroup,
  useCreateGroup,
  useDeleteGroup,
  useAddGroupMembers,
  useRemoveGroupMember,
} from "../hooks/useGroups";
import { useClients } from "../hooks/useClients";

function GroupDetail({ groupId }: { groupId: string }) {
  const { data: group } = useGroup(groupId);
  const { data: clients } = useClients();
  const addMembers = useAddGroupMembers();
  const removeMember = useRemoveGroupMember();
  const [showPicker, setShowPicker] = useState(false);

  const nonMembers = clients?.filter(
    (c) => !group?.members.some((m) => m.id === c.id),
  );

  if (!group) return null;

  return (
    <div className="rounded-xl bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">{group.name}</h3>
        <button
          onClick={() => setShowPicker(true)}
          className="text-xs text-indigo-600 hover:underline"
        >
          + Add members
        </button>
      </div>
      {group.description && (
        <p className="mb-3 text-sm text-gray-500">{group.description}</p>
      )}
      {group.members.length === 0 ? (
        <p className="text-sm text-gray-400">No members yet.</p>
      ) : (
        <ul className="space-y-1">
          {group.members.map((m) => (
            <li
              key={m.id}
              className="flex items-center justify-between text-sm"
            >
              <span>{m.name}</span>
              <button
                onClick={() =>
                  removeMember.mutate({ groupId: group.id, clientId: m.id })
                }
                className="text-xs text-red-400 hover:text-red-600"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      {showPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold">Add clients to {group.name}</h3>
              <button
                onClick={() => setShowPicker(false)}
                className="text-gray-400"
              >
                ✕
              </button>
            </div>
            {nonMembers?.length === 0 ? (
              <p className="text-sm text-gray-400">
                All clients are already members.
              </p>
            ) : (
              <ul className="space-y-2">
                {nonMembers?.map((c) => (
                  <li
                    key={c.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <span>{c.name}</span>
                    <button
                      onClick={async () => {
                        await addMembers.mutateAsync({
                          groupId: group.id,
                          clientIds: [c.id],
                        });
                      }}
                      className="text-xs text-indigo-600 hover:underline"
                    >
                      Add
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function GroupsPage() {
  const { data: groups, isPending } = useGroups();
  const createGroup = useCreateGroup();
  const deleteGroup = useDeleteGroup();
  const [showForm, setShowForm] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const g = await createGroup.mutateAsync({ name, description });
    setShowForm(false);
    setName("");
    setDescription("");
    setSelectedGroupId(g.id);
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Groups</h1>
        <button
          onClick={() => setShowForm(true)}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          + New group
        </button>
      </div>

      {showForm && (
        <div className="mb-6 rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 font-semibold">New group</h2>
          <form onSubmit={handleCreate} className="space-y-3">
            <input
              placeholder="Group name *"
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
                disabled={createGroup.isPending}
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
      ) : groups?.length === 0 ? (
        <p className="text-gray-500">No groups yet.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            {groups?.map((g) => (
              <button
                key={g.id}
                onClick={() => setSelectedGroupId(g.id)}
                className={`w-full rounded-xl border p-4 text-left transition-colors ${
                  selectedGroupId === g.id
                    ? "border-indigo-400 bg-indigo-50"
                    : "border-gray-200 bg-white hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <p className="font-medium text-gray-900">{g.name}</p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Delete group "${g.name}"?`)) {
                        deleteGroup.mutate(g.id);
                        if (selectedGroupId === g.id) setSelectedGroupId(null);
                      }
                    }}
                    className="text-xs text-red-400 hover:text-red-600"
                  >
                    Delete
                  </button>
                </div>
                {g.description && (
                  <p className="mt-1 text-sm text-gray-500">{g.description}</p>
                )}
              </button>
            ))}
          </div>
          <div>
            {selectedGroupId && <GroupDetail groupId={selectedGroupId} />}
          </div>
        </div>
      )}
    </div>
  );
}
