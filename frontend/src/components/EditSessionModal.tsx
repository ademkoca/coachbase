import { useState } from "react";
import { Link } from "react-router-dom";
import { useUpdateSession } from "../hooks/useSessions";
import type { Session, SessionStatus } from "../types/api";

function toLocalDatetimeValue(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

interface EditModalProps {
  session: Session;
  onClose: () => void;
  onDelete?: () => void;
}

export function EditSessionModal({
  session,
  onClose,
  onDelete,
}: EditModalProps) {
  const updateSession = useUpdateSession();
  const [title, setTitle] = useState(session.title);
  const [scheduledAt, setScheduledAt] = useState(
    toLocalDatetimeValue(session.scheduledAt),
  );
  const [durationMinutes, setDurationMinutes] = useState(
    String(session.durationMinutes),
  );
  const [location, setLocation] = useState(session.location ?? "");
  const [notes, setNotes] = useState(session.notes ?? "");
  const [status, setStatus] = useState<SessionStatus>(session.status);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await updateSession.mutateAsync({
      id: session.id,
      title,
      scheduledAt,
      durationMinutes: Number(durationMinutes) || 60,
      location: location || undefined,
      notes: notes || undefined,
      status,
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Edit session</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="mb-1 block text-xs text-gray-500">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-indigo-500 focus:outline-none"
            />
          </div>
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
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-indigo-500 focus:outline-none"
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
            <label className="mb-1 block text-xs text-gray-500">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as SessionStatus)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            >
              <option value="scheduled">Scheduled</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-500">Location</label>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Optional"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-500">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Optional"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-indigo-500 focus:outline-none resize-none"
            />
          </div>
          {session.status === "scheduled" && (
            <Link
              to={`/sessions/${session.id}/log`}
              onClick={onClose}
              className="block w-full rounded-lg bg-green-600 py-2 text-center text-sm font-medium text-white hover:bg-green-700"
            >
              ▶ Start session
            </Link>
          )}
          {session.status === "completed" && (
            <Link
              to={`/sessions/${session.id}/log`}
              onClick={onClose}
              className="block w-full rounded-lg border border-indigo-300 py-2 text-center text-sm font-medium text-indigo-600 hover:bg-indigo-50"
            >
              View workout log
            </Link>
          )}
          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={updateSession.isPending}
              className="flex-1 rounded-lg bg-indigo-600 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {updateSession.isPending ? "Saving..." : "Save changes"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
          {onDelete && (
            <div className="border-t border-gray-100 pt-3">
              <button
                type="button"
                onClick={onDelete}
                className="w-full rounded-lg py-2 text-sm text-red-600 hover:bg-red-50"
              >
                Delete session
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
