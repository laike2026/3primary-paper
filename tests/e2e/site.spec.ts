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
    await expect(page.locator('.analytics-consent')).toContainText(({en:'Allow analytics',ar:'السماح بالتحليلات',ru:'Разрешить аналитику',es:'Permitir análisis'} as Record<string,string>)[locale]);
  });
}

test('product search, filter, detail and locale switch preserve the product URL', async ({page}) => {
  await page.goto('/en/products');
  await page.getByRole('group', {name: 'Product families', exact:true}).getByRole('radio', {name:'Thermal Labels',exact:true}).check();
  await expect(page.locator('.page-card-grid').last().locator('.page-card')).toHaveCount(3);
  await page.getByRole('group', {name: 'Product families',exact:true}).getByRole('radio', {name:'All products',exact:true}).check();
  const results = page.locator('.page-card-grid').last().locator('.page-card');
  for (const query of ['80x80', '80×80', '80 x 80', '80 × 80 mm', '٨٠ × ٨٠']) {
    await page.getByRole('searchbox').fill(query);
    await expect(results).toHaveCount(1);
  }
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
  await expect(page.locator('body')).toHaveCSS('overflow','hidden');
  await expect(page.locator('.mobile-nav-backdrop')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('navigation', {name: 'Mobile navigation'})).toHaveCount(0);
  await expect(page.locator('body')).not.toHaveCSS('overflow','hidden');
  await menu.click();
  await page.getByRole('navigation', {name: 'Mobile navigation'}).getByRole('link', {name: 'Products'}).click();
  await expect(page).toHaveURL(/\/en\/products$/);
  const noOverflow = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
  expect(noOverflow).toBe(true);
});

test('mobile search and quote actions reach usable controls', async ({page}) => {
  await page.setViewportSize({width: 390, height: 844});
  await page.goto('/en');
  await page.getByRole('button', {name:'Decline analytics'}).click();
  await page.locator('header .icon-link').click();
  await expect(page.getByRole('searchbox')).toBeFocused();
  const search = await page.getByRole('searchbox').boundingBox();
  expect(search?.y).toBeLessThan(420);
  await page.goto('/en/product/80x80-thermal-paper-roll');
  const heading = await page.locator('main h1').boundingBox();
  const gallery = await page.locator('.material-product-gallery').boundingBox();
  expect(heading!.y).toBeLessThan(gallery!.y);
  await page.locator('.detail-actions a[href="#inquiry"]').click();
  await expect(page).toHaveURL(/#inquiry$/);
  await expect(page.locator('.whatsapp-float')).toBeVisible();
  await expect.poll(async () => {
    const heading=await page.locator('.product-quote h2').first().boundingBox();
    const header=await page.locator('.site-header').boundingBox();
    return Boolean(heading&&header&&heading.y>=header.y+header.height);
  }).toBe(true);
  await expect(page.locator('[name="productId"]')).toHaveValue('TP-8080');
  await expect.poll(() => page.evaluate(() => {
    const select = document.querySelector<HTMLSelectElement>('#inquiry select')!;
    const rect = select.getBoundingClientRect();
    const top = Math.max(0,rect.top);
    const bottom = Math.min(innerHeight,rect.bottom);
    return bottom > top && document.elementFromPoint(rect.right - 20,(top + bottom) / 2) === select;
  })).toBe(true);
});

test('privacy settings withdraw consent and clear visitor storage', async ({page}) => {
  await page.route('**/api/events',route=>route.fulfill({status:202,body:''}));
  await page.goto('/en?private=ignore');
  await page.getByRole('button',{name:'Allow analytics'}).click();
  await expect.poll(()=>page.evaluate(()=>sessionStorage.getItem('primary_session'))).not.toBeNull();
  await page.getByRole('button',{name:'Privacy settings'}).click();
  const preferences=page.getByRole('dialog',{name:'Privacy settings'});
  await expect(preferences).toBeVisible();
  await preferences.getByRole('button',{name:'Decline analytics'}).click();
  await expect(preferences).not.toBeVisible();
  expect(await page.evaluate(()=>({
    consent:document.cookie.includes('analytics_consent=no'),
    visitor:document.cookie.includes('primary_visitor='),
    session:sessionStorage.getItem('primary_session'),
    queue:localStorage.getItem('primary_analytics_queue'),
  }))).toEqual({consent:true,visitor:false,session:null,queue:null});
});

test('consented product visits record both page and product views', async ({page}) => {
  const types:string[]=[];
  const productIds:string[]=[];
  await page.addInitScript(() => {document.cookie='analytics_consent=yes; Path=/; SameSite=Lax';});
  await page.route('**/api/events', async route => {
    const body=route.request().postDataJSON() as {type:string;productId?:string};
    types.push(body.type);
    if(body.type==='product_view')productIds.push(body.productId||'');
    await route.fulfill({status:202,body:''});
  });
  await page.goto('/en/product/80x80-thermal-paper-roll');
  await expect.poll(()=>types).toContain('page_view');
  await expect.poll(()=>types).toContain('product_view');
  await expect.poll(()=>productIds).toContain('TP-8080');
});

test('published sections, checklist and unknown page', async ({page}) => {
  test.setTimeout(120_000);
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

test('articles are absent without a manually published CMS record', async ({page}) => {
  await page.goto('/en');
  await expect(page.locator('.resource-card')).toHaveCount(0);
  await page.goto('/en/blog');
  await expect(page.locator('.resource-card')).toHaveCount(0);
  const formerSeededArticle=await page.goto('/en/blog/measure-thermal-roll');
  expect(formerSeededArticle?.status()).toBe(404);
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
  await expect(page.locator('#inquiry [role="alert"]')).toContainText(/unavailable|email/i);
  await expect(page.locator('#inquiry [role="alert"]')).not.toContainText('TP-');
});

test('admin login uses the official brand asset', async ({page}) => {
  await page.goto('/admin/login');
  await expect(page.getByRole('heading', {name:'欢迎回来'})).toBeVisible();
  await expect(page.getByRole('img', {name:'3PRIMARY'})).toBeVisible();
});
