import { test, expect } from '@playwright/test';

test.describe('Dashboard Navigation Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[name="identifier"]', 'admin@cpos.local');
    await page.fill('input[name="password"]', 'Passw0rd!');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('should display dashboard after login', async ({ page }) => {
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('text=Your RBAC-enabled control center')).toBeVisible();
  });

  test('should show sidebar navigation', async ({ page }) => {
    // Skip sidebar check on mobile devices where sidebar is hidden
    const isMobile = await page.evaluate(() => window.innerWidth < 768);
    
    if (isMobile) {
      console.log('📱 Mobile device detected - sidebar is hidden, skipping sidebar navigation check');
      return;
    }

    // Check for sidebar elements on desktop
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
    // Check if mobile device
    const isMobile = await page.evaluate(() => window.innerWidth < 768);
    
    if (isMobile) {
      console.log('📱 Mobile device detected - navigation may be different, skipping detailed navigation test');
      return;
    }

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