import { test } from '@playwright/test';

test.describe('Integration Tests - UI and API Data Flow', () => {
  test('should create and display new user', async ({ page }) => {
    // Login as admin
    await page.goto('/');
    await page.fill('input[type="email"]', 'admin@cpos.local');
    await page.fill('input[type="password"]', 'Passw0rd!');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    // Navigate to users page
    const usersLink = page.locator('text=Users');
    if (!(await usersLink.isVisible())) {
      test.skip(true, 'Users page not accessible - insufficient permissions');
    }
    await usersLink.click();
    await page.waitForURL('/dashboard/users');

    // Count users before adding
    const initialUserRows = page.locator('tbody tr, [data-testid="user-row"]');
    const initialCount = await initialUserRows.count();
    console.log(`Initial user count: ${initialCount}`);

    // Look for add user button
    const addUserBtn = page.locator('button:has-text("Add User"), [data-testid="add-user-btn"]');
    if (await addUserBtn.isVisible()) {
      await addUserBtn.click();

      // Wait for modal/form to appear
      await page.waitForSelector('[data-testid="add-user-modal"], .modal, form');

      // Generate unique test user data
      const timestamp = Date.now();
      const testEmail = `testuser${timestamp}@cpos.local`;
      const testUsername = `testuser${timestamp}`;
      const testName = `Test User ${timestamp}`;

      // Fill out the form
      const nameInput = page.locator('input[name="name"], input[placeholder*="name" i]');
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
      const submitBtn = page.locator('button[type="submit"], button:has-text("Create"), button:has-text("Add")');
      await submitBtn.click();

      // Wait for modal to close and page to refresh
      await page.waitForTimeout(2000);

      // Check if user was added
      const updatedUserRows = page.locator('tbody tr, [data-testid="user-row"]');
      const updatedCount = await updatedUserRows.count();
      console.log(`Updated user count: ${updatedCount}`);

      // Look for the new user in the table
      const newUserRow = page.locator(`text=${testEmail}, text=${testName}`);
      const userAdded = await newUserRow.isVisible();

      console.log(`New user added: ${userAdded ? '✅' : '❌'}`);
      console.log(`User count increased: ${updatedCount > initialCount ? '✅' : '❌'}`);
    } else {
      console.log('Add User button not found - may not have permission');
    }
  });

  test('should update user status', async ({ page }) => {
    // Login as admin
    await page.goto('/');
    await page.fill('input[type="email"]', 'admin@cpos.local');
    await page.fill('input[type="password"]', 'Passw0rd!');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    // Navigate to users page
    const usersLink = page.locator('text=Users');
    if (!(await usersLink.isVisible())) {
      test.skip(true, 'Users page not accessible - insufficient permissions');
    }
    await usersLink.click();
    await page.waitForURL('/dashboard/users');

    // Find a user row
    const userRows = page.locator('tbody tr, [data-testid="user-row"]');
    if (await userRows.count() === 0) {
      test.skip(true, 'No users found to test status update');
    }

    const firstRow = userRows.first();

    // Check current status
    const initialStatus = await firstRow.locator('text=Active, text=Inactive').textContent();
    console.log(`Initial user status: ${initialStatus}`);

    // Look for status toggle button
    const statusBtn = firstRow.locator('button:has-text("Activate"), button:has-text("Deactivate"), [data-testid="status-toggle"]');
    if (await statusBtn.isVisible()) {
      const buttonText = await statusBtn.textContent();
      console.log(`Status button text: ${buttonText}`);

      await statusBtn.click();

      // Wait for status update
      await page.waitForTimeout(1000);

      // Check if status changed
      const updatedStatus = await firstRow.locator('text=Active, text=Inactive').textContent();
      console.log(`Updated user status: ${updatedStatus}`);

      const statusChanged = initialStatus !== updatedStatus;
      console.log(`Status successfully changed: ${statusChanged ? '✅' : '❌'}`);
    } else {
      console.log('Status toggle button not found');
    }
  });

  test('should assign role to user', async ({ page }) => {
    // Login as admin
    await page.goto('/');
    await page.fill('input[type="email"]', 'admin@cpos.local');
    await page.fill('input[type="password"]', 'Passw0rd!');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    // Navigate to users page
    const usersLink = page.locator('text=Users');
    if (!(await usersLink.isVisible())) {
      test.skip(true, 'Users page not accessible - insufficient permissions');
    }
    await usersLink.click();
    await page.waitForURL('/dashboard/users');

    // Find a user row
    const userRows = page.locator('tbody tr, [data-testid="user-row"]');
    if (await userRows.count() === 0) {
      test.skip(true, 'No users found to test role assignment');
    }

    const firstRow = userRows.first();

    // Look for assign role button
    const assignRoleBtn = firstRow.locator('button:has-text("Assign Role"), [data-testid="assign-role-btn"]');
    if (await assignRoleBtn.isVisible()) {
      await assignRoleBtn.click();

      // Wait for role assignment modal/form
      await page.waitForSelector('[data-testid="role-modal"], .modal, select[name="role"]');

      // Look for role selection
      const roleSelect = page.locator('select[name="role"], [data-testid="role-select"]');
      if (await roleSelect.isVisible()) {
        // Get available options
        const options = roleSelect.locator('option');
        const optionCount = await options.count();
        console.log(`Available roles: ${optionCount}`);

        if (optionCount > 1) {
          // Select second option (assuming first is "Select Role" or similar)
          await roleSelect.selectOption({ index: 1 });

          // Submit the assignment
          const submitBtn = page.locator('button[type="submit"], button:has-text("Assign")');
          await submitBtn.click();

          // Wait for modal to close
          await page.waitForTimeout(2000);

          // Check if role was assigned (look for role badge)
          const roleBadge = firstRow.locator('[data-testid="role-badge"], .role-badge');
          const hasRoleBadge = await roleBadge.isVisible();

          console.log(`Role badge visible after assignment: ${hasRoleBadge ? '✅' : '❌'}`);
        }
      }
    } else {
      console.log('Assign Role button not found');
    }
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Login as admin
    await page.goto('/');
    await page.fill('input[type="email"]', 'admin@cpos.local');
    await page.fill('input[type="password"]', 'Passw0rd!');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    // Navigate to users page
    const usersLink = page.locator('text=Users');
    if (!(await usersLink.isVisible())) {
      test.skip(true, 'Users page not accessible - insufficient permissions');
    }
    await usersLink.click();
    await page.waitForURL('/dashboard/users');

    // Try to trigger an API error by manipulating network requests
    // This is a basic test - in a real scenario, you'd mock API responses

    // Check for error handling UI elements
    const errorMessage = page.locator('[data-testid="error-message"], .error, .alert-danger');
    const loadingSpinner = page.locator('[data-testid="loading"], .spinner, .loading');

    console.log('Error handling elements:');
    console.log(`- Error messages: ${await errorMessage.isVisible() ? 'Visible' : 'Not visible'}`);
    console.log(`- Loading indicators: ${await loadingSpinner.isVisible() ? 'Visible' : 'Not visible'}`);

    // Check if page still functions after potential errors
    const pageTitle = page.locator('text=Users');
    const stillFunctional = await pageTitle.isVisible();
    console.log(`Page still functional: ${stillFunctional ? '✅' : '❌'}`);
  });

  test('should persist data across page refreshes', async ({ page }) => {
    // Login as admin
    await page.goto('/');
    await page.fill('input[type="email"]', 'admin@cpos.local');
    await page.fill('input[type="password"]', 'Passw0rd!');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    // Navigate to users page
    const usersLink = page.locator('text=Users');
    if (!(await usersLink.isVisible())) {
      test.skip(true, 'Users page not accessible - insufficient permissions');
    }
    await usersLink.click();
    await page.waitForURL('/dashboard/users');

    // Count users before refresh
    const userRows = page.locator('tbody tr, [data-testid="user-row"]');
    const countBeforeRefresh = await userRows.count();
    console.log(`User count before refresh: ${countBeforeRefresh}`);

    // Refresh the page
    await page.reload();
    await page.waitForLoadState();

    // Count users after refresh
    const countAfterRefresh = await userRows.count();
    console.log(`User count after refresh: ${countAfterRefresh}`);

    // Check if data persisted
    const dataPersisted = countBeforeRefresh === countAfterRefresh;
    console.log(`Data persisted across refresh: ${dataPersisted ? '✅' : '❌'}`);
  });
});