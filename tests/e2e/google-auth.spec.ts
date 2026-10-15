import { test, expect } from "@playwright/test";
import { signInForTest } from "./auth";

test("Google sign-in is the first screen, including deep links; no password or guest path", async ({
  page,
}) => {
  await page.goto("/#learn/arrays/prefix-sum-lesson");
  await expect(
    page.getByRole("heading", { name: "Sign in to AlgoCoach", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Continue with Google", exact: true }),
  ).toBeEnabled();
  await expect(
    page.locator('input[type="password"], input[type="email"]'),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", {
      name: /guest|skip sign|create account|password/i,
    }),
  ).toHaveCount(0);
  await expect(page.locator(".course-reading")).toHaveCount(0);
  await page.evaluate(() =>
    localStorage.setItem("algocoach-token", "old-or-forged-token"),
  );
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Sign in to AlgoCoach", exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: "test-results/screenshots/google-entry-desktop.png",
    fullPage: true,
  });
});

test("Google redirect flow returns to the requested page; session is HttpOnly and logout gates the app", async ({
  page,
  context,
}) => {
  let googleURL = "";
  await page.route("**/api/auth/google/start?**", async (route) => {
    const start = await page.request.get(route.request().url(), {
      maxRedirects: 0,
    });
    googleURL = start.headers().location;
    const google = new URL(googleURL);
    const callback = new URL(google.searchParams.get("redirect_uri")!);
    callback.searchParams.set("state", google.searchParams.get("state")!);
    callback.searchParams.set("code", `browser-${Date.now()}`);
    await route.fulfill({
      status: 302,
      headers: { ...start.headers(), location: callback.toString() },
      body: "",
    });
  });
  await page.goto("/#visualize");
  await page
    .getByRole("button", { name: "Continue with Google", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Algorithm playground", exact: true }),
  ).toBeVisible();
  const params = new URL(googleURL).searchParams;
  expect(params.get("scope")).toBe("openid email profile");
  expect(params.get("code_challenge_method")).toBe("S256");
  expect(params.has("client_secret")).toBe(false);
  expect(page.url()).not.toMatch(/token=|code=/);
  expect(
    (await context.cookies()).find((c) => c.name === "algocoach_session")
      ?.httpOnly,
  ).toBe(true);
  expect(await page.evaluate(() => document.cookie)).not.toContain(
    "algocoach_session",
  );
  expect(
    await page.evaluate(() => localStorage.getItem("algocoach-token")),
  ).toBeNull();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Algorithm playground", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Open account", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Sign out", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Sign in to AlgoCoach", exact: true }),
  ).toBeVisible();
  expect((await page.request.get("/api/me")).status()).toBe(401);
});

test("unavailable sign-in uses a simple message without setup instructions", async ({
  page,
}) => {
  await page.route("**/api/auth/config", (route) =>
    route.fulfill({
      json: { provider: "google", configured: false, coach_mode: "offline" },
    }),
  );
  await page.goto("/");
  await expect(
    page.getByText("Sign-in unavailable", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Continue with Google", exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "Try again", exact: false }),
  ).toBeVisible();
  await expect(
    page.getByText(
      /OAuth|client secret|redirect URL|app owner|Gemini|subscription/i,
    ),
  ).toHaveCount(0);
});

test("cancelled consent and network failure are recoverable without password UI", async ({
  page,
}) => {
  await page.goto("/?auth_error=cancelled");
  await expect(page.getByRole("alert")).toContainText("cancelled");
  await expect(page.locator('input[type="password"]')).toHaveCount(0);
  await page.route("**/api/auth/config", (route) => route.abort());
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Retry connection", exact: true }),
  ).toBeVisible();
});

test("separate Google accounts do not inherit each other's local notes or checkpoints", async ({
  page,
}) => {
  const first = `e2e-first-${Date.now()}`;
  await signInForTest(page, first);
  await page.goto("/");
  await expect(page.locator(".dashboard-title")).toBeVisible();
  await page.evaluate(() => {
    localStorage.setItem(
      "algocoach-learning",
      JSON.stringify({
        "foundations:what-is-algorithm": {
          page: 0,
          visited: [],
          passed: [],
          completed: false,
          updatedAt: 1,
        },
      }),
    );
    localStorage.setItem(
      "algocoach-notes-demo",
      JSON.stringify("First learner private note"),
    );
  });
  await signInForTest(page, `e2e-second-${Date.now()}`);
  await page.reload();
  await expect(page.locator(".dashboard-title")).toBeVisible();
  expect(
    await page.evaluate(() => localStorage.getItem("algocoach-notes-demo")),
  ).toBeNull();
  await signInForTest(page, first);
  await page.reload();
  await expect(page.locator(".dashboard-title")).toBeVisible();
  expect(
    await page.evaluate(() => localStorage.getItem("algocoach-notes-demo")),
  ).toContain("First learner private note");
});

test("mobile Google entry is usable without horizontal overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "Continue with Google", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/screenshots/google-entry-mobile.png",
    fullPage: true,
  });
});

test("another tab changing accounts closes the stale workspace", async ({
  page,
  context,
}) => {
  const oldId = await signInForTest(page);
  await page.goto("/");
  await expect(page.locator(".dashboard-title")).toBeVisible();
  const other = await context.newPage();
  await signInForTest(other, `e2e-tab-${Date.now()}`);
  await other.goto("/");
  await expect(other.locator(".dashboard-title")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Sign in to AlgoCoach", exact: true }),
  ).toBeVisible();
  const staleSave = await page.request.put("/api/progress", {
    headers: {
      "x-algocoach-request": "1",
      "x-algocoach-account": String(oldId),
    },
    data: { learned: ["brute"] },
  });
  expect(staleSave.status()).toBe(401);
  expect(
    (await (await other.request.get("/api/me")).json()).progress.learned,
  ).toEqual([]);
  await other.close();
});

test("offline coach gives a pattern plan without API-key or generated-solution prompts", async ({
  page,
}) => {
  await signInForTest(page);
  const externalAI: string[] = [];
  page.on("request", (request) => {
    if (/generativelanguage|aiplatform|api\.openai/.test(request.url()))
      externalAI.push(request.url());
  });
  await page.goto("/#coach");
  await page
    .getByLabel(/Paste your question/)
    .fill(
      "Given an array of integers and a target, return the indices of the two numbers that add up to the target. 2 <= n <= 10000",
    );
  await page.getByRole("button", { name: "Coach me", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: /Your thinking plan/ }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Practice this idea", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Unlock the solution/ }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("textbox", { name: /API key|password/i }),
  ).toHaveCount(0);
  await expect(
    page.getByText(
      /Gemini|API key|generative model|custom generated solution|app owner/i,
    ),
  ).toHaveCount(0);
  expect(externalAI).toEqual([]);
  await page.screenshot({
    path: "test-results/screenshots/google-offline-coach.png",
    fullPage: true,
  });
});
