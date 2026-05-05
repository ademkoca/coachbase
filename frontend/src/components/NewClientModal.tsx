import { useState } from "react";
import { useCreateClient } from "../hooks/useClients";

interface NewClientModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (clientId: string) => void;
}

export function NewClientModal({
  open,
  onClose,
  onSuccess,
}: NewClientModalProps) {
  const createClient = useCreateClient();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState("");
  const [status, setStatus] = useState<"ACTIVE" | "INACTIVE">("ACTIVE");
  const [goal, setGoal] = useState("");
  const [injuryNotes, setInjuryNotes] = useState("");
  const [notes, setNotes] = useState("");

  function reset() {
    setName("");
    setEmail("");
    setPhone("");
    setGender("");
    setStatus("ACTIVE");
    setGoal("");
    setInjuryNotes("");
    setNotes("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const client = await createClient.mutateAsync({
      name,
      email: email || undefined,
      phone: phone || undefined,
      gender: gender || undefined,
      status,
      goal: goal || undefined,
      injuryNotes: injuryNotes || undefined,
      notes: notes || undefined,
    });
    reset();
    onClose();
    onSuccess?.(client.id);
  }

  function handleClose() {
    reset();
    onClose();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">New client</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
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
          <div>
            <p className="mb-1.5 text-xs text-gray-500">Status</p>
            <div className="flex gap-4 text-sm">
              {(["ACTIVE", "INACTIVE"] as const).map((s) => (
                <label
                  key={s}
                  className="flex cursor-pointer items-center gap-1.5"
                >
                  <input
                    type="radio"
                    name="status"
                    value={s}
                    checked={status === s}
                    onChange={() => setStatus(s)}
                    className="accent-indigo-600"
                  />
                  {s.charAt(0) + s.slice(1).toLowerCase()}
                </label>
              ))}
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
              onClick={handleClose}
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
