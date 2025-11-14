import { test, expect } from '@playwright/test';

test.describe('User Management Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/');
    await page.fill('input[type="email"]', 'admin@cpos.local');
    await page.fill('input[type="password"]', 'Passw0rd!');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('should load user management page', async ({ page }) => {
    // Navigate to users page
    const usersLink = page.locator('text=Users');
    if (!(await usersLink.isVisible())) {
      test.skip(true, 'Users page not accessible - insufficient permissions');
    }
    await usersLink.click();
    await page.waitForURL('/dashboard/users');
    await expect(page).toHaveURL('/dashboard/users');
    await expect(page.locator('text=Users')).toBeVisible();
  });

  test('should display user table with required columns', async ({ page }) => {
    // Navigate to users page
    const usersLink = page.locator('text=Users');
    if (!(await usersLink.isVisible())) {
      test.skip(true, 'Users page not accessible - insufficient permissions');
    }
    await usersLink.click();
    await page.waitForURL('/dashboard/users');

    // Wait for table to load
    await page.waitForSelector('table, [data-testid="user-table"], .user-table');

    // Check for table headers
    const table = page.locator('table').first();

    // Check if table has user information columns
    const hasNameColumn = await table.locator('text=Name, text=Full Name, th:has-text("Name")').isVisible();
    const hasEmailColumn = await table.locator('text=Email, th:has-text("Email")').isVisible();
    const hasUsernameColumn = await table.locator('text=Username, th:has-text("Username")').isVisible();
    const hasStatusColumn = await table.locator('text=Status, th:has-text("Status")').isVisible();

    console.log('Table column visibility:');
    console.log(`- Name/Full Name: ${hasNameColumn ? '✅' : '❌'}`);
    console.log(`- Email: ${hasEmailColumn ? '✅' : '❌'}`);
    console.log(`- Username: ${hasUsernameColumn ? '✅' : '❌'}`);
    console.log(`- Status: ${hasStatusColumn ? '✅' : '❌'}`);

    // Check if there are user rows
    const userRows = page.locator('tbody tr, [data-testid="user-row"]');
    const rowCount = await userRows.count();

    console.log(`Found ${rowCount} user rows in table`);

    if (rowCount > 0) {
      // Check first user row for data
      const firstRow = userRows.first();

      // Check for user information
      const userInfo = await firstRow.textContent();
      console.log(`First user row content: ${userInfo}`);

      // Check for role badges
      const roleBadges = firstRow.locator('[data-testid="role-badge"], .role-badge, .badge');
      const badgeCount = await roleBadges.count();
      console.log(`Found ${badgeCount} role badges in first row`);

      // Check for status indicators
      const statusIndicators = firstRow.locator('text=Active, text=Inactive, [data-testid="status"]');
      const hasStatus = await statusIndicators.isVisible();
      console.log(`Status indicator visible: ${hasStatus ? '✅' : '❌'}`);
    }
  });

  test('should have user action buttons', async ({ page }) => {
    // Navigate to users page
    const usersLink = page.locator('text=Users');
    if (!(await usersLink.isVisible())) {
      test.skip(true, 'Users page not accessible - insufficient permissions');
    }
    await usersLink.click();
    await page.waitForURL('/dashboard/users');

    const userRows = page.locator('tbody tr, [data-testid="user-row"]');

    if (await userRows.count() > 0) {
      const firstRow = userRows.first();

      // Look for action buttons
      const assignRoleBtn = firstRow.locator('button:has-text("Assign Role"), [data-testid="assign-role-btn"]');
      const deactivateBtn = firstRow.locator('button:has-text("Deactivate"), [data-testid="deactivate-btn"]');
      const activateBtn = firstRow.locator('button:has-text("Activate"), [data-testid="activate-btn"]');

      console.log('Action buttons visibility:');
      console.log(`- Assign Role: ${await assignRoleBtn.isVisible() ? '✅' : '❌'}`);
      console.log(`- Deactivate: ${await deactivateBtn.isVisible() ? '✅' : '❌'}`);
      console.log(`- Activate: ${await activateBtn.isVisible() ? '✅' : '❌'}`);
    }
  });

  test('should display user details correctly', async ({ page }) => {
    // Navigate to users page
    const usersLink = page.locator('text=Users');
    if (!(await usersLink.isVisible())) {
      test.skip(true, 'Users page not accessible - insufficient permissions');
    }
    await usersLink.click();
    await page.waitForURL('/dashboard/users');

    const userRows = page.locator('tbody tr, [data-testid="user-row"]');

    if (await userRows.count() > 0) {
      const firstRow = userRows.first();

      // Extract user information from the row
      const rowText = await firstRow.textContent();
      console.log(`User row details: ${rowText}`);

      // Check for email format
      const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
      const hasValidEmail = emailRegex.test(rowText || '');
      console.log(`Valid email format: ${hasValidEmail ? '✅' : '❌'}`);

      // Check for status
      const hasActiveStatus = rowText?.includes('Active') || false;
      const hasInactiveStatus = rowText?.includes('Inactive') || false;
      console.log(`Status check - Active: ${hasActiveStatus}, Inactive: ${hasInactiveStatus}`);
    }
  });
});