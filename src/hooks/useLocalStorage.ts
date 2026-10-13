import { useCallback, useEffect, useState } from "react";

/**
 * localStorage-backed state that stays in sync across components.
 *
 * Two places read the same key at once — the header shows overall progress and
 * the lesson page ticks off individual problems — so a write in one must show
 * up in the other without a reload. A custom event carries the new value, which
 * keeps this to a few lines instead of pulling in a state library.
 *
 * This is also the state that will move to the server when accounts land, so it
 * stays a plain JSON value with no component-specific shape.
 */
export function useLocalStorage<T>(key: string, initial: T) {
  const read = useCallback((): T => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : initial;
    } catch {
      return initial;
    }
    // `initial` is intentionally not a dependency — it is a fallback, not state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const [value, setValue] = useState<T>(read);

  useEffect(() => {
    // Another component in this tab changed the same key.
    const onLocal = (e: Event) => {
      const detail = (e as CustomEvent<T>).detail;
      if (detail !== undefined) setValue(detail);
    };
    // Another browser tab changed the same key.
    const onStorage = (e: StorageEvent) => {
      if (e.key === key) setValue(read());
    };

    window.addEventListener(`algocoach:${key}`, onLocal);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(`algocoach:${key}`, onLocal);
      window.removeEventListener("storage", onStorage);
    };
  }, [key, read]);

  const update = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const resolved = typeof next === "function" ? (next as (p: T) => T)(prev) : next;
        try {
          localStorage.setItem(key, JSON.stringify(resolved));
          // Same object reference reaches every listener, so the component that
          // made the change bails out instead of re-rendering needlessly.
          window.dispatchEvent(new CustomEvent(`algocoach:${key}`, { detail: resolved }));
        } catch {
          /* storage full or blocked — keep the in-memory value */
        }
        return resolved;
      });
    },
    [key],
  );

  return [value, update] as const;
}
