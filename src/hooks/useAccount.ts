import { useCallback, useEffect, useRef, useState } from "react";
import {
  getMe,
  getToken,
  logEvent,
  putProgress,
  setToken as persistToken,
  signIn as apiSignIn,
  signUp as apiSignUp,
  type AccountUser,
  type MeResponse,
  type ProgressState,
  type StreakInfo,
  type TodayInfo,
} from "../lib/api";

/**
 * The account, and the bridge between local progress and the server.
 *
 * Three rules, all to keep a signed-out learner from ever noticing this exists:
 *
 *  1. Nothing loads or blocks on the network. Progress renders from localStorage
 *     immediately; the server catches up in the background.
 *  2. Signing in MERGES. Whatever was on the device is kept, then pushed up.
 *     Nobody loses their streak by creating an account.
 *  3. Every failure is silent. Sync is a convenience, never a dependency.
 */
export function useAccount(localProgress: ProgressState) {
  const [user, setUser] = useState<AccountUser | null>(null);
  const [streak, setStreak] = useState<StreakInfo>({ current: 0, longest: 0 });
  const [today, setToday] = useState<TodayInfo>({ count: 0, goal: 3, met: false });
  const [checking, setChecking] = useState(() => !!getToken());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Keep the latest local progress reachable from callbacks without making
  // every function depend on it (which would re-create them on every tick).
  const localRef = useRef(localProgress);
  localRef.current = localProgress;

  const remember = (me: MeResponse) => {
    setUser(me.user);
    setStreak(me.streak);
    setToday(me.today);
  };

  /** Restore a session on load, if a token is present. */
  useEffect(() => {
    if (!getToken()) return;
    let alive = true;
    getMe()
      .then((me) => {
        if (!alive) return;
        remember(me);
        // The server is the source of truth once signed in, so pull its progress
        // into the local store on next local write rather than clobbering now.
      })
      .catch(() => {
        // Expired or invalid token — drop it quietly and carry on signed out.
        persistToken(null);
      })
      .finally(() => alive && setChecking(false));
    return () => {
      alive = false;
    };
  }, []);

  const signUp = useCallback(
    async (email: string, password: string, displayName: string) => {
      setBusy(true);
      setError(null);
      try {
        // Carry the device's progress into the new account.
        const { token, user: u } = await apiSignUp({
          email,
          password,
          display_name: displayName,
          learned: localRef.current.learned,
          solved: localRef.current.solved,
          shaky: localRef.current.shaky,
        });
        persistToken(token);
        setUser(u);
        const me = await getMe();
        remember(me);
        return true;
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not create that account.");
        return false;
      } finally {
        setBusy(false);
        setChecking(false);
      }
    },
    [],
  );

  const signIn = useCallback(async (email: string, password: string) => {
    setBusy(true);
    setError(null);
    try {
      const { token, user: u } = await apiSignIn({ email, password });
      persistToken(token);
      setUser(u);
      const me = await getMe();
      remember(me);
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not sign you in.");
      return false;
    } finally {
      setBusy(false);
      setChecking(false);
    }
  }, []);

  const signOut = useCallback(() => {
    persistToken(null);
    setUser(null);
    setStreak({ current: 0, longest: 0 });
    // Local progress is deliberately left alone — signing out must not erase
    // anything the learner did.
  }, []);

  /** Push progress after it changes, coalesced so a burst is one request. */
  const pushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firstRun = useRef(true);

  useEffect(() => {
    if (!user) return;
    // Skip the run immediately after sign-in: that state already came from the
    // server, and echoing it straight back would log phantom activity events.
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    if (pushTimer.current) clearTimeout(pushTimer.current);
    pushTimer.current = setTimeout(() => {
      putProgress(localProgress)
        .then(() => getMe().then(remember))
        .catch(() => {
          /* offline: the local copy is still correct */
        });
    }, 1200);
    return () => {
      if (pushTimer.current) clearTimeout(pushTimer.current);
    };
  }, [user, localProgress]);

  // Reset the guard when the account changes, so a second sign-in also skips.
  useEffect(() => {
    if (!user) firstRun.current = true;
  }, [user]);

  return {
    user,
    streak,
    today,
    checking,
    busy,
    error,
    signUp,
    signIn,
    signOut,
    clearError: () => setError(null),
    /** record an activity event for the signed-in learner */
    track: logEvent,
  };
}
