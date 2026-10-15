import { useCallback, useEffect, useState, type ReactNode } from "react";
import { ApiError, getMe, setActiveAccount, type MeResponse } from "../lib/api";
import { activateLocalAccount, PROFILE_SWITCH } from "../lib/accountStorage";
import AuthGate from "./AuthGate";
import { clearVolatileStorage } from "../hooks/useLocalStorage";

export default function SessionBoundary({
  children,
}: {
  children: (me: MeResponse, onSignedOut: () => void) => ReactNode;
}) {
  const [me, setMe] = useState<MeResponse | null>(null);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const restore = useCallback(async () => {
    setChecking(true);
    setError(null);
    setActiveAccount(null);
    clearVolatileStorage();
    try {
      const session = await getMe();
      try {
        activateLocalAccount(session.user.id);
      } catch {
        throw Error(
          "We couldn’t open your saved progress. Please free some browser storage and try again.",
        );
      }
      setActiveAccount(session.user.id);
      setMe(session);
    } catch (e) {
      setActiveAccount(null);
      setMe(null);
      if (!(e instanceof ApiError && e.status === 401))
        setError(
          e instanceof Error
            ? e.message
            : "Could not check your session. Please retry.",
        );
    } finally {
      setChecking(false);
    }
  }, []);
  useEffect(() => {
    void restore();
  }, [restore]);
  useEffect(() => {
    const expire = () => {
      if (!me) return;
      setActiveAccount(null);
      setMe(null);
      setError("Please sign in with Google to continue.");
      setChecking(false);
    };
    const changed = (event: StorageEvent) => {
      if (
        event.key === PROFILE_SWITCH ||
        (event.key === "algocoach-local-owner" &&
          event.newValue !== String(me?.user.id))
      )
        expire();
    };
    window.addEventListener("storage", changed);
    window.addEventListener("algocoach:session-expired", expire);
    return () => {
      window.removeEventListener("storage", changed);
      window.removeEventListener("algocoach:session-expired", expire);
    };
  }, [me?.user.id]);
  if (checking || !me)
    return (
      <AuthGate
        checking={checking}
        error={error}
        onRetry={() => void restore()}
      />
    );
  return children(me, () => {
    setActiveAccount(null);
    clearVolatileStorage();
    setMe(null);
    setError(null);
  });
}
