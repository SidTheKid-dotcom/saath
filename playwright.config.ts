import { defineConfig } from "@playwright/test";

const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:3000";

export default defineConfig({
  testDir: "tests/e2e",
  // *.e2e.ts, not *.test.ts: vitest only includes src/**/*.test.ts, and this keeps the two apart.
  testMatch: "**/*.e2e.ts",
  // Both suites share one live room, so they must not run at the same time.
  fullyParallel: false,
  workers: 1,
  timeout: 120_000,
  expect: { timeout: 20_000 },
  reporter: [["list"]],
  use: {
    baseURL,
    locale: "en-IN",
    trace: "retain-on-failure",
    channel: "chrome",
    launchOptions: {
      args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
    },
  },
});
