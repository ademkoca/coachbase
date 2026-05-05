import { useState } from 'react'
import { Calendar, dateFnsLocalizer, type View } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import { enUS } from 'date-fns/locale/en-US'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import { useSessions, useDeleteSession } from '../hooks/useSessions'
import { EditSessionModal } from '../components/EditSessionModal'
import { NewSessionModal } from '../components/NewSessionModal'
import type { Session } from '../types/api'

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales: { 'en-US': enUS },
})

interface SlotInfo {
  start: Date
  end: Date
}

export default function SchedulePage() {
  const { data: sessions } = useSessions()
  const deleteSession = useDeleteSession()

  const [calDate, setCalDate] = useState(new Date())
  const [calView, setCalView] = useState<View>('month')
  const [modalOpen, setModalOpen] = useState(false)
  const [pendingScheduledAt, setPendingScheduledAt] = useState('')
  const [pendingStartDate, setPendingStartDate] = useState('')
  const [editingSession, setEditingSession] = useState<Session | null>(null)

  function openModal(slot?: SlotInfo) {
    const base = new Date(slot?.start ?? new Date())
    const localDatetime = `${base.getFullYear()}-${String(base.getMonth() + 1).padStart(2, '0')}-${String(base.getDate()).padStart(2, '0')}T${String(base.getHours()).padStart(2, '0')}:${String(base.getMinutes()).padStart(2, '0')}`
    setPendingScheduledAt(localDatetime)
    setPendingStartDate(localDatetime.slice(0, 10))
    setModalOpen(true)
  }

  const events = sessions?.map((s) => ({
    id: s.id,
    title: s.title,
    start: new Date(s.scheduledAt),
    end: new Date(new Date(s.scheduledAt).getTime() + s.durationMinutes * 60000),
    resource: s,
  }))

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Schedule</h1>
        <button
          onClick={() => openModal()}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          + New session
        </button>
      </div>

      <div className="rounded-xl bg-white p-4 shadow-sm" style={{ height: 600 }}>
        <Calendar
          localizer={localizer}
          events={events ?? []}
          startAccessor="start"
          endAccessor="end"
          selectable
          date={calDate}
          view={calView}
          onNavigate={setCalDate}
          onView={setCalView}
          onSelectSlot={openModal}
          onSelectEvent={(event) => {
            setEditingSession(event.resource as Session)
          }}
          style={{ height: '100%' }}
        />
      </div>

      {editingSession && (
        <EditSessionModal
          session={editingSession}
          onClose={() => setEditingSession(null)}
          onDelete={() => {
            deleteSession.mutate(editingSession.id)
            setEditingSession(null)
          }}
        />
      )}

      <NewSessionModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        initialScheduledAt={pendingScheduledAt}
        initialStartDate={pendingStartDate}
      />
    </div>
  )
}
