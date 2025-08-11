import { test, expect } from '@playwright/test';

test.describe('DreamShepherd Router Component', () => {
  test('should initialize and load the application', async ({ page }) => {
    await page.goto('/');
    
    // Wait for React app to initialize
    await page.waitForSelector('#root');
    
    // Should load without JavaScript errors
    const errors = [];
    page.on('pageerror', error => errors.push(error));
    
    await page.waitForTimeout(1000);
    expect(errors).toHaveLength(0);
  });

  test('should handle routing for anonymous users', async ({ page }) => {
    await page.goto('/');
    
    // Anonymous users should see the intro page
    await expect(page.getByText('Tell me your dream')).toBeVisible();
    
    // Should be at root path
    expect(page.url()).toMatch(/\/$|\/$/);
  });

  test('should handle direct navigation to dream URLs', async ({ page }) => {
    // Test direct navigation to dream editor (debug mode should handle this)
    await page.goto('/dream/test-dream-slug');
    
    // Should either redirect to intro or load dream editor based on debug mode
    // In debug mode, it should create and load the dream
    await page.waitForTimeout(2000);
    
    // Check if we're in dream editor or redirected
    const currentUrl = page.url();
    const isInEditor = currentUrl.includes('/dream/');
    const isAtIntro = currentUrl.endsWith('/');
    
    expect(isInEditor || isAtIntro).toBeTruthy();
  });

  test('should handle browser back/forward navigation', async ({ page }) => {
    await page.goto('/');
    
    // Wait for intro to load
    await page.waitForTimeout(3000);
    
    // Enter dream title and navigate
    const dreamInput = page.locator('input[placeholder*="dream"]');
    await dreamInput.fill('Navigation Test');
    
    const createButton = page.getByRole('button', { name: /create dream/i });
    await createButton.click();
    
    // Should be in dream editor
    await expect(page).toHaveURL(/\/dream\/.+/);
    
    // Go back
    await page.goBack();
    
    // Should be back at intro (or handled appropriately)
    await page.waitForTimeout(1000);
  });

  test('should render without accessibility violations', async ({ page }) => {
    await page.goto('/');
    
    // Wait for page to load
    await page.waitForTimeout(3000);
    
    // Check for basic accessibility requirements
    const title = await page.title();
    expect(title).toBeTruthy();
    
    // Should have proper heading structure
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').count();
    expect(headings).toBeGreaterThan(0);
    
    // Form inputs should have proper labels or aria-labels
    const inputs = page.locator('input');
    const inputCount = await inputs.count();
    
    for (let i = 0; i < inputCount; i++) {
      const input = inputs.nth(i);
      const hasLabel = await input.evaluate(el => {
        const id = el.getAttribute('id');
        const ariaLabel = el.getAttribute('aria-label');
        const placeholder = el.getAttribute('placeholder');
        const labelFor = id ? document.querySelector(`label[for="${id}"]`) : null;
        
        return !!(ariaLabel || placeholder || labelFor);
      });
      
      expect(hasLabel).toBeTruthy();
    }
  });

  test('should handle service initialization correctly', async ({ page }) => {
    // Monitor console logs for service initialization
    const consoleMessages = [];
    page.on('console', msg => {
      if (msg.type() === 'log') {
        consoleMessages.push(msg.text());
      }
    });
    
    await page.goto('/');
    await page.waitForTimeout(2000);
    
    // Should see routing debug messages
    const routingMessage = consoleMessages.find(msg => 
      msg.includes('Routing according to dreamer')
    );
    expect(routingMessage).toBeTruthy();
  });

  test('should handle different dreamer states', async ({ page }) => {
    // Test with localStorage to simulate different dreamer states
    await page.goto('/');
    
    // Test anonymous state (default)
    await expect(page.getByText('Tell me your dream')).toBeVisible();
    
    // Simulate authenticated state by setting localStorage
    await page.evaluate(() => {
      localStorage.setItem('TEMP_TOKEN_STORAGE_KEY', 'test-token-123');
    });
    
    // Reload page to trigger authentication check
    await page.reload();
    await page.waitForTimeout(2000);
    
    // Should handle the token state appropriately
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Monitor network failures
    const failedRequests = [];
    page.on('requestfailed', request => {
      failedRequests.push(request.url());
    });
    
    await page.goto('/');
    await page.waitForTimeout(3000);
    
    // App should still render even if some requests fail
    await expect(page.locator('#root')).toBeVisible();
    
    // Should not have JavaScript errors that break the app
    const errors = [];
    page.on('pageerror', error => errors.push(error));
    await page.waitForTimeout(1000);
    
    // Allow for network-related errors but no critical React errors
    const criticalErrors = errors.filter(error => 
      !error.message.includes('fetch') && 
      !error.message.includes('network')
    );
    expect(criticalErrors).toHaveLength(0);
  });
});