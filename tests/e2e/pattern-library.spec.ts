import { test, expect } from "./auth";
import type { Locator } from "@playwright/test";
import { PATTERNS } from "../../src/data/patterns";

// Playwright's toBeVisible() deliberately treats opacity:0 as visible.
// Check the whole ancestor chain so an invisible wrapper cannot pass this test.
async function expectPainted(locator: Locator) {
  await locator.scrollIntoViewIfNeeded();
  await expect(locator).toBeVisible();
  await expect
    .poll(() =>
      locator.evaluate((element) => {
        for (
          let node: Element | null = element;
          node;
          node = node.parentElement
        ) {
          const style = getComputedStyle(node);
          // Disabled exercise buttons may legitimately use opacity:0.5.
          // Zero opacity on any ancestor is the actual empty-page regression.
          if (
            Number(style.opacity) <= 0 ||
            style.visibility === "hidden" ||
            style.display === "none"
          )
            return false;
        }
        return true;
      }),
    )
    .toBe(true);
}

for (const viewport of [
  { name: "desktop", width: 1440, height: 1000 },
  { name: "mobile", width: 390, height: 844 },
]) {
  test(`every pattern has painted explanations and exercises (${viewport.name})`, async ({
    page,
  }) => {
    test.setTimeout(180_000);
    await page.setViewportSize(viewport);
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("/#library");
    const article = page.locator("article");
    const search = page.getByPlaceholder(
      `Search all ${PATTERNS.length} patterns…`,
    );

    for (const pattern of PATTERNS) {
      await search.fill(pattern.name);
      await page
        .locator("aside")
        .getByRole("button", { name: pattern.name, exact: true })
        .click();
      await expect(
        article.getByRole("heading", { name: pattern.name, exact: true }),
      ).toBeVisible();
      await expectPainted(article.getByText(pattern.idea, { exact: true }));
      await expectPainted(
        article.getByText(`Think of it like this: ${pattern.analogy}`, {
          exact: true,
        }),
      );
      for (const signal of pattern.signals) {
        await expectPainted(article.getByText(signal, { exact: true }));
      }
      const recipe = article.getByRole("button", {
        name: /Put the recipe in order/,
      });
      await expectPainted(recipe);
      await expectPainted(article.getByText(pattern.steps[0], { exact: true }));
      for (const title of [
        "Spot the traps",
        "Rebuild the code",
        "Name the cost",
      ]) {
        await expectPainted(
          article.getByRole("button", { name: new RegExp(title) }),
        );
      }
      const hintButton = article.getByRole("button", {
        name: "Give me the first question",
        exact: true,
      });
      await expectPainted(hintButton);
      await hintButton.click();
      await expectPainted(article.getByText(pattern.hints[0], { exact: true }));
      await expectPainted(
        article.getByRole("heading", { name: "Skills to master", exact: true }),
      );
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
    }

    await search.fill("");
    for (const level of ["Beginner", "Intermediate", "Advanced"] as const) {
      await page.getByRole("radio", { name: new RegExp(`^${level},`) }).click();
      await expect(article.locator("header")).toContainText(level);
      await expectPainted(
        article.getByRole("heading", { name: "The big idea", exact: true }),
      );
    }
    await page.reload();
    await expectPainted(
      page
        .locator("article")
        .getByRole("heading", { name: "The big idea", exact: true }),
    );
    expect(errors).toEqual([]);
    await page.screenshot({
      path: `test-results/screenshots/pattern-library-${viewport.name}.png`,
      fullPage: true,
    });
  });
}

test("pattern explanations remain painted without IntersectionObserver", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "IntersectionObserver", {
      value: undefined,
      configurable: true,
    });
  });
  await page.goto("/#library");
  await expectPainted(
    page.locator("article").getByText(PATTERNS[0].idea, { exact: true }),
  );
});

test("pattern content does not depend on animation callbacks", async ({
  page,
}) => {
  await page.addInitScript(() => {
    // Simulate an observer that is available but never delivers an intersection.
    Object.defineProperty(window, "IntersectionObserver", {
      configurable: true,
      value: class {
        observe() {}
        unobserve() {}
        disconnect() {}
        takeRecords() {
          return [];
        }
      },
    });
  });
  await page.goto("/#library");
  await expectPainted(
    page.locator("article").getByText(PATTERNS[0].idea, { exact: true }),
  );
  await expectPainted(
    page
      .locator("article")
      .getByRole("button", { name: /Put the recipe in order/ }),
  );
});
