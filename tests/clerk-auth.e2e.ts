import { test, expect } from '@playwright/test';
import { clerk, clerkSetup } from '@clerk/testing/playwright';

test.beforeAll(async () => {
  await clerkSetup({
    publishableKey: process.env.CLERK_PUBLISHABLE_KEY!,
    secretKey: process.env.CLERK_SECRET_KEY!,
  });
});

test('sample authenticated flow', async ({ page }) => {
  await page.goto('/');
  await clerk.signIn({
    page,
    signInParams: { strategy: 'password', identifier: 'user@example.com', password: 'pass' },
  });
  await page.goto('/protected');
  await expect(page).toHaveURL('/protected');
});
