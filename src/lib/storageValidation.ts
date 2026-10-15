/** Reject malformed local state without silently deleting the stored copy. */
export function validStorage(
  key: string,
  value: unknown,
  fallback: unknown,
): boolean {
  if (Array.isArray(fallback))
    return Array.isArray(value) && value.every((x) => typeof x === "string");
  if (typeof fallback === "number")
    return typeof value === "number" && Number.isFinite(value) && value >= 0;
  if (typeof fallback === "boolean" || typeof fallback === "string")
    return typeof value === typeof fallback;
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const obj = value as Record<string, unknown>;
  if (key === "algocoach-learning")
    return (
      Object.keys(obj).length <= 300 &&
      Object.entries(obj).every(([key, v]) => {
        if (!/^[a-z0-9-]+:[a-z0-9-]+$/.test(key) || !v || typeof v !== "object")
          return false;
        const p = v as Record<string, unknown>;
        return (
          typeof p.page === "number" &&
          Number.isInteger(p.page) &&
          p.page <= 100 &&
          p.page >= 0 &&
          typeof p.completed === "boolean" &&
          typeof p.updatedAt === "number" &&
          Number.isFinite(p.updatedAt) &&
          p.updatedAt >= 0 &&
          ["visited", "passed"].every(
            (k) =>
              Array.isArray(p[k]) &&
              p[k].length <= 100 &&
              (p[k] as unknown[]).every((x) => typeof x === "string"),
          )
        );
      })
    );
  if (key === "algocoach-answers")
    return Object.values(obj).every(
      (n) => typeof n === "number" && Number.isFinite(n) && n >= 0,
    );
  if (key === "algocoach-deck")
    return Object.values(obj).every((v) => {
      if (!v || typeof v !== "object") return false;
      const c = v as Record<string, unknown>;
      return (
        typeof c.due === "string" &&
        /^\d{4}-\d{2}-\d{2}$/.test(c.due) &&
        ["interval", "ease", "reps"].every(
          (k) =>
            typeof c[k] === "number" &&
            Number.isFinite(c[k]) &&
            (c[k] as number) >= 0,
        )
      );
    });
  if (key === "algocoach-today")
    return (
      typeof obj.date === "string" &&
      typeof obj.answered === "number" &&
      obj.answered >= 0 &&
      typeof obj.sessions === "number" &&
      obj.sessions >= 0 &&
      Array.isArray(obj.claimed) &&
      obj.claimed.every((x) => typeof x === "string")
    );
  return true;
}
