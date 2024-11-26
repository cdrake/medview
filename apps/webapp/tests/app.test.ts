import { test, expect } from '@playwright/test'

test('should display the welcome message', async ({ page }) => {
  await page.goto('/')
  const welcomeMessage = await page.textContent('h1')
  expect(welcomeMessage).toBe('Welcome to MedView Web App')
})
