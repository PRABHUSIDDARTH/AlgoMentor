import { defineConfig, devices } from '@playwright/test'

// Runs against the real jar with the e2e profile (stub model + stub LeetCode). Build it first:
//   ./mvnw -B package -DskipTests
export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: 'http://localhost:8091',
    trace: 'retain-on-failure',
    // Locally use the installed Chrome; CI installs Playwright's Chromium.
    ...(process.env.CI ? {} : { channel: 'chrome' }),
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'], ...(process.env.CI ? {} : { channel: 'chrome' }) } }],
  webServer: {
    // A fresh contributions file and a known admin token, so the review flow can be tested.
    command: 'rm -f ../target/e2e-contributions.json && java -jar ../target/algomentor-0.0.1-SNAPSHOT.jar --spring.profiles.active=e2e --server.port=8091 --algomentor.admin-token=e2e-admin-token --algomentor.contributions.file=../target/e2e-contributions.json',
    url: 'http://localhost:8091/actuator/health',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
})
