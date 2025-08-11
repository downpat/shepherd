import { test, expect } from '@playwright/test';

test.describe('Basic Application Test', () => {
  test('should load the application homepage', async ({ page }) => {
    await page.goto('/');

    // Wait for React app to load
    await page.waitForSelector('#root', { timeout: 10000 });

    // Should have the correct title
    await expect(page).toHaveTitle(/Shepherd/);

    // Should not have JavaScript errors
    let errors = [];
    page.on('pageerror', error => errors.push(error));

    await page.waitForTimeout(2000);
    expect(errors).toHaveLength(0);
  });

  test('should display intro text', async ({ page }) => {
    // Debug: Let's see what Playwright thinks about the baseURL
    console.log('DEBUG: page.context() options:', await page.context().storageState());
    console.log('DEBUG: page.url() before goto:', page.url());

    // Let's also try to access the test config
    const testInfo = test.info();
    console.log('DEBUG: testInfo.project.use:', testInfo.project.use);
    console.log('DEBUG: testInfo.config.use:', testInfo.config.use);

    try {
      await page.goto('/');
      console.log('DEBUG: page.url() after goto:', page.url());
    } catch (error) {
      console.log('DEBUG: goto error:', error.message);
      throw error;
    }

    // Wait for intro text to appear (allowing for animations)
    await expect(page.getByText('Tell me your dream')).toBeVisible({ timeout: 10000 });
  });
});
