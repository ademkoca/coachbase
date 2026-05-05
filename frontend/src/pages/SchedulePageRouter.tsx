import { lazy, Suspense } from 'react'
import { useScheduleVariant } from '../hooks/useScheduleVariant'

const SchedulePageA = lazy(() => import('./SchedulePage'))
const SchedulePageB = lazy(() => import('./SchedulePageV2'))

export default function SchedulePageRouter() {
  const variant = useScheduleVariant()
  return (
    <Suspense fallback={<div className="p-6 text-gray-500">Loading...</div>}>
      {variant === 'B' ? <SchedulePageB /> : <SchedulePageA />}
    </Suspense>
  )
}
