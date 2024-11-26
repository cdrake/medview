import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  webServer: {
    command: 'npm run dev',
    port: 5173, // Ensure this matches your app's dev server port
    timeout: 120 * 1000, // Extend the timeout if your server takes time to start
    reuseExistingServer: !process.env.CI // Avoid restarting if already running
  },
  use: {
    baseURL: 'http://localhost:5173/', // Ensure this matches your server address
    headless: true,
    trace: 'on-first-retry'
  }
})
