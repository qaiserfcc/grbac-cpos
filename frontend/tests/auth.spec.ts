import { test, expect } from '@playwright/test';

test.describe('Authentication Tests', () => {
  test('should login as admin successfully', async ({ page }) => {
    // Navigate to login page
    await page.goto('/login');

    // Fill login form
    await page.fill('input[name="identifier"]', 'admin@cpos.local');
    await page.fill('input[name="password"]', 'Passw0rd!');

    // Click login button
    await page.click('button[type="submit"]');

    // Wait for navigation to dashboard
    await page.waitForURL('**/dashboard');

    // Verify we're on dashboard
    await expect(page).toHaveURL('/dashboard');

    // Check for dashboard content
    await expect(page.locator('text=Your RBAC-enabled control center')).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');

    // Fill with invalid credentials
    await page.fill('input[name="identifier"]', 'invalid@cpos.local');
    await page.fill('input[name="password"]', 'wrongpassword');

    await page.click('button[type="submit"]');

    // Should stay on login page (no redirect to dashboard)
    await expect(page).toHaveURL('/login');

    // Check that we're not redirected to dashboard (login failed)
    await page.waitForTimeout(1000); // Wait for potential redirect
    await expect(page).not.toHaveURL('/dashboard');
  });

  test('should redirect to login when accessing protected route without auth', async ({ page }) => {
    await page.goto('/dashboard');

    // Should redirect to login
    await page.waitForURL('/login');
    await expect(page).toHaveURL('/login');
  });
});
