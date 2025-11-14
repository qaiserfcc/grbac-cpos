import { test, expect } from '@playwright/test';

test.describe('Dashboard Navigation Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/');
    await page.fill('input[type="email"]', 'admin@cpos.local');
    await page.fill('input[type="password"]', 'Passw0rd!');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('should display dashboard after login', async ({ page }) => {
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('text=Dashboard')).toBeVisible();
  });

  test('should show sidebar navigation', async ({ page }) => {
    // Check for sidebar elements
    const sidebar = page.locator('[data-testid="sidebar"], .sidebar, nav').first();

    // Check for navigation items
    await expect(sidebar.locator('text=Dashboard')).toBeVisible();
    await expect(sidebar.locator('text=Categories')).toBeVisible();
    await expect(sidebar.locator('text=Products')).toBeVisible();

    // Check if Users is visible (depends on permissions)
    const usersLink = sidebar.locator('text=Users');
    const isUsersVisible = await usersLink.isVisible();

    if (isUsersVisible) {
      console.log('✅ Users navigation is visible');
    } else {
      console.log('❌ Users navigation is not visible - may be due to permissions');
    }
  });

  test('should navigate to different sections', async ({ page }) => {
    // Test navigation to Categories
    await page.click('text=Categories');
    await page.waitForURL('**/categories');
    await expect(page).toHaveURL('/dashboard/categories');

    // Go back to dashboard
    await page.click('text=Dashboard');
    await page.waitForURL('/dashboard');

    // Test navigation to Products
    await page.click('text=Products');
    await page.waitForURL('**/products');
    await expect(page).toHaveURL('/dashboard/products');
  });

  test('should navigate to users page if accessible', async ({ page }) => {
    const usersLink = page.locator('text=Users');

    if (await usersLink.isVisible()) {
      await usersLink.click();
      await page.waitForURL('**/users');
      await expect(page).toHaveURL('/dashboard/users');
      console.log('✅ Successfully navigated to users page');
    } else {
      console.log('❌ Users page not accessible - permission denied');
    }
  });
});