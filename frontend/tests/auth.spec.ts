import { test, expect } from '@playwright/test';

test.describe('Authentication Tests', () => {
  test('should login as admin successfully', async ({ page }) => {
    // Navigate to login page
    await page.goto('/');

    // Check if we're on login page
    await expect(page).toHaveURL(/.*\/$/);

    // Fill login form
    await page.fill('input[type="email"]', 'admin@cpos.local');
    await page.fill('input[type="password"]', 'Passw0rd!');

    // Click login button
    await page.click('button[type="submit"]');

    // Wait for navigation to dashboard
    await page.waitForURL('**/dashboard');

    // Verify we're on dashboard
    await expect(page).toHaveURL('/dashboard');

    // Check for dashboard content
    await expect(page.locator('text=Dashboard')).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/');

    // Fill with invalid credentials
    await page.fill('input[type="email"]', 'invalid@cpos.local');
    await page.fill('input[type="password"]', 'wrongpassword');

    await page.click('button[type="submit"]');

    // Should stay on login page or show error
    await expect(page.locator('text=Invalid credentials')).toBeVisible();
  });

  test('should redirect to login when accessing protected route without auth', async ({ page }) => {
    await page.goto('/dashboard');

    // Should redirect to login
    await page.waitForURL('/');
    await expect(page).toHaveURL('/');
  });
});