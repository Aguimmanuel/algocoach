import { useCallback, useRef, useSyncExternalStore } from "react";
import { validStorage } from "../lib/storageValidation";

const volatile = new Map<string, unknown>();
export function clearVolatileStorage() {
  volatile.clear();
}

/** Cross-tab storage with a stable snapshot and no side effects during render. */
export function useLocalStorage<T>(key: string, initial: T) {
  const fallback = useRef(initial);
  const cache = useRef<{ key: string; raw: string | null; value: T }>({
    key,
    raw: null,
    value: initial,
  });
  const read = useCallback((): T => {
    if (volatile.has(key)) return volatile.get(key) as T;
    let raw: string | null = null;
    try {
      raw = localStorage.getItem(key);
    } catch {
      return cache.current.value;
    }
    if (cache.current.key === key && cache.current.raw === raw)
      return cache.current.value;
    let value = fallback.current;
    try {
      if (raw !== null) {
        const parsed: unknown = JSON.parse(raw);
        if (validStorage(key, parsed, fallback.current)) value = parsed as T;
      }
    } catch {
      /* corrupt storage falls back */
    }
    cache.current = { key, raw, value };
    return value;
  }, [key]);
  const subscribe = useCallback(
    (notify: () => void) => {
      const storage = (e: StorageEvent) => {
        if (e.key === key || e.key === null) notify();
      };
      window.addEventListener(`algocoach:${key}`, notify);
      window.addEventListener("storage", storage);
      return () => {
        window.removeEventListener(`algocoach:${key}`, notify);
        window.removeEventListener("storage", storage);
      };
    },
    [key],
  );
  const value = useSyncExternalStore(subscribe, read, () => fallback.current);
  const update = useCallback(
    (next: T | ((prev: T) => T)) => {
      const resolved =
        typeof next === "function" ? (next as (prev: T) => T)(read()) : next;
      const raw = JSON.stringify(resolved);
      try {
        localStorage.setItem(key, raw);
        volatile.delete(key);
      } catch {
        volatile.set(key, resolved);
      }
      cache.current = { key, raw, value: resolved };
      window.dispatchEvent(
        new CustomEvent(`algocoach:${key}`, { detail: resolved }),
      );
    },
    [key, read],
  );
  return [value, update] as const;
}
