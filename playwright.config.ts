import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: process.env.TEST_BASE_URL ?? "http://127.0.0.1:8001",
    headless: true,
    viewport: { width: 1440, height: 1050 },
  },
  reporter: "list",
});
