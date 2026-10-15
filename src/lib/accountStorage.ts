/** Keep device-local notes/reviews separate when different Google users share a browser.
 * Authentication cookies are never copied into storage. Archives are device-local,
 * not a substitute for server sync. Separate browser profiles remain recommended.
 */
const OWNER = "algocoach-local-owner";
const PENDING = "__profile_transition__";
const CACHE = "algocoach-account-cache-";
export const PROFILE_SWITCH = "algocoach-profile-switch";
const personal = (key: string) =>
  key.startsWith("algocoach-") &&
  key !== OWNER &&
  key !== PROFILE_SWITCH &&
  !key.startsWith(CACHE) &&
  key !== "algocoach-token";

function browserStorage(): Storage | undefined {
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}
function snapshot(storage: Storage): Record<string, string> {
  const data: Record<string, string> = {};
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i);
    if (key && personal(key)) data[key] = storage.getItem(key) ?? "";
  }
  return data;
}
function clearPersonal(storage: Storage) {
  const keys = Object.keys(snapshot(storage));
  for (const key of keys) storage.removeItem(key);
  storage.removeItem("algocoach-token"); // obsolete JS-readable bearer token
}
export function activateLocalAccount(
  userId: number,
  storage = browserStorage(),
) {
  if (!storage) return;
  const next = String(userId),
    previous = storage.getItem(OWNER);
  const recovering = previous === PENDING;
  const old = recovering ? null : previous;
  storage.removeItem("algocoach-token");
  if (old === next) return;
  // Write backup before clearing anything; quota/storage failures fail closed.
  if (old) storage.setItem(CACHE + old, JSON.stringify(snapshot(storage)));
  const raw = storage.getItem(CACHE + next);
  let restored: Record<string, string> | null = null;
  if (raw) {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
      throw Error("Invalid local account archive.");
    restored = Object.fromEntries(
      Object.entries(parsed).filter(
        ([k, v]) => personal(k) && typeof v === "string",
      ),
    ) as Record<string, string>;
  }
  // A first Google sign-in adopts the previous unowned device progress. Later
  // accounts never inherit another signed-in learner's local records.
  storage.setItem(PROFILE_SWITCH, `${Date.now()}-${Math.random()}`);
  if (old || restored || recovering) {
    // Keep the previous archive intact if restoring the next profile fails.
    storage.setItem(OWNER, PENDING);
    clearPersonal(storage);
  }
  if (restored)
    for (const [key, value] of Object.entries(restored))
      storage.setItem(key, value);
  storage.setItem(OWNER, next);
}
export function archiveLocalAccount(
  storage = browserStorage(),
  expectedUserId?: number,
) {
  if (!storage) return;
  const owner = storage.getItem(OWNER);
  if (expectedUserId !== undefined && owner !== String(expectedUserId)) return;
  if (owner) storage.setItem(CACHE + owner, JSON.stringify(snapshot(storage)));
  storage.setItem(PROFILE_SWITCH, `${Date.now()}-${Math.random()}`);
  storage.setItem(OWNER, PENDING);
  clearPersonal(storage);
  storage.removeItem(OWNER);
}
