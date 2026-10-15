import { test, expect } from "./auth";
import type { Page } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { COURSES, flattenLessons } from "../../src/data/curriculum";
import { PLANS } from "../../src/data/teaching";
async function advanceToPractice(page: Page, course: string, id: string) {
  await page.goto(`/#learn/${course}/${id}`);
  const l = flattenLessons(COURSES.find((c) => c.id === course)!).find(
    (l) => l.id === id,
  )!;
  for (let i = 0; i < l.pages.findIndex((p) => p.required); i++)
    await page.getByRole("button", { name: "Continue", exact: true }).click();
}
async function answer(
  page: Page,
  section: ReturnType<Page["locator"]>,
  index: number,
  label: string,
) {
  await section.locator(".practice-options button").nth(index).click();
  await section.getByRole("button", { name: label, exact: true }).click();
}
test("first-time learner gets prerequisites before mathematical shorthand", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Let’s get started" }).click();
  await expect(page.locator(".course-reading h1")).toHaveText(
    "Find the largest value",
  );
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page.locator(".course-reading h1")).toHaveText(
    "Input in. Output out.",
  );
  await expect(page.locator(".course-body")).not.toContainText("10⁵");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page.locator(".course-reading h1")).toHaveText(
    "A position is not a value",
  );
  await expect(page.locator(".concept-list")).toContainText(
    "Position 2 → value 7",
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByText("Sections & help", { exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Words on this page" }),
  ).toBeVisible();
  await page
    .getByRole("navigation", { name: "Mobile and desktop lesson sections" })
    .getByRole("button", { name: /1\. Find the largest/ })
    .click();
  await expect(page.locator(".course-reading h1")).toHaveText(
    "Find the largest value",
  );
});
test("practice and code are gated; hints do not automatically pass; immediate progression is not obstructed", async ({
  page,
}) => {
  await page.goto("/#learn/foundations/what-is-algorithm");
  await page
    .getByRole("button", { name: "Write the idea in your own words" })
    .click();
  await page
    .getByRole("textbox", { name: "My lesson notes" })
    .fill("Remember the largest value, not its position.");
  const l = flattenLessons(COURSES[0])[0],
    p = PLANS[l.id];
  for (let i = 0; i < l.pages.findIndex((p) => p.required); i++)
    await page.getByRole("button", { name: "Continue", exact: true }).click();
  const next = page.getByRole("button", { name: "Continue", exact: true });
  await expect(next).toBeDisabled();
  const first = page.locator(".practice-phase").nth(0);
  await answer(page, first, 0, "Check prediction");
  await expect(first.getByRole("status")).toContainText("Try a smaller step");
  await expect(first.getByRole("status")).not.toContainText(p.predict.explain);
  await first.getByRole("button", { name: "Show the worked recovery" }).click();
  await expect(next).toBeDisabled();
  await answer(page, first, p.predict.answer, "Check prediction");
  await expect(page.getByLabel("Choose a trace case")).toBeVisible();
  await expect(next).toBeDisabled();
  await answer(
    page,
    page.locator(".practice-phase").nth(2),
    p.transfer.answer,
    "Check new case",
  );
  await next.click({ timeout: 1500 });
  await expect(next).toBeDisabled();
  await answer(
    page,
    page.locator(".practice-check"),
    p.gap.answer,
    "Check answer",
  );
  await next.click({ timeout: 1500 });
  await answer(
    page,
    page.locator(".practice-check"),
    p.final.answer,
    "Check answer",
  );
  await next.click({ timeout: 1500 });
  await page
    .getByRole("button", { name: "Finish lesson", exact: true })
    .click({ timeout: 1500 });
  await expect(
    page.getByRole("heading", { name: "Look what you can do." }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Next lesson", exact: true }),
  ).toBeVisible();
  const stored = await page.evaluate(
    () =>
      JSON.parse(localStorage.getItem("algocoach-learning") ?? "{}")[
        "foundations:what-is-algorithm"
      ],
  );
  expect(stored.completed).toBe(true);
  expect(stored.passed).toHaveLength(4);
  expect(stored.visited).toHaveLength(l.pages.length);
  await page.getByText("Sections & help", { exact: true }).click();
  await page
    .getByRole("navigation", { name: "Mobile and desktop lesson sections" })
    .getByRole("button", { name: /1\. Find the largest/ })
    .click();
  await page
    .getByRole("button", { name: "Write the idea in your own words" })
    .click();
  await expect(
    page.getByRole("textbox", { name: "My lesson notes" }),
  ).toHaveValue("Remember the largest value, not its position.");
});
test("real pixels, keyboard inspection, consistent bug and mode-specific reset", async ({
  page,
}) => {
  await advanceToPractice(page, "pixel-pusher", "filtering-images");
  await answer(
    page,
    page.locator(".practice-phase").nth(0),
    PLANS["filtering-images"].predict.answer,
    "Check prediction",
  );
  await page.getByRole("button", { name: "Green only", exact: true }).click();
  await expect(page.locator(".pixel-result strong")).toHaveText("(0, 60, 0)");
  const color = await page
    .locator("canvas")
    .nth(1)
    .evaluate((c: HTMLCanvasElement) =>
      Array.from(c.getContext("2d")!.getImageData(10, 10, 1, 1).data),
    );
  expect(color[0]).toBe(0);
  expect(color[2]).toBe(0);
  expect(color[1]).toBeGreaterThan(0);
  await page
    .getByText("Inspect an image pixel with a keyboard", { exact: true })
    .click();
  await page.getByLabel("Pixel X coordinate").fill("10");
  await page.getByLabel("Pixel Y coordinate").fill("10");
  await page.getByRole("button", { name: "Inspect coordinate" }).click();
  await expect(page.getByLabel("Sample R")).not.toHaveValue("30");
  await advanceToPractice(page, "pixel-pusher", "composing-functions");
  await answer(
    page,
    page.locator(".practice-phase").nth(0),
    PLANS["composing-functions"].predict.answer,
    "Check prediction",
  );
  await expect(page.locator(".pixel-result strong")).toHaveText(
    "(255, 255, 255)",
  );
  await page.getByRole("button", { name: "Swap the order" }).click();
  await expect(page.locator(".pixel-result strong")).toHaveText(
    "(100, 100, 100)",
  );
  await page.getByRole("button", { name: "Reset image experiment" }).click();
  await expect(page.getByLabel("Sample R")).toHaveValue("60");
  await expect(page.locator(".pipeline-trace")).toContainText(
    "(60, 60, 60) → (160, 160, 160)",
  );
  await advanceToPractice(page, "pixel-pusher", "debugging-images");
  await answer(
    page,
    page.locator(".practice-phase").nth(0),
    PLANS["debugging-images"].predict.answer,
    "Check prediction",
  );
  await expect(page.locator(".pixel-result strong")).toHaveText("(60, 0, 0)");
  await page
    .getByRole("button", { name: "return (avg, avg, avg)", exact: true })
    .click();
  await expect(page.locator(".pixel-result strong")).toHaveText("(60, 60, 60)");
  await expect(
    page.getByRole("button", { name: "Continue", exact: true }),
  ).toBeDisabled();
});
for (const course of COURSES)
  test(`all pages, checks and edge-case traces (${process.env.AUDIT_DESKTOP ? "desktop" : "mobile"}): ${course.title}`, async ({
    page,
  }) => {
    test.setTimeout(120000);
    await page.setViewportSize(
      process.env.AUDIT_DESKTOP
        ? { width: 1440, height: 1000 }
        : { width: 390, height: 844 },
    );
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    for (const l of flattenLessons(course)) {
      await page.goto(`/#learn/${course.id}/${l.id}`);
      for (const p of l.pages) {
        await expect(page.locator(".course-reading h1")).toHaveText(p.title);
        await expect(page.locator(".lesson-goal")).toBeVisible();
        await expect(
          page.getByText("Sections & help", { exact: true }),
        ).toBeVisible();
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        ).toBe(true);
        if (process.env.AUDIT_CAPTURE) {
          const folder = process.env.AUDIT_CAPTURE;
          fs.mkdirSync(folder, { recursive: true });
          await page.waitForFunction(
            () =>
              Number(
                getComputedStyle(document.querySelector(".course-reading")!)
                  .opacity,
              ) > 0.99,
          );
          const filename = `${course.id}--${l.id}--${p.id}`;
          await page.screenshot({
            path: path.join(folder, filename + ".jpg"),
            fullPage: true,
            quality: 65,
          });
          fs.writeFileSync(
            path.join(folder, filename + ".json"),
            JSON.stringify(
              {
                course: course.id,
                lesson: l.id,
                page: p.id,
                title: p.title,
                viewport: page.viewportSize(),
                text: await page.locator(".course-reading").innerText(),
              },
              null,
              2,
            ),
          );
        }
        if (p.required) {
          await expect(
            page.getByRole("button", { name: "Continue", exact: true }),
          ).toBeDisabled();
          await answer(
            page,
            page.locator(".practice-phase").nth(0),
            PLANS[l.id].predict.answer,
            "Check prediction",
          );
          if (process.env.AUDIT_CAPTURE)
            await page.screenshot({
              path: path.join(
                process.env.AUDIT_CAPTURE,
                `${course.id}--${l.id}--mechanism.jpg`,
              ),
              fullPage: true,
              quality: 65,
            });
          const select = page.getByLabel("Choose a trace case");
          for (let i = 0; i < (await select.locator("option").count()); i++) {
            await select.selectOption(String(i));
            const next = page.getByRole("button", {
              name: "Next move",
              exact: true,
            });
            let steps = 0;
            while ((await next.isEnabled()) && steps++ < 45) await next.click();
            await expect(page.locator(".trace-state h3")).toHaveText("Result");
          }
          await answer(
            page,
            page.locator(".practice-phase").nth(2),
            PLANS[l.id].transfer.answer,
            "Check new case",
          );
        }
        if (p.quiz) {
          await expect(
            page.getByRole("button", { name: "Continue", exact: true }),
          ).toBeDisabled();
          await answer(
            page,
            page.locator(".practice-check"),
            p.quiz.answer!,
            "Check answer",
          );
        }
        if (p.kind === "wrap")
          await page
            .getByRole("button", { name: "Finish lesson", exact: true })
            .click({ timeout: 1500 });
        else
          await page
            .getByRole("button", { name: "Continue", exact: true })
            .click({ timeout: 1500 });
      }
      await expect(
        page.getByRole("heading", { name: "Look what you can do." }),
      ).toBeVisible();
    }
    await page
      .getByRole("button", { name: "Back to the course", exact: true })
      .click();
    await expect(page.locator(".course-finished")).toContainText(
      `${flattenLessons(course).length} of ${flattenLessons(course).length}`,
    );
    await expect(
      page.getByRole("button", { name: "Review from the beginning" }),
    ).toBeVisible();
    expect(errors).toEqual([]);
  });
test("account-backed completion restores and legacy section position migrates safely", async ({
  page,
}) => {
  const userId = (await (await page.request.get("/api/me")).json()).user.id;
  expect(
    (
      await page.request.put("/api/learning", {
        headers: {
          "x-algocoach-request": "1",
          "x-algocoach-account": String(userId),
        },
        data: {
          lessons: {
            "foundations:what-is-algorithm": {
              page: 5,
              visited: ["w1", "w2", "w3", "w4", "w5"],
              passed: ["w4"],
              completed: true,
              updatedAt: Date.now(),
            },
          },
        },
      })
    ).ok(),
  ).toBe(true);
  await page.goto("/");
  await expect(page.locator(".continue-card h2")).toHaveText(
    "Count work as the input grows",
  );
  await page.reload();
  await expect(page.locator(".continue-card h2")).toHaveText(
    "Count work as the input grows",
  );
  await page.goto("/#learn/foundations/what-is-algorithm");
  await expect(page.locator(".course-reading h1")).toHaveText(
    "Find the largest value",
  );
  expect(
    (
      await page.evaluate(
        () =>
          JSON.parse(localStorage.getItem("algocoach-learning") ?? "{}")[
            "foundations:what-is-algorithm"
          ],
      )
    ).completed,
  ).toBe(true);
});
