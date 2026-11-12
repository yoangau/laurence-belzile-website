/**
 * Public site, against `npm run dev` with migrated content (npm run migrate -- … --upload local).
 * Checks what matters for visitors and search engines, not pixels.
 */
import { expect, test } from '@playwright/test';

test('home lists works with the year rail and real images', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle('Laurence Belzile');
  const first = page.locator('[data-feed] img').first();
  await expect(first).toBeVisible();
  expect(await first.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
  await expect(page.locator('[data-year-rail="all"] a').first()).toBeVisible();
});

test('artwork page has SEO tags, JSON-LD and navigation', async ({ page, request }) => {
  await page.goto('/work');
  const href = await page.locator('[data-feed] a').first().getAttribute('href');
  expect(href).toMatch(/^\/projet\//);
  await page.goto(href!);

  const ogImage = await page.locator('meta[property="og:image"]').getAttribute('content');
  expect(ogImage).toMatch(/^https?:\/\/.+\/og\.jpg$/);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://laurencebelzile.com${href}`);
  await expect(page.locator('link[hreflang="en-CA"]')).toHaveAttribute('href', `https://laurencebelzile.com/en${href}`);
  const jsonLd = JSON.parse((await page.locator('script[type="application/ld+json"]').textContent())!);
  expect(['VisualArtwork', 'ExhibitionEvent']).toContain(jsonLd['@type']);

  // og:image is served (through /media in dev).
  const ogPath = new URL(ogImage!).pathname;
  expect((await request.get(ogPath)).status()).toBe(200);

  // Arrow keys go to the next work.
  const next = await page.locator('a[rel="next"]').getAttribute('href');
  await page.keyboard.press('ArrowRight');
  await expect(page).toHaveURL(new RegExp(`${next}$`));
});

test('lightbox opens on click', async ({ page }) => {
  await page.goto('/work');
  await page.goto((await page.locator('[data-feed] a').first().getAttribute('href'))!);
  await page.locator('[data-gallery] a').first().click();
  await expect(page.locator('.pswp')).toBeVisible();
  // PhotoSwipe binds the keyboard once its opening animation ends, so retry until Escape closes it.
  await expect(async () => {
    await page.keyboard.press('Escape');
    await expect(page.locator('.pswp')).toHaveCount(0, { timeout: 500 });
  }).toPass();
});

test('available filter hides sold works and keeps the state in the URL', async ({ page }) => {
  await page.goto('/work');
  const sold = page.locator('[data-feed] .item[data-available="false"]').first();
  await expect(sold).toBeAttached();
  await page.getByRole('button', { name: 'Disponibles' }).click();
  await expect(sold).toBeHidden();
  await expect(page).toHaveURL(/filtre=disponibles/);
  await page.reload();
  await expect(sold).toBeHidden();
});

test('English pages and the language switch', async ({ page }) => {
  await page.goto('/cv');
  await page.getByRole('link', { name: 'English' }).click();
  await expect(page).toHaveURL(/\/en\/cv$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en-CA');
  await expect(page.getByRole('link', { name: 'work', exact: true })).toHaveAttribute('href', '/en/work');
});

test('newsletter sign-up', async ({ page }) => {
  await page.goto('/contact');
  await page.getByPlaceholder('Votre adresse courriel').fill(`e2e-${Date.now()}@example.com`);
  await page.getByRole('button', { name: "S'abonner" }).click();
  await expect(page.getByRole('status')).toContainText('Merci');
});

test('old URLs still work', async ({ request }) => {
  for (const path of ['/catalogue2026.pdf', '/resume/Belzile_CV_FR.pdf', '/projects/compressed/LB00001.jpg']) {
    const res = await request.get(path, { maxRedirects: 0 });
    expect(res.status(), path).toBe(301);
  }
});
