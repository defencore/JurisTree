import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/browser",
  fullyParallel: false,
  workers: process.env.CI ? 2 : 1,
  projects: [
    { name: "chromium", use: { browserName: "chromium" } },
    {
      name: "firefox",
      testMatch:
        /(browser-zoom|workspace-controls|document-library|interface-scale|property-dossiers)\.spec\.js/,
      use: { browserName: "firefox", launchOptions: {} },
    },
    {
      name: "webkit",
      testMatch:
        /(browser-zoom|workspace-controls|interface-scale|property-dossiers)\.spec\.js/,
      use: { browserName: "webkit", launchOptions: {} },
    },
  ],
  use: {
    baseURL: process.env.JURISTREE_BASE_URL || "http://127.0.0.1:8080/",
    browserName: "chromium",
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE }
      : {},
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npm run dev",
    url: "http://127.0.0.1:8080",
    reuseExistingServer: !process.env.CI,
  },
});
