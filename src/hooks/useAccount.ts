import { useCallback, useEffect, useRef, useState } from "react";
import {
  getMe,
  logEvent,
  putProgress,
  putLearning,
  signOut as apiSignOut,
  type MeResponse,
  type ProgressState,
} from "../lib/api";
import { archiveLocalAccount } from "../lib/accountStorage";

/** SessionBoundary verifies Google identity and selects the local profile before
 * this hook mounts. No passwords, Google tokens or app JWTs live in JavaScript.
 */
export function useAccount(
  localProgress: ProgressState,
  initialMe: MeResponse,
  onSignedOut: () => void,
) {
  const [user, setUser] = useState(initialMe.user);
  const [streak, setStreak] = useState(initialMe.streak);
  const [today, setToday] = useState(initialMe.today);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const localRef = useRef(localProgress);
  localRef.current = localProgress;
  const remember = (me: MeResponse) => {
    setUser(me.user);
    setStreak(me.streak);
    setToday(me.today);
  };

  useEffect(() => {
    const merged = { ...localRef.current };
    for (const field of ["learned", "solved", "shaky"] as const) {
      const key = `algocoach-${field}`;
      const value = [
        ...new Set([...localRef.current[field], ...initialMe.progress[field]]),
      ];
      merged[field] = value;
      try {
        localStorage.setItem(key, JSON.stringify(value));
        window.dispatchEvent(
          new CustomEvent(`algocoach:${key}`, { detail: value }),
        );
      } catch {
        /* session still works without storage */
      }
    }
    void putProgress(merged).catch(() => {});
  }, []);

  const signOut = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      // Best-effort final save before ending the authenticated session.
      const saves: Promise<unknown>[] = [putProgress(localRef.current)];
      try {
        const learning = JSON.parse(
          localStorage.getItem("algocoach-learning") || "{}",
        );
        saves.push(putLearning(learning));
      } catch {
        /* no stored lesson data */
      }
      await Promise.allSettled(saves);
      await apiSignOut(user.id);
      try {
        archiveLocalAccount(undefined, user.id);
      } catch {
        /* boundary will fail closed if another account cannot be isolated */
      }
      onSignedOut();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Could not sign out. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }, [onSignedOut]);

  const firstRun = useRef(true);
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    const timer = setTimeout(() => {
      putProgress(localProgress)
        .then(() => getMe().then(remember))
        .catch(() => {});
    }, 1200);
    return () => clearTimeout(timer);
  }, [user.id, localProgress]);

  return {
    user,
    streak,
    today,
    busy,
    error,
    signOut,
    clearError: () => setError(null),
    track: logEvent,
  };
}
