import {
  pgTable,
  text,
  uuid,
  timestamp,
  date,
  integer,
  numeric,
  boolean,
  primaryKey,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core'

export const trainers = pgTable('trainers', {
  id: text('id').primaryKey(), // Firebase UID
  email: text('email').notNull().unique(),
  displayName: text('display_name'),
  phone: text('phone'),
  bio: text('bio'),
  weightUnit: text('weight_unit').default('kg'),
  measurementUnit: text('measurement_unit').default('cm'),
  feePerSession: numeric('fee_per_session', { precision: 10, scale: 2 }),
  feeMonthly: numeric('fee_monthly', { precision: 10, scale: 2 }),
  feeHalfYearly: numeric('fee_half_yearly', { precision: 10, scale: 2 }),
  feeYearly: numeric('fee_yearly', { precision: 10, scale: 2 }),
  staleClientThresholdDays: integer('stale_client_threshold_days').notNull().default(14),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const clients = pgTable('clients', {
  id: uuid('id').primaryKey().defaultRandom(),
  trainerId: text('trainer_id')
    .notNull()
    .references(() => trainers.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  email: text('email'),
  phone: text('phone'),
  notes: text('notes'),
  gender: text('gender'),
  goal: text('goal'),
  injuryNotes: text('injury_notes'),
  avatarUrl: text('avatar_url'),
  status: text('status').notNull().default('ACTIVE'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const exercises = pgTable(
  'exercises',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    trainerId: text('trainer_id').references(() => trainers.id, { onDelete: 'cascade' }), // NULL = global
    name: text('name').notNull(),
    muscleGroup: text('muscle_group').notNull(),
    category: text('category').notNull(),
    description: text('description'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('exercises_trainer_name_uidx').on(t.trainerId, t.name)]
)

export const workoutPlans = pgTable('workout_plans', {
  id: uuid('id').primaryKey().defaultRandom(),
  trainerId: text('trainer_id')
    .notNull()
    .references(() => trainers.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const planExercises = pgTable(
  'plan_exercises',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    planId: uuid('plan_id')
      .notNull()
      .references(() => workoutPlans.id, { onDelete: 'cascade' }),
    exerciseId: uuid('exercise_id')
      .notNull()
      .references(() => exercises.id),
    position: integer('position').notNull().default(0),
    sets: integer('sets'),
    reps: integer('reps'),
    durationSeconds: integer('duration_seconds'),
    restSeconds: integer('rest_seconds'),
    notes: text('notes'),
  },
  (t) => [index('plan_exercises_plan_idx').on(t.planId, t.position)]
)

export const groups = pgTable('groups', {
  id: uuid('id').primaryKey().defaultRandom(),
  trainerId: text('trainer_id')
    .notNull()
    .references(() => trainers.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const groupMembers = pgTable(
  'group_members',
  {
    groupId: uuid('group_id')
      .notNull()
      .references(() => groups.id, { onDelete: 'cascade' }),
    clientId: uuid('client_id')
      .notNull()
      .references(() => clients.id, { onDelete: 'cascade' }),
    joinedAt: timestamp('joined_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.groupId, t.clientId] })]
)

export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  trainerId: text('trainer_id')
    .notNull()
    .references(() => trainers.id, { onDelete: 'cascade' }),
  workoutPlanId: uuid('workout_plan_id').references(() => workoutPlans.id, {
    onDelete: 'set null',
  }),
  groupId: uuid('group_id').references(() => groups.id, { onDelete: 'set null' }), // NULL = 1-on-1
  title: text('title').notNull(),
  scheduledAt: timestamp('scheduled_at', { withTimezone: true }).notNull(),
  durationMinutes: integer('duration_minutes').notNull().default(60),
  location: text('location'),
  notes: text('notes'),
  status: text('status').notNull().default('scheduled'), // scheduled | completed | cancelled
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const sessionClients = pgTable(
  'session_clients',
  {
    sessionId: uuid('session_id')
      .notNull()
      .references(() => sessions.id, { onDelete: 'cascade' }),
    clientId: uuid('client_id')
      .notNull()
      .references(() => clients.id, { onDelete: 'cascade' }),
  },
  (t) => [primaryKey({ columns: [t.sessionId, t.clientId] })]
)

export const progressEntries = pgTable('progress_entries', {
  id: uuid('id').primaryKey().defaultRandom(),
  clientId: uuid('client_id')
    .notNull()
    .references(() => clients.id, { onDelete: 'cascade' }),
  trainerId: text('trainer_id')
    .notNull()
    .references(() => trainers.id, { onDelete: 'cascade' }),
  measuredAt: timestamp('measured_at', { withTimezone: true }).notNull(),
  weightKg: numeric('weight_kg', { precision: 5, scale: 2 }),
  bicepCm: numeric('bicep_cm', { precision: 5, scale: 1 }),
  shouldersCm: numeric('shoulders_cm', { precision: 5, scale: 1 }),
  chestCm: numeric('chest_cm', { precision: 5, scale: 1 }),
  waistCm: numeric('waist_cm', { precision: 5, scale: 1 }),
  buttCm: numeric('butt_cm', { precision: 5, scale: 1 }),
  thighCm: numeric('thigh_cm', { precision: 5, scale: 1 }),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const progressPhotos = pgTable('progress_photos', {
  id: uuid('id').primaryKey().defaultRandom(),
  entryId: uuid('entry_id')
    .notNull()
    .references(() => progressEntries.id, { onDelete: 'cascade' }),
  view: text('view').notNull(), // 'front' | 'side'
  storageUrl: text('storage_url').notNull(),
  uploadedAt: timestamp('uploaded_at', { withTimezone: true }).notNull().defaultNow(),
})

export const workoutLogs = pgTable(
  'workout_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    sessionId: uuid('session_id')
      .notNull()
      .references(() => sessions.id, { onDelete: 'cascade' }),
    clientId: uuid('client_id')
      .notNull()
      .references(() => clients.id, { onDelete: 'cascade' }),
    trainerId: text('trainer_id')
      .notNull()
      .references(() => trainers.id, { onDelete: 'cascade' }),
    startedAt: timestamp('started_at', { withTimezone: true }).notNull(),
    endedAt: timestamp('ended_at', { withTimezone: true }),
    durationMinutes: integer('duration_minutes'),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('workout_logs_session_client_uidx').on(t.sessionId, t.clientId)]
)

export const workoutLogExercises = pgTable(
  'workout_log_exercises',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    logId: uuid('log_id')
      .notNull()
      .references(() => workoutLogs.id, { onDelete: 'cascade' }),
    exerciseId: uuid('exercise_id')
      .notNull()
      .references(() => exercises.id),
    position: integer('position').notNull().default(0),
  },
  (t) => [index('workout_log_exercises_log_idx').on(t.logId, t.position)]
)

export const workoutLogSets = pgTable(
  'workout_log_sets',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    logExerciseId: uuid('log_exercise_id')
      .notNull()
      .references(() => workoutLogExercises.id, { onDelete: 'cascade' }),
    setNumber: integer('set_number').notNull(),
    reps: integer('reps'),
    weightKg: numeric('weight_kg', { precision: 8, scale: 2 }),
    wasPersonalRecord: boolean('was_personal_record').notNull().default(false),
  },
  (t) => [uniqueIndex('workout_log_sets_le_setnum_uidx').on(t.logExerciseId, t.setNumber)]
)

export const personalRecords = pgTable(
  'personal_records',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    clientId: uuid('client_id')
      .notNull()
      .references(() => clients.id, { onDelete: 'cascade' }),
    exerciseId: uuid('exercise_id')
      .notNull()
      .references(() => exercises.id),
    trainerId: text('trainer_id')
      .notNull()
      .references(() => trainers.id, { onDelete: 'cascade' }),
    weightKg: numeric('weight_kg', { precision: 8, scale: 2 }).notNull(),
    reps: integer('reps').notNull(),
    achievedAt: timestamp('achieved_at', { withTimezone: true }).notNull().defaultNow(),
    logSetId: uuid('log_set_id').references(() => workoutLogSets.id, { onDelete: 'set null' }),
  },
  (t) => [uniqueIndex('personal_records_client_exercise_uidx').on(t.clientId, t.exerciseId)]
)

// billing_type: 'per_session' | 'monthly' | 'half_yearly' | 'yearly'
// status: 'paid' | 'pending'
export const payments = pgTable('payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  trainerId: text('trainer_id')
    .notNull()
    .references(() => trainers.id, { onDelete: 'cascade' }),
  clientId: uuid('client_id')
    .notNull()
    .references(() => clients.id, { onDelete: 'cascade' }),
  billingType: text('billing_type').notNull(),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  sessionsIncluded: integer('sessions_included'), // only for per_session
  periodStart: date('period_start').notNull(),
  periodEnd: date('period_end').notNull(),
  status: text('status').notNull().default('paid'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})
