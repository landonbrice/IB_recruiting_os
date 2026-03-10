/**
 * sessionLog.ts
 *
 * Lightweight event log stored in sessionStorage.
 * Used for debugging, session export, and future analytics.
 * All operations are silent — never throws.
 */

const LOG_KEY = "ib_coach_event_log";

export interface SessionEvent {
  type: string;
  ts: number; // epoch ms
  data: Record<string, unknown>;
}

/** Append a typed event to the in-session log. */
export function logEvent(type: string, data: Record<string, unknown>): void {
  try {
    const raw = sessionStorage.getItem(LOG_KEY);
    const events: SessionEvent[] = raw ? (JSON.parse(raw) as SessionEvent[]) : [];
    events.push({ type, ts: Date.now(), data });
    // Cap at 500 events to avoid quota issues
    if (events.length > 500) events.splice(0, events.length - 500);
    sessionStorage.setItem(LOG_KEY, JSON.stringify(events));
  } catch {
    // Storage unavailable or quota exceeded — silently skip
  }
}

/** Read all events from the current session log. */
export function getEvents(): SessionEvent[] {
  try {
    const raw = sessionStorage.getItem(LOG_KEY);
    return raw ? (JSON.parse(raw) as SessionEvent[]) : [];
  } catch {
    return [];
  }
}

/** Clear the event log. */
export function clearEvents(): void {
  try {
    sessionStorage.removeItem(LOG_KEY);
  } catch {/* */}
}

/** Summarize the session for export (score history, mode shifts, edit count). */
export function summarizeSession(): {
  modeShifts: Array<{ from: string; to: string; ts: number }>;
  scoreHistory: Array<{ total: number; ts: number }>;
  totalBulletsApplied: number;
  sessionDurationMs: number;
} {
  const events = getEvents();
  const modeShifts = events
    .filter((e) => e.type === "mode_shift")
    .map((e) => ({
      from: String(e.data.from),
      to: String(e.data.to),
      ts: e.ts,
    }));

  const scoreHistory = events
    .filter((e) => e.type === "score_updated")
    .map((e) => ({ total: Number(e.data.total), ts: e.ts }));

  const totalBulletsApplied = events
    .filter((e) => e.type === "bullets_applied" || e.type === "bullet_applied_manual")
    .reduce((sum, e) => sum + (Number(e.data.count ?? 1)), 0);

  const startEvent = events[0];
  const endEvent = events[events.length - 1];
  const sessionDurationMs =
    startEvent && endEvent ? endEvent.ts - startEvent.ts : 0;

  return { modeShifts, scoreHistory, totalBulletsApplied, sessionDurationMs };
}
