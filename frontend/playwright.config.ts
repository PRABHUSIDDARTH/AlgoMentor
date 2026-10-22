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
    command: 'java -jar ../target/algomentor-0.0.1-SNAPSHOT.jar --spring.profiles.active=e2e --server.port=8091',
    url: 'http://localhost:8091/actuator/health',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
})
