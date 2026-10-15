import { test, expect } from "./auth";
import { PATTERNS } from "../../src/data/patterns";
import {
  PLAYGROUND_EXAMPLES,
  describePlaygroundInput,
} from "../../src/data/playgroundExamples";

for (const viewport of [
  { name: "desktop", width: 1440, height: 1000 },
  { name: "mobile", width: 390, height: 844 },
]) {
  test(`all 95 workspace playground examples (${viewport.name})`, async ({
    page,
  }) => {
    test.setTimeout(180_000);
    await page.setViewportSize(viewport);
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("/#visualize");
    const select = page.getByRole("combobox", {
      name: "Playground example",
      exact: true,
    });
    const trace = page.getByTestId("playground-trace");
    for (const pattern of PATTERNS) {
      const level = page.getByRole("radio", {
        name: pattern.level,
        exact: true,
      });
      if ((await level.getAttribute("aria-checked")) !== "true")
        await level.click();
      await page
        .locator("aside")
        .getByRole("button", { name: pattern.name, exact: true })
        .click();
      await expect(
        page.getByRole("heading", { name: pattern.name, exact: true }),
      ).toBeVisible();
      await expect(select.locator("option")).toHaveCount(5);
      for (const [index, example] of PLAYGROUND_EXAMPLES[
        pattern.id
      ].entries()) {
        await select.selectOption(String(index));
        await expect(page.locator(".playground-example-note")).toHaveText(
          example.note,
        );
        await expect(page.locator(".playground-example-input")).toHaveText(
          describePlaygroundInput(example.input),
        );
        await expect(page.getByText(/^Step 1 \/ \d+$/)).toBeVisible();
        await expect(trace).not.toContainText("Result:");
        await page
          .getByRole("button", { name: "Next step", exact: true })
          .click();
        await expect(page.getByText(/^Step 2 \/ \d+$/)).toBeVisible();
        await page
          .getByRole("button", { name: "Jump to result", exact: true })
          .click();
        await expect(trace).toContainText(
          `Result: ${JSON.stringify(example.expected)}.`,
        );
        await expect(
          page.getByRole("button", { name: "Next step", exact: true }),
        ).toBeDisabled();
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        ).toBe(true);
        await page
          .getByRole("button", { name: "Start again", exact: true })
          .click();
        await expect(page.getByText(/^Step 1 \/ \d+$/)).toBeVisible();
        await expect(select).toHaveValue(String(index));
      }
    }
    expect(errors).toEqual([]);
    await select.selectOption("0");
    await page.screenshot({
      path: `test-results/screenshots/playground-examples-${viewport.name}.png`,
      fullPage: true,
    });
  });

  test(`all 95 embedded lesson playground examples (${viewport.name})`, async ({
    page,
  }) => {
    test.setTimeout(180_000);
    await page.setViewportSize(viewport);
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    for (const pattern of PATTERNS) {
      await page.goto(`/#lesson/${pattern.id}`);
      await page.getByRole("button", { name: "Continue", exact: true }).click();
      const select = page.getByRole("combobox", {
        name: "Playground example",
        exact: true,
      });
      await expect(select.locator("option")).toHaveCount(5);
      for (const [index, example] of PLAYGROUND_EXAMPLES[
        pattern.id
      ].entries()) {
        await select.selectOption(String(index));
        await expect(page.getByTestId("playground-trace")).not.toContainText(
          "Result:",
        );
        await page
          .getByRole("button", { name: "Jump to result", exact: true })
          .click();
        await expect(page.getByTestId("playground-trace")).toContainText(
          `Result: ${JSON.stringify(example.expected)}.`,
        );
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        ).toBe(true);
        await page
          .getByRole("button", {
            name: [
              "brute",
              "binary-search",
              "two-pointers",
              "sliding-window",
            ].includes(pattern.id)
              ? "Reset"
              : "Start again",
            exact: true,
          })
          .click();
        await expect(select).toHaveValue(String(index));
        await expect(page.getByTestId("playground-trace")).not.toContainText(
          "Result:",
        );
      }
    }
    expect(errors).toEqual([]);
  });
}

test("changing examples stops autoplay and resets the frame synchronously", async ({
  page,
}) => {
  await page.goto("/#visualize");
  await page.getByRole("button", { name: "Play", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Pause", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("combobox", { name: "Playground example", exact: true })
    .selectOption("3");
  await expect(
    page.getByRole("button", { name: "Play", exact: true }),
  ).toBeVisible();
  await expect(page.getByText(/^Step 1 \/ \d+$/)).toBeVisible();
  await page.waitForTimeout(1100); // Deliberately cross the 850ms autoplay timer boundary.
  await expect(page.getByText(/^Step 1 \/ \d+$/)).toBeVisible();
  await page
    .getByRole("button", { name: "Jump to result", exact: true })
    .click();
  await page
    .getByRole("combobox", { name: "Playground example", exact: true })
    .selectOption("4");
  await expect(page.getByTestId("playground-trace")).not.toContainText(
    "Result:",
  );
});

test("embedded custom target works and preset changes restore their own target", async ({
  page,
}) => {
  await page.goto("/#lesson/brute");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("spinbutton", { name: "Target", exact: true }).fill("6");
  await page
    .getByRole("button", { name: "Jump to result", exact: true })
    .click();
  await expect(page.getByTestId("playground-trace")).toContainText(
    "Result: [0,1].",
  );
  await page
    .getByRole("combobox", { name: "Playground example", exact: true })
    .selectOption("2");
  await expect(
    page.getByRole("spinbutton", { name: "Target", exact: true }),
  ).toHaveValue("8");
  await expect(page.getByTestId("playground-trace")).not.toContainText(
    "Result:",
  );
  await page
    .getByRole("button", { name: "Jump to result", exact: true })
    .click();
  await expect(page.getByTestId("playground-trace")).toContainText(
    "Result: [0,1].",
  );
});
