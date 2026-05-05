import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  useSessionLogs,
  useStartSession,
  useEndSession,
  useUpsertSet,
  useAddLogExercise,
  useRemoveLogExercise,
  useUpdateLogNotes,
} from "../hooks/useWorkoutLogs";
import { useExercises } from "../hooks/useExercises";
import type { WorkoutLog } from "../types/api";

const MAX_SETS = 5;

export default function SessionLogPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();

  const startSession = useStartSession();
  const endSession = useEndSession();
  const { data: logs, isPending } = useSessionLogs(sessionId);
  const { data: allExercises } = useExercises();

  const upsertSet = useUpsertSet();
  const addExercise = useAddLogExercise();
  const removeExercise = useRemoveLogExercise();
  const updateNotes = useUpdateLogNotes();

  const [activeLogId, setActiveLogId] = useState<string | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [search, setSearch] = useState("");
  const [hasStarted, setHasStarted] = useState(false);

  // Idempotently start the session on first mount
  useEffect(() => {
    if (!sessionId || hasStarted) return;
    setHasStarted(true);
    startSession.mutate(sessionId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  const activeLog: WorkoutLog | undefined = useMemo(() => {
    if (!logs || logs.length === 0) return undefined;
    return logs.find((l) => l.id === activeLogId) ?? logs[0];
  }, [logs, activeLogId]);

  const isReadOnly = !!activeLog?.endedAt;
  const allEnded = !!logs && logs.length > 0 && logs.every((l) => l.endedAt);

  const filteredExercises = useMemo(() => {
    if (!allExercises || !activeLog) return [];
    const existingIds = new Set(activeLog.exercises.map((e) => e.exerciseId));
    return allExercises.filter(
      (ex) =>
        ex.name.toLowerCase().includes(search.toLowerCase()) &&
        !existingIds.has(ex.id),
    );
  }, [allExercises, activeLog, search]);

  async function handleEnd() {
    if (!sessionId) return;
    if (!confirm("End the session? Sets will be saved and PRs evaluated."))
      return;
    const ended = await endSession.mutateAsync(sessionId);
    const prCount = ended.reduce(
      (n, l) =>
        n +
        l.exercises.reduce(
          (m, e) => m + e.sets.filter((s) => s.wasPersonalRecord).length,
          0,
        ),
      0,
    );
    if (prCount > 0)
      alert(`🏆 ${prCount} new personal record${prCount > 1 ? "s" : ""}!`);
    navigate("/sessions");
  }

  if (isPending || !logs) {
    return <p className="text-gray-500">Loading...</p>;
  }

  if (logs.length === 0) {
    return (
      <div>
        <p className="text-gray-500">
          No clients are attached to this session. Add at least one client
          first.
        </p>
        <Link
          to="/sessions"
          className="mt-3 inline-block text-sm text-indigo-600 hover:underline"
        >
          ← Back to sessions
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to="/sessions"
            className="text-sm text-gray-400 hover:text-gray-600"
          >
            ← Sessions
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">
            {isReadOnly ? "Workout log" : "Session in progress"}
          </h1>
          {activeLog?.startedAt && (
            <span className="text-sm text-gray-400">
              Started {new Date(activeLog.startedAt).toLocaleTimeString()}
              {activeLog.durationMinutes != null &&
                ` · ${activeLog.durationMinutes} min`}
            </span>
          )}
        </div>
        {!allEnded && (
          <button
            onClick={handleEnd}
            disabled={endSession.isPending}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
          >
            {endSession.isPending ? "Ending…" : "End session"}
          </button>
        )}
      </div>

      {logs.length > 1 && (
        <div className="mb-4 flex gap-2 border-b border-gray-200">
          {logs.map((log) => (
            <button
              key={log.id}
              onClick={() => setActiveLogId(log.id)}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                (activeLogId ?? logs[0].id) === log.id
                  ? "border-b-2 border-indigo-600 text-indigo-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {log.clientName}
              {log.endedAt && (
                <span className="ml-1 text-xs text-green-600">✓</span>
              )}
            </button>
          ))}
        </div>
      )}

      {activeLog && (
        <div className="space-y-4">
          {activeLog.exercises.length === 0 ? (
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <p className="mb-3 text-sm text-gray-400">No exercises yet.</p>
            </div>
          ) : (
            activeLog.exercises.map((ex) => (
              <ExerciseCard
                key={ex.id}
                logId={activeLog.id}
                sessionId={sessionId!}
                exercise={ex}
                readOnly={isReadOnly}
                onUpsertSet={(setNumber, reps, weightKg) =>
                  upsertSet.mutate({
                    sessionId: sessionId!,
                    logId: activeLog.id,
                    logExerciseId: ex.id,
                    setNumber,
                    reps,
                    weightKg,
                  })
                }
                onRemove={() =>
                  removeExercise.mutate({
                    sessionId: sessionId!,
                    logId: activeLog.id,
                    logExerciseId: ex.id,
                  })
                }
              />
            ))
          )}

          <NotesPanel
            key={activeLog.id}
            logId={activeLog.id}
            sessionId={sessionId!}
            initialNotes={activeLog.notes ?? ""}
            readOnly={isReadOnly}
            onSave={(notes) =>
              updateNotes.mutate({
                sessionId: sessionId!,
                logId: activeLog.id,
                notes,
              })
            }
          />

          {!isReadOnly && (
            <button
              onClick={() => setShowPicker(true)}
              className="rounded-lg border border-indigo-300 px-3 py-1.5 text-sm text-indigo-600 hover:bg-indigo-50"
            >
              + Add exercise
            </button>
          )}
        </div>
      )}

      {showPicker && activeLog && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center">
          <div className="w-full max-w-md rounded-t-2xl bg-white p-6 shadow-xl sm:rounded-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold">Add exercise</h3>
              <button
                onClick={() => setShowPicker(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <input
              autoFocus
              placeholder="Search exercises..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="mb-3 w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-indigo-500 focus:outline-none"
            />
            <div className="max-h-64 space-y-1 overflow-y-auto">
              {filteredExercises.map((ex) => (
                <button
                  key={ex.id}
                  onClick={() => {
                    addExercise.mutate({
                      sessionId: sessionId!,
                      logId: activeLog.id,
                      exerciseId: ex.id,
                    });
                    setShowPicker(false);
                    setSearch("");
                  }}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm hover:bg-gray-50"
                >
                  <span>{ex.name}</span>
                  <span className="text-xs capitalize text-gray-400">
                    {ex.muscleGroup}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface ExerciseCardProps {
  logId: string;
  sessionId: string;
  exercise: WorkoutLog["exercises"][number];
  readOnly: boolean;
  onUpsertSet: (
    setNumber: number,
    reps: number | null,
    weightKg: number | null,
  ) => void;
  onRemove: () => void;
}

function ExerciseCard({
  exercise,
  readOnly,
  onUpsertSet,
  onRemove,
}: ExerciseCardProps) {
  const setsByNumber = new Map(exercise.sets.map((s) => [s.setNumber, s]));
  const filledCount = exercise.sets.length;
  const [visibleSets, setVisibleSets] = useState(Math.max(1, filledCount));

  return (
    <div className="rounded-xl bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">{exercise.exerciseName}</h3>
        {!readOnly && (
          <button
            onClick={() => {
              if (confirm(`Remove "${exercise.exerciseName}" from this log?`))
                onRemove();
            }}
            className="text-xs text-red-400 hover:text-red-600"
          >
            Remove
          </button>
        )}
      </div>

      <div className="space-y-2">
        <div className="grid grid-cols-[40px_1fr_1fr_24px] items-center gap-2 text-xs text-gray-500">
          <span>Set</span>
          <span>Reps</span>
          <span>Weight (kg)</span>
          <span />
        </div>
        {Array.from({ length: visibleSets }, (_, i) => i + 1).map(
          (setNumber) => {
            const existing = setsByNumber.get(setNumber);
            return (
              <SetRow
                key={setNumber}
                setNumber={setNumber}
                initialReps={existing?.reps ?? null}
                initialWeight={existing?.weightKg ?? null}
                wasPR={!!existing?.wasPersonalRecord}
                readOnly={readOnly}
                onChange={(reps, weightKg) =>
                  onUpsertSet(setNumber, reps, weightKg)
                }
              />
            );
          },
        )}
      </div>

      {!readOnly && visibleSets < MAX_SETS && (
        <button
          onClick={() => setVisibleSets((v) => Math.min(MAX_SETS, v + 1))}
          className="mt-3 text-xs text-indigo-600 hover:underline"
        >
          + Add set
        </button>
      )}
    </div>
  );
}

interface NotesPanelProps {
  logId: string;
  sessionId: string;
  initialNotes: string;
  readOnly: boolean;
  onSave: (notes: string | null) => void;
}

function NotesPanel({ initialNotes, readOnly, onSave }: NotesPanelProps) {
  const [notes, setNotes] = useState(initialNotes);

  function commit() {
    const trimmed = notes.trim();
    const initialTrimmed = initialNotes.trim();
    if (trimmed === initialTrimmed) return;
    onSave(trimmed === "" ? null : trimmed);
  }

  if (readOnly && !notes) return null;

  return (
    <div className="rounded-xl bg-white p-5 shadow-sm">
      <label className="mb-2 block text-sm font-semibold text-gray-800">
        Notes
      </label>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        onBlur={commit}
        readOnly={readOnly}
        rows={3}
        placeholder="How did the session go?"
        className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-indigo-500 focus:outline-none read-only:bg-gray-50"
      />
    </div>
  );
}

interface SetRowProps {
  setNumber: number;
  initialReps: number | null;
  initialWeight: string | null;
  wasPR: boolean;
  readOnly: boolean;
  onChange: (reps: number | null, weightKg: number | null) => void;
}

function SetRow({
  setNumber,
  initialReps,
  initialWeight,
  wasPR,
  readOnly,
  onChange,
}: SetRowProps) {
  const [reps, setReps] = useState<string>(
    initialReps == null ? "" : String(initialReps),
  );
  const [weight, setWeight] = useState<string>(initialWeight ?? "");

  function commit() {
    const r = reps === "" ? null : Number(reps);
    const w = weight === "" ? null : Number(weight);
    if (
      r === initialReps &&
      w === (initialWeight == null ? null : Number(initialWeight))
    )
      return;
    onChange(r, w);
  }

  return (
    <div className="grid grid-cols-[40px_1fr_1fr_24px] items-center gap-2">
      <span className="text-sm font-medium text-gray-700">{setNumber}</span>
      <input
        type="number"
        min={0}
        value={reps}
        onChange={(e) => setReps(e.target.value)}
        onBlur={commit}
        readOnly={readOnly}
        placeholder="–"
        className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-base focus:border-indigo-500 focus:outline-none disabled:bg-gray-50 read-only:bg-gray-50"
      />
      <input
        type="number"
        min={0}
        step={0.5}
        value={weight}
        onChange={(e) => setWeight(e.target.value)}
        onBlur={commit}
        readOnly={readOnly}
        placeholder="–"
        className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-base focus:border-indigo-500 focus:outline-none read-only:bg-gray-50"
      />
      <span title={wasPR ? "Personal record!" : ""}>
        {wasPR ? <span className="text-yellow-500">🏆</span> : null}
      </span>
    </div>
  );
}
