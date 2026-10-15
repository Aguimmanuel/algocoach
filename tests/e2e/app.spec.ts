import { test, expect, signInForTest } from "./auth";
test("dashboard, all workspaces, and catalog filtering", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Big ideas. Small steps." }),
  ).toBeVisible();
  await page.screenshot({
    path: "tests/dashboard-desktop.png",
    fullPage: true,
  });
  for (const label of [
    "Learning path",
    "Algorithm playground",
    "Problem coach",
    "Pattern library",
    "Quick reference",
    "My progress",
  ]) {
    await page
      .getByRole("navigation")
      .getByRole("button", { name: label, exact: true })
      .click();
    await expect(page.locator(".workspace-heading h1")).toHaveText(label);
  }
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "Explore courses" })
    .click();
  await page.getByRole("button", { name: "Advanced", exact: true }).click();
  await expect(page.locator(".full-course-card")).toHaveCount(1);
  await page.getByRole("textbox", { name: "Search courses" }).fill("recursion");
  await expect(page.locator(".full-course-card")).toHaveCount(1);
  await page
    .getByRole("textbox", { name: "Search courses" })
    .fill("not-a-real-pattern");
  await expect(
    page.getByRole("heading", { name: "No courses found" }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});
test("lesson resume, interactive trace, gating and saved completion", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await page.goto("/#lesson/brute");
  await expect(page).toHaveURL(/lesson\/brute/);
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page.locator(".trace-explanation")).toContainText("2 + 4 = 6");
  await page.getByRole("button", { name: "Next step", exact: true }).click();
  await expect(page.locator(".trace-explanation")).toContainText("2 + 6 = 8");
  await page.screenshot({ path: "tests/lesson-desktop.png", fullPage: true });
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "What happens next?" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Continue", exact: true }),
  ).toBeDisabled();
  // Test the persisted completion bridge. Exercises themselves are covered separately.
  await page.evaluate(() => {
    localStorage.setItem(
      "algocoach-lab-brute",
      JSON.stringify(["1", "2", "3", "4"]),
    );
    window.dispatchEvent(new CustomEvent("algocoach:algocoach-lab-brute"));
  });
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page
    .getByRole("button", { name: /Skipping brute force and freezing/ })
    .click();
  await expect(
    page.getByRole("button", { name: "Finish lesson" }),
  ).toBeDisabled();
  await page.getByRole("button", { name: /The input is very small/ }).click();
  await page.getByRole("button", { name: "Finish lesson" }).click();
  await expect(
    page.getByRole("heading", { name: "You made it yours." }),
  ).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(() =>
        JSON.parse(localStorage.getItem("algocoach-learned") ?? "[]"),
      ),
    )
    .toContain("brute");
  await page.getByRole("button", { name: "Back to my dashboard" }).click();
  await expect(page.locator(".continue-card h2")).toContainText(
    "Find the largest value",
  );
  expect(errors).toEqual([]);
});
test("mobile navigation and layout", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Big ideas. Small steps." }),
  ).toBeVisible();
  await page.screenshot({ path: "tests/dashboard-mobile.png", fullPage: true });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBeTruthy();
  await page.getByRole("button", { name: "Toggle navigation" }).click();
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "Explore courses" })
    .click();
  await expect(
    page.getByRole("heading", { name: "There’s a way into every idea." }),
  ).toBeVisible();
  await page.locator(".full-course-card").first().click();
  await expect(page.locator(".course-outline h1")).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBeTruthy();
});
test("account dialog and health", async ({ page, request }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Open account", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  const health = await request.get("/api/health");
  expect(health.ok()).toBeTruthy();
  expect((await health.json()).ok).toBe(true);
});
test("all four real lab exercises complete and update the goal", async ({
  page,
}) => {
  await page.goto("/#lesson/brute");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  const steps = [
    "Write down what 'one attempt' looks like (one pair, one step, one candidate).",
    "Loop over every attempt.",
    "Check the condition and keep track of the best / count / answer.",
    "Compute the cost: how many attempts × cost per attempt?",
    "Ask: which work is being repeated? That repetition is where a better pattern hides.",
  ];
  for (const step of steps)
    await page.getByRole("button", { name: step, exact: true }).click();
  await page.getByRole("button", { name: /Spot the traps/ }).click();
  for (const trap of [
    "Skipping brute force and freezing — always write the slow idea first.",
    "Ignoring the constraints, then submitting something that takes hours.",
    "Modifying a collection while looping over it.",
  ])
    await page.getByRole("button", { name: trap, exact: true }).click();
  await page.getByRole("button", { name: "Check my answer" }).click();
  await page.getByRole("button", { name: /Rebuild the code/ }).click();
  await page
    .getByRole("button", {
      name: "if candidate satisfies the rule:",
      exact: true,
    })
    .click();
  await page.getByRole("button", { name: /Name the cost/ }).click();
  await page.getByRole("button", { name: "O(n²)", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Continue", exact: true }),
  ).toBeEnabled();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          JSON.parse(localStorage.getItem("algocoach-today") ?? "{}").answered,
      ),
    )
    .toBe(4);
});
test("Google session merges account progress and restores after reload", async ({
  page,
}) => {
  const userId = await signInForTest(page, `curious-${Date.now()}`);
  await page.goto("/");
  await expect(page.locator(".dashboard-title h1")).toContainText("Curious");
  const seed = await page.request.put("/api/progress", {
    headers: {
      "x-algocoach-request": "1",
      "x-algocoach-account": String(userId),
    },
    data: { learned: ["hashmap"], solved: [], shaky: [] },
  });
  expect(seed.ok()).toBe(true);
  await page.evaluate(() =>
    localStorage.setItem("algocoach-learned", JSON.stringify(["brute"])),
  );
  await page.reload();
  await expect
    .poll(() =>
      page.evaluate(() =>
        JSON.parse(localStorage.getItem("algocoach-learned") ?? "[]"),
      ),
    )
    .toEqual(expect.arrayContaining(["brute", "hashmap"]));
  await page.getByRole("button", { name: "Open account", exact: true }).click();
  await expect(
    page.getByRole("dialog").getByText("Signed in as Curious Learner"),
  ).toBeVisible();
  await expect(page.locator('input[type="password"]')).toHaveCount(0);
  expect(
    await page.evaluate(() => localStorage.getItem("algocoach-token")),
  ).toBeNull();
  await page.keyboard.press("Escape");
  await page.reload();
  await expect(page.locator(".dashboard-title h1")).toContainText("Curious");
});
test("all 19 guided lessons and visual explorers render without errors", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  for (const id of [
    "brute",
    "hashmap",
    "two-pointers",
    "sliding-window",
    "binary-search",
    "prefix-sum",
    "sorting",
    "linked-list",
    "stack",
    "bfs",
    "dfs",
    "trees",
    "backtracking",
    "intervals",
    "dp",
    "greedy",
    "heap",
    "union-find",
    "dijkstra",
  ]) {
    await page.goto(`/#lesson/${id}`);
    await expect(
      page.getByRole("heading", { name: "Every problem has a shape." }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Continue", exact: true }).click();
    await expect(
      page.getByRole("heading", { name: "What happens next?" }),
    ).toBeVisible();
  }
  expect(errors).toEqual([]);
});
test("malformed local progress does not crash the dashboard", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(() => {
    localStorage.setItem("algocoach-learned", "null");
    localStorage.setItem("algocoach-deck", '{"bad":{"due":null}}');
    localStorage.setItem("algocoach-today", "{}");
  });
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Big ideas. Small steps." }),
  ).toBeVisible();
});
