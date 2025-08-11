import { test, expect } from '@playwright/test';

test('Debug - what elements are available', async ({ page }) => {
  await page.goto('/');
  
  // Wait for page to load
  await page.waitForTimeout(5000);
  
  console.log('Page title:', await page.title());
  console.log('Page URL:', page.url());
  
  // Take a screenshot
  await page.screenshot({ path: 'debug-page.png' });
  
  // Log all input elements
  const inputs = await page.locator('input').all();
  console.log('Found inputs:', inputs.length);
  
  for (let i = 0; i < inputs.length; i++) {
    const input = inputs[i];
    const placeholder = await input.getAttribute('placeholder');
    const type = await input.getAttribute('type');
    console.log(`Input ${i}: type=${type}, placeholder=${placeholder}`);
  }
  
  // Log all buttons
  const buttons = await page.locator('button').all();
  console.log('Found buttons:', buttons.length);
  
  for (let i = 0; i < buttons.length; i++) {
    const button = buttons[i];
    const text = await button.textContent();
    console.log(`Button ${i}: text="${text}"`);
  }
  
  // Log all text content
  const bodyText = await page.locator('body').textContent();
  console.log('Body text:', bodyText?.substring(0, 200) + '...');
});