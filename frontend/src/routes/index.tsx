import { createBrowserRouter } from 'react-router-dom'
import ProtectedRoute from './ProtectedRoute'
import AppShell from '../components/layout/AppShell'
import SignInPage from '../pages/SignInPage'
import SignUpPage from '../pages/SignUpPage'
import DashboardPage from '../pages/DashboardPage'
import ClientsPage from '../pages/ClientsPage'
import ClientDetailPage from '../pages/ClientDetailPage'
import ClientProgressPage from '../pages/ClientProgressPage'
import ExercisesPage from '../pages/ExercisesPage'
import WorkoutPlansPage from '../pages/WorkoutPlansPage'
import PlanDetailPage from '../pages/PlanDetailPage'
import SchedulePageRouter from '../pages/SchedulePageRouter'
import SessionsPage from '../pages/SessionsPage'
import SessionLogPage from '../pages/SessionLogPage'
import GroupsPage from '../pages/GroupsPage'
import SettingsPage from '../pages/SettingsPage'

export const router = createBrowserRouter([
  { path: '/sign-in', element: <SignInPage /> },
  { path: '/sign-up', element: <SignUpPage /> },
  {
    element: (
      <ProtectedRoute>
        <AppShell />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'clients', element: <ClientsPage /> },
      { path: 'clients/:id', element: <ClientDetailPage /> },
      { path: 'clients/:id/progress', element: <ClientProgressPage /> },
      { path: 'exercises', element: <ExercisesPage /> },
      { path: 'workout-plans', element: <WorkoutPlansPage /> },
      { path: 'workout-plans/:id', element: <PlanDetailPage /> },
      { path: 'schedule', element: <SchedulePageRouter /> },
      { path: 'sessions', element: <SessionsPage /> },
      { path: 'sessions/:sessionId/log', element: <SessionLogPage /> },
      { path: 'groups', element: <GroupsPage /> },
      { path: 'settings', element: <SettingsPage /> },
    ],
  },
])
