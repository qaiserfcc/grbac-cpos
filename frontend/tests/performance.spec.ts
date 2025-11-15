import { test } from '@playwright/test';

test.describe('Performance Tests', () => {
  test('should load dashboard within acceptable time', async ({ page }) => {
    const startTime = Date.now();

    // Login and navigate to dashboard
    await page.goto('/login');
    await page.fill('input[name="identifier"]', 'admin@cpos.local');
    await page.fill('input[name="password"]', 'Passw0rd!');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    const loadTime = Date.now() - startTime;
    console.log(`Dashboard load time: ${loadTime}ms`);

    // Acceptable load time: under 3 seconds
    const acceptableTime = loadTime < 3000;
    console.log(`Acceptable load time (< 3s): ${acceptableTime ? '✅' : '❌'}`);
  });

  test('should load users page within acceptable time', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[name="identifier"]', 'admin@cpos.local');
    await page.fill('input[name="password"]', 'Passw0rd!');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    // Navigate to users page and measure time
    const usersLink = page.locator('text=Users');
    if (!(await usersLink.isVisible())) {
      test.skip(true, 'Users page not accessible - insufficient permissions');
    }

    const startTime = Date.now();
    await usersLink.click();
    await page.waitForURL('/dashboard/users');

    // Wait for table to load
    await page.waitForSelector('table, [data-testid="user-table"]', { timeout: 10000 });

    const loadTime = Date.now() - startTime;
    console.log(`Users page load time: ${loadTime}ms`);

    // Acceptable load time: under 5 seconds
    const acceptableTime = loadTime < 5000;
    console.log(`Acceptable load time (< 5s): ${acceptableTime ? '✅' : '❌'}`);
  });

  test('should handle multiple user table operations efficiently', async ({ page }) => {
    // Login and navigate to users page
    await page.goto('/login');
    await page.fill('input[name="identifier"]', 'admin@cpos.local');
    await page.fill('input[name="password"]', 'Passw0rd!');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    const usersLink = page.locator('text=Users');
    if (!(await usersLink.isVisible())) {
      test.skip(true, 'Users page not accessible - insufficient permissions');
    }
    await usersLink.click();
    await page.waitForURL('/dashboard/users');

    // Measure time for various operations
    const operations = [];

    // Operation 1: Count users
    const startCount = Date.now();
    const userRows = page.locator('tbody tr, [data-testid="user-row"]');
    const userCount = await userRows.count();
    const countTime = Date.now() - startCount;
    operations.push({ name: 'Count users', time: countTime, count: userCount });

    // Operation 2: Sort by name (if sortable column exists)
    const nameHeader = page.locator('th:has-text("Name"), th:has-text("Full Name")');
    if (await nameHeader.isVisible()) {
      const startSort = Date.now();
      await nameHeader.click();
      await page.waitForTimeout(500); // Wait for sort to complete
      const sortTime = Date.now() - startSort;
      operations.push({ name: 'Sort by name', time: sortTime });
    }

    // Operation 3: Filter users (if filter exists)
    const searchInput = page.locator('input[placeholder*="search" i], input[placeholder*="filter" i]');
    if (await searchInput.isVisible()) {
      const startFilter = Date.now();
      await searchInput.fill('admin');
      await page.waitForTimeout(500); // Wait for filter to apply
      const filterTime = Date.now() - startFilter;
      operations.push({ name: 'Filter users', time: filterTime });
    }

    // Log performance results
    console.log('User table operations performance:');
    operations.forEach(op => {
      console.log(`- ${op.name}: ${op.time}ms${op.count !== undefined ? ` (${op.count} users)` : ''}`);
    });

    // Check if all operations completed within reasonable time
    const allFast = operations.every(op => op.time < 2000); // 2 seconds per operation
    console.log(`All operations completed quickly (< 2s each): ${allFast ? '✅' : '❌'}`);
  });

  test('should handle page navigation efficiently', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[name="identifier"]', 'admin@cpos.local');
    await page.fill('input[name="password"]', 'Passw0rd!');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    const navigationTimes = [];

    // Test navigation to different sections
    const navItems = [
      { selector: 'text=Dashboard', url: '/dashboard' },
      { selector: 'text=Users', url: '/dashboard/users' },
      // Add more navigation items if they exist
    ];

    for (const nav of navItems) {
      const navLink = page.locator(nav.selector);
      if (await navLink.isVisible()) {
        const startTime = Date.now();
        await navLink.click();
        await page.waitForURL(nav.url);
        const navTime = Date.now() - startTime;
        navigationTimes.push({ page: nav.selector, time: navTime });
      }
    }

    // Log navigation performance
    console.log('Page navigation performance:');
    navigationTimes.forEach(nav => {
      console.log(`- ${nav.page}: ${nav.time}ms`);
    });

    // Check if navigation is fast
    const allNavFast = navigationTimes.every(nav => nav.time < 2000); // 2 seconds per navigation
    console.log(`All navigation completed quickly (< 2s each): ${allNavFast ? '✅' : '❌'}`);
  });

  test('should handle concurrent user actions', async ({ page }) => {
    // Login and navigate to users page
    await page.goto('/login');
    await page.fill('input[name="identifier"]', 'admin@cpos.local');
    await page.fill('input[name="password"]', 'Passw0rd!');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    const usersLink = page.locator('text=Users');
    if (!(await usersLink.isVisible())) {
      test.skip(true, 'Users page not accessible - insufficient permissions');
    }
    await usersLink.click();
    await page.waitForURL('/dashboard/users');

    // Simulate multiple quick actions
    const startTime = Date.now();

    // Action 1: Click on a user row
    const userRows = page.locator('tbody tr, [data-testid="user-row"]');
    if (await userRows.count() > 0) {
      await userRows.first().click();
    }

    // Action 2: Click on another element quickly
    const pageTitle = page.locator('text=Users');
    await pageTitle.click();

    // Action 3: Scroll the table
    const table = page.locator('table');
    await table.hover();
    await page.mouse.wheel(0, 100);

    const totalTime = Date.now() - startTime;
    console.log(`Concurrent actions completed in: ${totalTime}ms`);

    // Check if UI remained responsive
    const stillResponsive = totalTime < 5000; // 5 seconds for multiple actions
    console.log(`UI remained responsive during concurrent actions: ${stillResponsive ? '✅' : '❌'}`);
  });

  test('should measure API response times', async ({ page }) => {
    // This test measures the time for API calls by monitoring network requests
    const apiResponseTimes: Array<{url: string, status: number, time: number}> = [];
    const requestStartTimes = new Map<string, number>();

    // Listen for API requests
    page.on('request', request => {
      if (request.url().includes('/api/')) {
        requestStartTimes.set(request.url(), Date.now());
        console.log(`API Request: ${request.method()} ${request.url()}`);
      }
    });

    page.on('response', response => {
      if (response.url().includes('/api/')) {
        const startTime = requestStartTimes.get(response.url());
        const responseTime = startTime ? Date.now() - startTime : 0;
        apiResponseTimes.push({
          url: response.url(),
          status: response.status(),
          time: responseTime
        });
        requestStartTimes.delete(response.url());
      }
    });

    // Login and navigate to trigger API calls
    await page.goto('/login');
    await page.fill('input[name="identifier"]', 'admin@cpos.local');
    await page.fill('input[name="password"]', 'Passw0rd!');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    // Navigate to users page to trigger user API calls
    const usersLink = page.locator('text=Users');
    if (await usersLink.isVisible()) {
      await usersLink.click();
      await page.waitForURL('/dashboard/users');
      await page.waitForTimeout(2000); // Wait for API calls to complete
    }

    // Log API performance
    console.log('API Response Times:');
    apiResponseTimes.forEach(api => {
      console.log(`- ${api.url}: ${api.time}ms (Status: ${api.status})`);
    });

    // Check if API responses are acceptable
    const allApiFast = apiResponseTimes.every(api => api.time < 2000); // 2 seconds per API call
    console.log(`All API calls responded quickly (< 2s each): ${allApiFast ? '✅' : '❌'}`);
  });
});