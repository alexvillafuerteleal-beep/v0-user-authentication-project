// e2e/authentication.spec.ts - End-to-End Authentication Tests
import { test, expect } from '@playwright/test';

test.describe('Authentication E2E Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to app before each test
    await page.goto('/');
  });

  test('should show login page', async ({ page }) => {
    await page.goto('/auth/login');
    
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    const submitButton = page.locator('button[type="submit"]');
    
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(submitButton).toBeVisible();
  });

  test('should fail login with invalid credentials', async ({ page }) => {
    await page.goto('/auth/login');
    
    await page.fill('input[type="email"]', 'invalid@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    // Should show error message
    const errorMessage = page.locator('text=/Credenciales inválidas|Invalid credentials/i');
    await expect(errorMessage).toBeVisible({ timeout: 5000 });
  });

  test('should redirect to dashboard on successful login', async ({ page }) => {
    await page.goto('/auth/login');
    
    // Use valid test credentials
    const testEmail = process.env.TEST_EMAIL || 'test@example.com';
    const testPassword = process.env.TEST_PASSWORD || 'TestPassword123!';
    
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.click('button[type="submit"]');
    
    // Should redirect to dashboard
    await page.waitForURL('/dashboard', { timeout: 10000 });
    await expect(page).toHaveURL(/.*\/dashboard/);
  });

  test('should handle logout', async ({ page }) => {
    // Assuming already logged in, navigate to profile/settings
    await page.goto('/dashboard');
    
    // Click logout button (adjust selector as needed)
    const logoutButton = page.locator('button:has-text("Cerrar sesión")');
    
    if (await logoutButton.isVisible()) {
      await logoutButton.click();
      
      // Should redirect to login
      await page.waitForURL('/auth/login', { timeout: 5000 });
      await expect(page).toHaveURL(/.*\/auth\/login/);
    }
  });
});

test.describe('Password Reset E2E Tests', () => {
  
  test('should show forgot password form', async ({ page }) => {
    await page.goto('/auth/forgot-password');
    
    const emailInput = page.locator('input[type="email"]');
    const submitButton = page.locator('button[type="submit"]');
    
    await expect(emailInput).toBeVisible();
    await expect(submitButton).toBeVisible();
  });

  test('should send reset email', async ({ page }) => {
    await page.goto('/auth/forgot-password');
    
    const testEmail = process.env.TEST_EMAIL || 'test@example.com';
    await page.fill('input[type="email"]', testEmail);
    await page.click('button[type="submit"]');
    
    // Should show success message
    const successMessage = page.locator('text=/correo.*enviado|email.*sent/i');
    await expect(successMessage).toBeVisible({ timeout: 5000 });
  });
});
