import { test, expect } from '@playwright/test';

test.describe('Intro Component', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the intro page
    await page.goto('/');
  });

  test('should display animated intro sequence', async ({ page }) => {
    // Wait for the animated text to appear
    await expect(page.getByText('Tell me your dream')).toBeVisible();
    
    // Check for subtitle text
    await expect(page.getByText('A vision of what your life could be')).toBeVisible();
    
    // Verify the intro sequence completes
    await page.waitForTimeout(3000); // Wait for animations
    
    // Check if input area becomes visible
    await expect(page.locator('input[placeholder*="dream"]')).toBeVisible();
  });

  test('should handle user input and show create dream button', async ({ page }) => {
    // Wait for intro sequence to complete
    await page.waitForTimeout(3000);
    
    // Find the dream title input and type
    const dreamInput = page.locator('input[placeholder*="dream"]');
    await expect(dreamInput).toBeVisible();
    
    await dreamInput.fill('My Test Dream');
    
    // Check if "Create Dream" button appears
    await expect(page.getByRole('button', { name: /create dream/i })).toBeVisible();
  });

  test('should navigate to dream editor when create dream is clicked', async ({ page }) => {
    // Wait for intro sequence
    await page.waitForTimeout(3000);
    
    // Enter a dream title
    const dreamInput = page.locator('input[placeholder*="dream"]');
    await dreamInput.fill('Navigation Test Dream');
    
    // Click create dream button
    const createButton = page.getByRole('button', { name: /create dream/i });
    await createButton.click();
    
    // Should navigate to dream editor
    await expect(page).toHaveURL(/\/dream\/.+/);
    
    // Should see the dream editor interface
    await expect(page.locator('[data-testid="dream-editor"]')).toBeVisible();
  });

  test('should display Shepherd guidance component', async ({ page }) => {
    // Check if Shepherd toggle tab is present
    await expect(page.locator('[data-testid="shepherd-toggle"]')).toBeVisible();
    
    // Click to open Shepherd
    await page.locator('[data-testid="shepherd-toggle"]').click();
    
    // Verify Shepherd panel opens
    await expect(page.locator('[data-testid="shepherd-panel"]')).toBeVisible();
    
    // Should contain guidance message
    await expect(page.locator('[data-testid="shepherd-message"]')).toBeVisible();
  });

  test('should handle mobile responsive design', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Wait for intro sequence
    await page.waitForTimeout(3000);
    
    // Check if mobile-specific classes are applied
    const dreamInput = page.locator('input[placeholder*="dream"]');
    await expect(dreamInput).toBeVisible();
    
    // Verify mobile-friendly input behavior
    await dreamInput.fill('Mobile Dream Test');
    await expect(page.getByRole('button', { name: /create dream/i })).toBeVisible();
  });

  test('should validate empty input handling', async ({ page }) => {
    // Wait for intro sequence
    await page.waitForTimeout(3000);
    
    // Try to interact without entering text
    const dreamInput = page.locator('input[placeholder*="dream"]');
    await dreamInput.click();
    
    // Create Dream button should not be visible without input
    await expect(page.getByRole('button', { name: /create dream/i })).not.toBeVisible();
  });
});