"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface Notification {
  type: "success" | "error";
  text: string;
}

/**
 * Centralized transient toast state with automatic dismissal.
 * Guarantees timer cleanup on unmount so stale timers never fire.
 */
export function useNotification(defaultDurationMs = 3500) {
  const [notification, setNotification] = useState<Notification | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearNotification = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setNotification(null);
  }, []);

  const notify = useCallback(
    (next: Notification, durationMs?: number) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      setNotification(next);
      timerRef.current = setTimeout(() => {
        setNotification(null);
        timerRef.current = null;
      }, durationMs ?? defaultDurationMs);
    },
    [defaultDurationMs],
  );

  const notifySuccess = useCallback(
    (text: string, durationMs?: number) => notify({ type: "success", text }, durationMs),
    [notify],
  );

  const notifyError = useCallback(
    (text: string, durationMs?: number) => notify({ type: "error", text }, durationMs),
    [notify],
  );

  useEffect(() => clearNotification, [clearNotification]);

  return { notification, notify, notifySuccess, notifyError, clearNotification };
}
