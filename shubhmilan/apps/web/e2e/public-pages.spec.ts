import { expect, test } from '@playwright/test';

/**
 * Smoke tests for the marketing site. These guard the critical public surfaces so a
 * regression in the landing page or SEO metadata can't ship unnoticed.
 */

test.describe('public marketing pages', () => {
  test('landing renders hero + CTAs', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /find the one/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /create your free profile/i })).toBeVisible();
  });

  test('pricing lists all four plans', async ({ page }) => {
    await page.goto('/pricing');
    await expect(page.getByText(/Free Forever/i)).toBeVisible();
    await expect(page.getByText(/Silver/)).toBeVisible();
    await expect(page.getByText(/Gold/)).toBeVisible();
    await expect(page.getByText(/Platinum/)).toBeVisible();
  });

  test('safety page emits FAQPage JSON-LD', async ({ page }) => {
    await page.goto('/safety');
    const scripts = await page.locator('script[type="application/ld+json"]').allTextContents();
    const joined = scripts.join('\n');
    expect(joined).toContain('FAQPage');
    expect(joined).toContain('end-to-end encrypted');
  });

  test('root layout emits Organization JSON-LD', async ({ page }) => {
    await page.goto('/');
    const scripts = await page.locator('script[type="application/ld+json"]').allTextContents();
    expect(scripts.some((s) => s.includes('"@type":"Organization"'))).toBe(true);
  });

  test('sitemap is served', async ({ request }) => {
    const res = await request.get('/sitemap.xml');
    expect(res.status()).toBe(200);
    const body = await res.text();
    expect(body).toContain('<url>');
  });

  test('robots allows crawling', async ({ request }) => {
    const res = await request.get('/robots.txt');
    expect(res.status()).toBe(200);
    const body = await res.text();
    expect(body).toContain('Allow');
  });
});

test.describe('device-aware auth redirects', () => {
  test('desktop /login shows install CTAs', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByText(/sign in to shubhmilan/i)).toBeVisible();
    await expect(page.getByRole('link', { name: /iOS App Store/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Google Play/i })).toBeVisible();
  });
});
