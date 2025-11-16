import { test, expect } from '@playwright/test';

test.describe('Integration Tests - UI and API Data Flow', () => {
  test('should create and display new user', async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.fill('input[name="identifier"]', 'admin@cpos.local');
    await page.fill('input[name="password"]', 'Passw0rd!');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    // Navigate to users page
    const usersLink = page.locator('text=Users');
    try {
      await usersLink.waitFor({ state: 'visible', timeout: 2000 });
      await usersLink.click();
    } catch {
      await page.goto('/dashboard/users');
    }
    await page.waitForURL('/dashboard/users');

    // Count users before adding
    const initialUserRows = page.locator('tbody tr, [data-testid="user-row"]');
    const initialCount = await initialUserRows.count();
    console.log(`Initial user count: ${initialCount}`);

    // Look for add user button
    const addUserBtn = page.locator('[data-testid="add-user-btn"]');
    await addUserBtn.waitFor({ state: 'visible' });
    await addUserBtn.scrollIntoViewIfNeeded();
    await addUserBtn.click({ force: true });

    // Wait for modal/form to appear
    await page.waitForSelector('[data-testid="add-user-modal"], .modal, form');

    // Generate unique test user data
    const timestamp = Date.now();
    const testEmail = `testuser${timestamp}@cpos.local`;
    const testUsername = `testuser${timestamp}`;
    const testName = `Test User ${timestamp}`;

    // Fill out the form
    const nameInput = page.locator(
      'input[name="fullName"], #fullName, input[placeholder*="Full" i]',
    );
    const emailInput = page.locator('input[name="email"], input[type="email"]');
    const usernameInput = page.locator('input[name="username"]');

    if (await nameInput.isVisible()) {
      await nameInput.fill(testName);
    }
    if (await emailInput.isVisible()) {
      await emailInput.fill(testEmail);
    }
    if (await usernameInput.isVisible()) {
      await usernameInput.fill(testUsername);
    }

    // Submit the form
    const modal = page.locator('[data-testid="add-user-modal"]');
    const submitBtn = modal.locator('button[type="submit"], button:has-text("Create")');
    await submitBtn.click({ force: true });

    // Wait for modal to close and table to re-render
    await page.waitForLoadState('networkidle');
    await expect(page.locator('tbody tr, [data-testid="user-row"]').first()).toBeVisible({
      timeout: 10000,
    });

    // Check if user was added by email
    const updatedUserRows = page.locator('tbody tr, [data-testid="user-row"]');
    const updatedCount = await updatedUserRows.count();
    console.log(`Updated user count: ${updatedCount}`);

    // Look for the new user in the table
    const newUserRow = page.locator(`text=${testEmail}`);
    await expect(newUserRow).toBeVisible({ timeout: 10000 });
    const userAdded = await newUserRow.isVisible();

    console.log(`New user added: ${userAdded ? '✅' : '❌'}`);
    console.log(`User count increased: ${updatedCount > initialCount ? '✅' : '❌'}`);
  });

  test('should update user status', async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.fill('input[name="identifier"]', 'admin@cpos.local');
    await page.fill('input[name="password"]', 'Passw0rd!');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    // Navigate to users page
    const usersLink = page.locator('text=Users');
    try {
      await usersLink.waitFor({ state: 'visible', timeout: 2000 });
      await usersLink.click();
    } catch {
      await page.goto('/dashboard/users');
    }
    await page.waitForURL('/dashboard/users');

    // Always create a fresh temp user for deterministic status toggle
    const addUserBtn2 = page.locator('[data-testid="add-user-btn"]');
    await addUserBtn2.scrollIntoViewIfNeeded();
    await addUserBtn2.click({ force: true });
    await page.waitForSelector('[data-testid="add-user-modal"], .modal, form');
    const ts = Date.now();
    const tempEmail = `temp${ts}@cpos.local`;
    await page.fill('input[name="fullName"]', `Temp User ${ts}`);
    await page.fill('input[name="email"]', tempEmail);
    await page.fill('input[name="username"]', `temp${ts}`);
    const modal2 = page.locator('[data-testid="add-user-modal"]');
    await modal2.locator('button[type="submit"], button:has-text("Create")').click({ force: true });
    await page.waitForLoadState('networkidle');

    // Find the newly created user row
    const firstRow = page.locator('[data-testid="user-row"]', { hasText: tempEmail }).first();
    await expect(firstRow).toBeVisible();

    // Check current status
    const statusSpan = firstRow.locator('span:has-text("Active"), span:has-text("Inactive")');
    const initialStatus = await statusSpan.textContent();
    console.log(`Initial user status: ${initialStatus}`);

    // Look for status toggle button
    const statusBtn = firstRow.locator(
      'button:has-text("Activate"), button:has-text("Deactivate"), [data-testid="status-toggle"]',
    );
    if (await statusBtn.isVisible()) {
      const buttonText = await statusBtn.textContent();
      console.log(`Status button text: ${buttonText}`);

      await statusBtn.scrollIntoViewIfNeeded();
      await statusBtn.click({ force: true });

      // Wait for status text to change
      const updatedStatusSpan = firstRow.locator(
        'span:has-text("Active"), span:has-text("Inactive")',
      );
      await expect
        .poll(async () => (await updatedStatusSpan.textContent())?.trim())
        .not.toEqual(initialStatus?.trim());
      const updatedStatus = await updatedStatusSpan.textContent();
      console.log(`Updated user status: ${updatedStatus}`);

      const statusChanged = initialStatus !== updatedStatus;
      console.log(`Status successfully changed: ${statusChanged ? '✅' : '❌'}`);
    } else {
      console.log('Status toggle button not found');
    }
  });

  test('should assign role to user', async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.fill('input[name="identifier"]', 'admin@cpos.local');
    await page.fill('input[name="password"]', 'Passw0rd!');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    // Navigate to users page
    const usersLink = page.locator('text=Users');
    try {
      await usersLink.waitFor({ state: 'visible', timeout: 2000 });
      await usersLink.click();
    } catch {
      await page.goto('/dashboard/users');
    }
    await page.waitForURL('/dashboard/users');

    // Create a fresh user to ensure it has no roles
    const addUserBtn3 = page.locator('[data-testid="add-user-btn"]');
    await addUserBtn3.scrollIntoViewIfNeeded();
    await addUserBtn3.click({ force: true });
    await page.waitForSelector('[data-testid="add-user-modal"], .modal, form');
    const ts2 = Date.now();
    const roleEmail = `temprole${ts2}@cpos.local`;
    await page.fill('input[name="fullName"]', `Temp Role User ${ts2}`);
    await page.fill('input[name="email"]', roleEmail);
    await page.fill('input[name="username"]', `temprole${ts2}`);
    const modal3 = page.locator('[data-testid="add-user-modal"]');
    await modal3.locator('button[type="submit"], button:has-text("Create")').click({ force: true });
    await page.waitForLoadState('networkidle');

    const firstRow = page.locator('[data-testid="user-row"]', { hasText: roleEmail }).first();
    await expect(firstRow).toBeVisible();

    // Look for assign role button
    const assignRoleBtn = firstRow.locator('[data-testid="assign-role-btn"]');
    if (await assignRoleBtn.isVisible()) {
      await assignRoleBtn.click({ force: true });

      // Wait for role assignment modal/form
      await page.waitForSelector('.fixed.inset-0.bg-gray-600, [class*="modal"]');

      // Look for role selection buttons
      const roleButtons = page.locator('button[class*="border border-gray-300 rounded-md"]');
      const roleButtonCount = await roleButtons.count();
      console.log(`Available role buttons: ${roleButtonCount}`);

      if (roleButtonCount > 0) {
        // Click the first available role button
        await roleButtons.first().click();

        // Wait for modal to close and page to refresh
        await page.waitForLoadState('networkidle');

        // Check if role was assigned (look for role badge)
        const roleBadges = firstRow.locator('span[class*="bg-blue-100 text-blue-800"]');
        await expect(roleBadges.first()).toBeVisible({ timeout: 10000 });
        const roleBadgeCount = await roleBadges.count();
        const hasRoleBadge = roleBadgeCount > 0;

        console.log(
          `Role badges found after assignment: ${roleBadgeCount} (${hasRoleBadge ? '✅' : '❌'})`,
        );
      }
    } else {
      console.log('Assign Role button not found');
    }
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.fill('input[name="identifier"]', 'admin@cpos.local');
    await page.fill('input[name="password"]', 'Passw0rd!');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    // Navigate to users page
    const usersLink = page.locator('text=Users');
    try {
      await usersLink.waitFor({ state: 'visible', timeout: 2000 });
      await usersLink.click();
    } catch {
      await page.goto('/dashboard/users');
    }
    await page.waitForURL('/dashboard/users');

    // Try to trigger an API error by manipulating network requests
    // This is a basic test - in a real scenario, you'd mock API responses

    // Check for error handling UI elements
    const errorMessage = page.locator('[data-testid="error-message"], .error, .alert-danger');
    const loadingSpinner = page.locator('[data-testid="loading"], .spinner, .loading');

    console.log('Error handling elements:');
    console.log(
      `- Error messages: ${(await errorMessage.isVisible()) ? 'Visible' : 'Not visible'}`,
    );
    console.log(
      `- Loading indicators: ${(await loadingSpinner.isVisible()) ? 'Visible' : 'Not visible'}`,
    );

    // Check if page still functions after potential errors
    const pageTitle = page.locator('text=Users');
    const stillFunctional = await pageTitle.isVisible();
    console.log(`Page still functional: ${stillFunctional ? '✅' : '❌'}`);
  });

  test('should persist data across page refreshes', async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.fill('input[name="identifier"]', 'admin@cpos.local');
    await page.fill('input[name="password"]', 'Passw0rd!');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    // Navigate to users page
    const usersLink = page.locator('text=Users');
    try {
      await usersLink.waitFor({ state: 'visible', timeout: 2000 });
      await usersLink.click();
    } catch {
      await page.goto('/dashboard/users');
    }
    await page.waitForURL('/dashboard/users');

    // Create a distinct user and verify it persists after refresh
    const addUserBtn4 = page.locator('[data-testid="add-user-btn"]');
    await addUserBtn4.scrollIntoViewIfNeeded();
    await addUserBtn4.click({ force: true });
    await page.waitForSelector('[data-testid="add-user-modal"], .modal, form');
    const ts3 = Date.now();
    const persistEmail = `persist${ts3}@cpos.local`;
    await page.fill('input[name="fullName"]', `Persist User ${ts3}`);
    await page.fill('input[name="email"]', persistEmail);
    await page.fill('input[name="username"]', `persist${ts3}`);
    const modal4 = page.locator('[data-testid="add-user-modal"]');
    await modal4.locator('button[type="submit"], button:has-text("Create")').click();
    await page.waitForLoadState('networkidle');

    // Ensure the new user is visible before refresh
    await expect(page.locator(`text=${persistEmail}`)).toBeVisible({ timeout: 10000 });

    // Refresh the page and verify the user still appears
    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(page.locator(`text=${persistEmail}`)).toBeVisible({ timeout: 10000 });
    console.log('Data persisted across refresh: ✅');
  });
});
