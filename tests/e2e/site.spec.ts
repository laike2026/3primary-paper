import {test, expect} from '@playwright/test';

const locales = ['en', 'ar', 'ru', 'es'];

for (const locale of locales) {
  test(`${locale} home and core content render`, async ({page}) => {
    await page.goto(`/${locale}`);
    await expect(page.locator('html')).toHaveAttribute('lang', locale);
    await expect(page.locator('html')).toHaveAttribute('dir', locale === 'ar' ? 'rtl' : 'ltr');
    await expect(page.locator('main h1')).toHaveCount(1);
    await expect(page.locator('main h1')).toBeVisible();
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', new RegExp(`/${locale}$`));
    await expect(page.locator('link[hreflang="ar"]')).toHaveCount(1);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
    await expect(page.getByRole('link', {name: /products|المنتجات|продукция|productos/i}).first()).toBeVisible();
  });
}

test('product search, filter, detail and locale switch preserve the product URL', async ({page}) => {
  await page.goto('/en/products');
  await page.getByRole('combobox', {name: 'Category'}).selectOption('thermal-labels');
  await expect(page.locator('.page-card-grid').last().locator('.page-card')).toHaveCount(1);
  await page.getByRole('combobox', {name: 'Category'}).selectOption('all');
  await page.getByRole('searchbox').fill('80x80');
  const results = page.locator('.page-card-grid').last().locator('.page-card');
  await expect(results).toHaveCount(1);
  await results.first().getByRole('link').first().click();
  await expect(page).toHaveURL(/\/en\/product\/80x80-thermal-paper-roll$/);
  await expect(page.locator('main h1')).toHaveCount(1);
  await page.getByRole('combobox', {name: 'Language'}).selectOption('es');
  await expect(page).toHaveURL(/\/es\/product\/80x80-thermal-paper-roll$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'es');
});

test('mobile menu works and 375px page has no horizontal overflow', async ({page}) => {
  await page.setViewportSize({width: 375, height: 812});
  await page.goto('/en');
  const menu = page.getByRole('button', {name: /menu/i});
  await menu.click();
  await expect(page.getByRole('navigation', {name: 'Mobile navigation'})).toBeVisible();
  await page.getByRole('navigation', {name: 'Mobile navigation'}).getByRole('link', {name: 'Products'}).click();
  await expect(page).toHaveURL(/\/en\/products$/);
  const noOverflow = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
  expect(noOverflow).toBe(true);
});

test('published sections, checklist and unknown page', async ({page}) => {
  const paths = ['products/thermal-paper-rolls', 'applications/retail-pos', 'brands', 'oem-odm', 'manufacturing-quality', 'about', 'resources', 'resources/rfq-checklist', 'blog', 'faq', 'contact', 'privacy-policy', 'terms'];
  for (const path of paths) {
    const response = await page.goto(`/en/${path}`);
    expect(response?.status(), path).toBe(200);
    await expect(page.locator('main h1')).toHaveCount(1);
  }
  const response = await page.goto('/en/does-not-exist');
  expect(response?.status()).toBe(404);
  const unknownLocale = await page.goto('/unknown-locale');
  expect(unknownLocale?.status()).toBe(404);
});

test('checklist download and legacy navigation work', async ({page, request}) => {
  await page.goto('/en/resources/rfq-checklist');
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('link', {name: 'Download checklist'}).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('paper-rfq-checklist-en.txt');
  const response = await request.get('/en/products.html', {maxRedirects: 0});
  expect(response.status()).toBe(308);
  expect(response.headers().location).toBe('/en/products');
});

test('unconfigured inquiry never reports success', async ({page}) => {
  await page.goto('/en/contact');
  await page.locator('[name="name"]').fill('Buyer Name');
  await page.locator('[name="company"]').fill('Sample Buyer Ltd');
  await page.locator('[name="email"]').fill('buyer@example.com');
  await page.locator('[name="country"]').fill('United Kingdom');
  await page.locator('[name="productId"]').selectOption('TP-8080');
  await page.locator('[name="requirements"]').fill('Please quote this product for our retail business.');
  await page.locator('[name="consent"]').check();
  await page.locator('form#inquiry button[type="submit"]').click();
  await expect(page.getByRole('status')).toContainText(/unavailable|email/i);
  await expect(page.getByRole('status')).not.toContainText('TP-');
});
