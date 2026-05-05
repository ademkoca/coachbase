import { useState } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import type { DateSelectArg, EventClickArg } from '@fullcalendar/core'
import { useSessions, useDeleteSession } from '../hooks/useSessions'
import { EditSessionModal } from '../components/EditSessionModal'
import { NewSessionModal } from '../components/NewSessionModal'
import type { Session } from '../types/api'

function toLocalDatetime(date: Date): string {
  return (
    `${date.getFullYear()}-` +
    `${String(date.getMonth() + 1).padStart(2, '0')}-` +
    `${String(date.getDate()).padStart(2, '0')}T` +
    `${String(date.getHours()).padStart(2, '0')}:` +
    `${String(date.getMinutes()).padStart(2, '0')}`
  )
}

export default function SchedulePageV2() {
  const { data: sessions } = useSessions()
  const deleteSession = useDeleteSession()

  const [modalOpen, setModalOpen] = useState(false)
  const [pendingScheduledAt, setPendingScheduledAt] = useState('')
  const [pendingStartDate, setPendingStartDate] = useState('')
  const [editingSession, setEditingSession] = useState<Session | null>(null)

  function openModal(start: Date) {
    const localDatetime = toLocalDatetime(start)
    setPendingScheduledAt(localDatetime)
    setPendingStartDate(localDatetime.slice(0, 10))
    setModalOpen(true)
  }

  const events =
    sessions?.map((s) => ({
      id: s.id,
      title: s.title,
      start: new Date(s.scheduledAt),
      end: new Date(new Date(s.scheduledAt).getTime() + s.durationMinutes * 60_000),
      extendedProps: { resource: s },
    })) ?? []

  function handleSelect(arg: DateSelectArg) {
    openModal(arg.start)
  }

  function handleDateClick(arg: { date: Date }) {
    openModal(arg.date)
  }

  function handleEventClick(arg: EventClickArg) {
    setEditingSession(arg.event.extendedProps.resource as Session)
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Schedule</h1>
        <button
          onClick={() => openModal(new Date())}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          + New session
        </button>
      </div>

      <div className="rounded-xl bg-white p-4 shadow-sm">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay',
          }}
          events={events}
          selectable={true}
          select={handleSelect}
          dateClick={handleDateClick}
          eventClick={handleEventClick}
          height={600}
          firstDay={1}
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
