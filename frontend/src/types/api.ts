export interface Trainer {
  id: string
  email: string
  displayName?: string
  phone?: string
  bio?: string
  weightUnit?: 'kg' | 'lbs'
  measurementUnit?: 'cm' | 'in'
  feePerSession?: string
  feeMonthly?: string
  feeHalfYearly?: string
  feeYearly?: string
  staleClientThresholdDays: number
  createdAt: string
}

export interface StaleClient {
  id: string
  name: string
  lastSessionAt: string | null
  daysSinceLastSession: number | null
}

export type BillingType = 'per_session' | 'monthly' | 'half_yearly' | 'yearly'

export interface Payment {
  id: string
  trainerId: string
  clientId: string
  billingType: BillingType
  amount: string
  sessionsIncluded: number | null
  periodStart: string
  periodEnd: string
  status: 'paid' | 'pending'
  notes: string | null
  createdAt: string
}

export interface Client {
  id: string
  trainerId: string
  name: string
  email?: string
  phone?: string
  notes?: string
  gender?: string
  goal?: string
  injuryNotes?: string
  avatarUrl?: string
  status?: 'ACTIVE' | 'INACTIVE'
  createdAt: string
  updatedAt: string
}

export interface Exercise {
  id: string
  trainerId?: string
  name: string
  muscleGroup: string
  category: string
  description?: string
  createdAt: string
}

export interface PlanExercise {
  id: string
  position: number
  sets?: number
  reps?: number
  durationSeconds?: number
  restSeconds?: number
  notes?: string
  exercise: Exercise
}

export interface WorkoutPlan {
  id: string
  trainerId: string
  name: string
  description?: string
  exerciseNames: string[]
  createdAt: string
  updatedAt: string
}

export interface WorkoutPlanDetail extends WorkoutPlan {
  exercises: PlanExercise[]
}

export interface Group {
  id: string
  trainerId: string
  name: string
  description?: string
  createdAt: string
}

export interface GroupDetail extends Group {
  members: Client[]
}

export type SessionStatus = 'scheduled' | 'completed' | 'cancelled'

export interface Session {
  id: string
  trainerId: string
  workoutPlanId?: string
  groupId?: string
  title: string
  scheduledAt: string
  durationMinutes: number
  location?: string
  notes?: string
  status: SessionStatus
  createdAt: string
  updatedAt: string
  clientNames: string[]
  groupName: string | null
}

export interface SessionDetail extends Session {
  clients: Client[]
  group?: Group
}

export interface WorkoutLogSet {
  id: string
  logExerciseId: string
  setNumber: number
  reps: number | null
  weightKg: string | null
  wasPersonalRecord: boolean
}

export interface WorkoutLogExercise {
  id: string
  exerciseId: string
  exerciseName: string
  position: number
  sets: WorkoutLogSet[]
}

export interface WorkoutLog {
  id: string
  sessionId: string
  clientId: string
  trainerId: string
  startedAt: string
  endedAt: string | null
  durationMinutes: number | null
  notes: string | null
  createdAt: string
  clientName: string
  exercises: WorkoutLogExercise[]
}

export interface WorkoutLogSummary {
  id: string
  sessionId: string
  sessionTitle: string
  startedAt: string
  endedAt: string | null
  durationMinutes: number | null
  exerciseCount: number
}

export interface PersonalRecord {
  id: string
  exerciseId: string
  exerciseName: string
  weightKg: string
  reps: number
  achievedAt: string
}

export interface ProgressPhoto {
  id: string
  entryId: string
  view: 'front' | 'side'
  storageUrl: string
  uploadedAt: string
}

export interface ProgressEntry {
  id: string
  clientId: string
  trainerId: string
  measuredAt: string
  weightKg?: string
  bicepCm?: string
  shouldersCm?: string
  chestCm?: string
  waistCm?: string
  buttCm?: string
  thighCm?: string
  notes?: string
  createdAt: string
  photos: ProgressPhoto[]
}
