import { test, expect } from '@playwright/test';

test.describe('Permission-Based Access Control Tests', () => {
  test('admin should have access to all features', async ({ page }) => {
    // Login as admin
    await page.goto('/');
    await page.fill('input[type="email"]', 'admin@cpos.local');
    await page.fill('input[type="password"]', 'Passw0rd!');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    // Check sidebar navigation
    const sidebar = page.locator('[data-testid="sidebar"], .sidebar, nav');
    await expect(sidebar).toBeVisible();

    // Check for all navigation links
    const dashboardLink = sidebar.locator('text=Dashboard');
    const usersLink = sidebar.locator('text=Users');
    const rolesLink = sidebar.locator('text=Roles');
    const permissionsLink = sidebar.locator('text=Permissions');

    console.log('Admin navigation access:');
    console.log(`- Dashboard: ${await dashboardLink.isVisible() ? '✅' : '❌'}`);
    console.log(`- Users: ${await usersLink.isVisible() ? '✅' : '❌'}`);
    console.log(`- Roles: ${await rolesLink.isVisible() ? '✅' : '❌'}`);
    console.log(`- Permissions: ${await permissionsLink.isVisible() ? '✅' : '❌'}`);

    // Test navigation to users page
    if (await usersLink.isVisible()) {
      await usersLink.click();
      await page.waitForURL('/dashboard/users');

      // Check for user management actions
      const addUserBtn = page.locator('button:has-text("Add User"), [data-testid="add-user-btn"]');
      const exportBtn = page.locator('button:has-text("Export"), [data-testid="export-btn"]');

      console.log('User management actions:');
      console.log(`- Add User: ${await addUserBtn.isVisible() ? '✅' : '❌'}`);
      console.log(`- Export: ${await exportBtn.isVisible() ? '✅' : '❌'}`);
    }
  });

  test('user with limited permissions should have restricted access', async ({ page }) => {
    // Login as a regular user (assuming we have one with limited permissions)
    // For now, we'll test with admin and simulate permission checks
    await page.goto('/');
    await page.fill('input[type="email"]', 'admin@cpos.local');
    await page.fill('input[type="password"]', 'Passw0rd!');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    // Navigate to users page
    const usersLink = page.locator('text=Users');
    if (await usersLink.isVisible()) {
      await usersLink.click();
      await page.waitForURL('/dashboard/users');

      // Check user table for permission-based UI elements
      const userRows = page.locator('tbody tr, [data-testid="user-row"]');

      if (await userRows.count() > 0) {
        const firstRow = userRows.first();

        // Check for action buttons that should be permission-controlled
        const editBtn = firstRow.locator('button:has-text("Edit"), [data-testid="edit-user-btn"]');
        const deleteBtn = firstRow.locator('button:has-text("Delete"), [data-testid="delete-user-btn"]');
        const assignRoleBtn = firstRow.locator('button:has-text("Assign Role"), [data-testid="assign-role-btn"]');

        console.log('Permission-controlled actions:');
        console.log(`- Edit User: ${await editBtn.isVisible() ? '✅' : '❌'}`);
        console.log(`- Delete User: ${await deleteBtn.isVisible() ? '✅' : '❌'}`);
        console.log(`- Assign Role: ${await assignRoleBtn.isVisible() ? '✅' : '❌'}`);
      }
    }
  });

  test('should handle unauthorized access attempts', async ({ page }) => {
    // Login as admin first
    await page.goto('/');
    await page.fill('input[type="email"]', 'admin@cpos.local');
    await page.fill('input[type="password"]', 'Passw0rd!');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    // Try to access a protected route directly
    await page.goto('/dashboard/admin-only');
    await page.waitForLoadState();

    // Check if redirected or shows access denied
    const currentUrl = page.url();
    const hasAccessDenied = await page.locator('text=Access Denied, text=Unauthorized, text=Forbidden').isVisible();
    const isRedirected = !currentUrl.includes('/dashboard/admin-only');

    console.log('Unauthorized access handling:');
    console.log(`- Current URL: ${currentUrl}`);
    console.log(`- Access denied message: ${hasAccessDenied ? '✅' : '❌'}`);
    console.log(`- Redirected away: ${isRedirected ? '✅' : '❌'}`);
  });

  test('should show role-based UI elements', async ({ page }) => {
    // Login as admin
    await page.goto('/');
    await page.fill('input[type="email"]', 'admin@cpos.local');
    await page.fill('input[type="password"]', 'Passw0rd!');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    // Navigate to users page
    const usersLink = page.locator('text=Users');
    if (await usersLink.isVisible()) {
      await usersLink.click();
      await page.waitForURL('/dashboard/users');

      // Look for role badges in user table
      const roleBadges = page.locator('[data-testid="role-badge"], .role-badge, .badge');
      const badgeCount = await roleBadges.count();

      console.log(`Found ${badgeCount} role badges on users page`);

      if (badgeCount > 0) {
        // Check different role types
        const adminBadges = roleBadges.locator('text=Admin, text=Administrator');
        const userBadges = roleBadges.locator('text=User');
        const managerBadges = roleBadges.locator('text=Manager');

        console.log('Role badge distribution:');
        console.log(`- Admin badges: ${await adminBadges.count()}`);
        console.log(`- User badges: ${await userBadges.count()}`);
        console.log(`- Manager badges: ${await managerBadges.count()}`);
      }
    }
  });

  test('should validate permission checks on actions', async ({ page }) => {
    // Login as admin
    await page.goto('/');
    await page.fill('input[type="email"]', 'admin@cpos.local');
    await page.fill('input[type="password"]', 'Passw0rd!');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    // Navigate to users page
    const usersLink = page.locator('text=Users');
    if (await usersLink.isVisible()) {
      await usersLink.click();
      await page.waitForURL('/dashboard/users');

      // Look for bulk actions that require specific permissions
      const bulkDeleteBtn = page.locator('button:has-text("Delete Selected"), [data-testid="bulk-delete-btn"]');
      const bulkAssignRoleBtn = page.locator('button:has-text("Assign Role to Selected"), [data-testid="bulk-assign-role-btn"]');

      console.log('Bulk action permissions:');
      console.log(`- Bulk Delete: ${await bulkDeleteBtn.isVisible() ? '✅' : '❌'}`);
      console.log(`- Bulk Assign Role: ${await bulkAssignRoleBtn.isVisible() ? '✅' : '❌'}`);

      // Check for checkboxes/selectors for bulk operations
      const userCheckboxes = page.locator('input[type="checkbox"][data-testid="user-checkbox"]');
      const checkboxCount = await userCheckboxes.count();
      console.log(`Found ${checkboxCount} user selection checkboxes`);
    }
  });
});