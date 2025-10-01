import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test('should redirect from /dashboard to /dashboard/', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForURL('/dashboard/');
    expect(page.url()).toContain('/dashboard/');
  });

  test('/dashboard/ should render and have #root visible', async ({ page }) => {
    await page.goto('/dashboard/');
    const rootElement = await page.waitForSelector('#root');
    expect(rootElement).not.toBeNull();
  });

  test('/api/rtdb should return { ok: true }', async ({ request }) => {
    const response = await request.get('/api/rtdb');
    expect(response.ok()).toBeTruthy();
    const json = await response.json();
    expect(json).toEqual({ ok: true });
  });
});
