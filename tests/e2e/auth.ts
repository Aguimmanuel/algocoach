import { test as base, expect, type Page } from "@playwright/test";
import { randomUUID } from "node:crypto";

// Calls the real OAuth start/callback and receives a real HttpOnly session.
// The separate test server stubs only the outbound Google token/userinfo calls.
export async function signInForTest(page: Page, code = `e2e-${randomUUID()}`) {
  const start = await page.request.get("/api/auth/google/start", {
    maxRedirects: 0,
  });
  expect(start.status()).toBe(303);
  const location = start.headers().location;
  if (!location?.startsWith("https://accounts.google.com/"))
    throw Error(
      "Run tests against tests/e2e/google_test_server.py on port 8001, not the production app.",
    );
  const state = new URL(location).searchParams.get("state")!;
  const callback = await page.request.get("/api/auth/google/callback", {
    params: { state, code },
    maxRedirects: 0,
  });
  expect(callback.headers().location).toBe("/#today");
  return (await (await page.request.get("/api/me")).json()).user.id as number;
}
export const test = base.extend({
  page: async ({ page }, use) => {
    await signInForTest(page);
    await use(page);
  },
});
export { expect };
