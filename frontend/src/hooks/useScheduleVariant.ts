import { useMemo } from "react";

export type ScheduleVariant = "A" | "B";

const STORAGE_KEY = "schedule_ab_variant";
// Force variant in browser console: localStorage.setItem('schedule_ab_variant', 'B') + refresh
// Reset: localStorage.removeItem('schedule_ab_variant') + refresh

export function useScheduleVariant(): ScheduleVariant {
  return useMemo(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "A" || stored === "B") return stored;
      const assigned: ScheduleVariant = Math.random() < 0.5 ? "A" : "B";
      localStorage.setItem(STORAGE_KEY, assigned);
      return assigned;
    } catch {
      return "A";
    }
  }, []);
}
