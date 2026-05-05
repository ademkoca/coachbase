import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useSessions, useUpdateSession, useDeleteSession } from '../hooks/useSessions'
import { EditSessionModal } from '../components/EditSessionModal'
import type { Session, SessionStatus } from '../types/api'

const STATUS_COLORS: Record<SessionStatus, string> = {
  scheduled: 'bg-indigo-50 text-indigo-700',
  completed: 'bg-green-50 text-green-700',
  cancelled: 'bg-gray-100 text-gray-500',
}

export default function SessionsPage() {
  const { data: sessions, isPending } = useSessions()
  const updateSession = useUpdateSession()
  const deleteSession = useDeleteSession()
  const [editingSession, setEditingSession] = useState<Session | null>(null)

  function markStatus(id: string, status: SessionStatus) {
    updateSession.mutate({ id, status })
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Sessions</h1>

      {isPending ? (
        <p className="text-gray-500">Loading...</p>
      ) : sessions?.length === 0 ? (
        <p className="text-gray-500">No sessions. Create one from the Schedule page.</p>
      ) : (
        <>
          {/* Table — sm and up */}
          <div className="hidden sm:block overflow-hidden rounded-xl bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-100 bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Title</th>
                  <th className="px-4 py-3 text-left font-medium">Date</th>
                  <th className="px-4 py-3 text-left font-medium">Duration</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sessions?.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{s.title}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(s.scheduledAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{s.durationMinutes} min</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[s.status]}`}
                      >
                        {s.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {s.status === 'scheduled' && (
                          <>
                            <Link
                              to={`/sessions/${s.id}/log`}
                              className="rounded-md bg-indigo-600 px-2 py-1 text-xs font-medium text-white hover:bg-indigo-700"
                            >
                              Start
                            </Link>
                            <button
                              onClick={() => markStatus(s.id, 'cancelled')}
                              className="text-xs text-gray-400 hover:underline"
                            >
                              Cancel
                            </button>
                          </>
                        )}
                        {s.status === 'completed' && (
                          <Link
                            to={`/sessions/${s.id}/log`}
                            className="text-xs text-indigo-500 hover:underline"
                          >
                            View log
                          </Link>
                        )}
                        <button
                          onClick={() => setEditingSession(s)}
                          className="text-xs text-indigo-500 hover:underline"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => { if (confirm('Delete session?')) deleteSession.mutate(s.id) }}
                          className="text-xs text-red-400 hover:text-red-600"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Card list — mobile */}
          <ul className="sm:hidden space-y-2">
            {sessions?.map((s) => (
              <li key={s.id} className="rounded-xl bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-medium text-gray-900">{s.title}</p>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[s.status]}`}
                  >
                    {s.status}
                  </span>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  {new Date(s.scheduledAt).toLocaleString()} · {s.durationMinutes} min
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {s.status === 'scheduled' && (
                    <>
                      <Link
                        to={`/sessions/${s.id}/log`}
                        className="rounded-md bg-indigo-600 px-2 py-1 text-xs font-medium text-white hover:bg-indigo-700"
                      >
                        Start
                      </Link>
                      <button
                        onClick={() => markStatus(s.id, 'cancelled')}
                        className="text-xs text-gray-400 hover:underline"
                      >
                        Cancel
                      </button>
                    </>
                  )}
                  {s.status === 'completed' && (
                    <Link
                      to={`/sessions/${s.id}/log`}
                      className="text-xs text-indigo-500 hover:underline"
                    >
                      View log
                    </Link>
                  )}
                  <button
                    onClick={() => setEditingSession(s)}
                    className="text-xs text-indigo-500 hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => { if (confirm('Delete session?')) deleteSession.mutate(s.id) }}
                    className="ml-auto text-xs text-red-400 hover:text-red-600"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      {editingSession && (
        <EditSessionModal
          session={editingSession}
          onClose={() => setEditingSession(null)}
        />
      )}
    </div>
  )
}
