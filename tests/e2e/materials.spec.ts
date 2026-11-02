import {test,expect} from '@playwright/test';

test('product gallery, procurement questions and current catalog are connected',async({page,request})=>{
  await page.goto('/en/product/80x80-thermal-paper-roll');
  const gallery=page.locator('.material-product-gallery');
  const first=await gallery.locator('.detail-image img').getAttribute('src');
  await gallery.getByRole('button').nth(1).click();
  await expect(gallery.getByRole('button').nth(1)).toHaveAttribute('aria-pressed','true');
  expect(await gallery.locator('.detail-image img').getAttribute('src')).not.toBe(first);
  await expect(page.locator('main')).toContainText('Paper grammage');
  await expect(page.locator('main .faq-list details')).toHaveCount(5);
  await page.goto('/en/resources');
  const catalog=page.getByRole('link',{name:'Preview catalog ↗'});
  const url=await catalog.getAttribute('href');
  expect(url).toContain('3primary-product-catalog-2026-11.pdf');
  const response=await request.get(url!);
  expect(response.status()).toBe(200);
  expect((await response.body()).subarray(0,5).toString()).toBe('%PDF-');
});

test('draft claims are excluded and multilingual FAQ is complete',async({page})=>{
  expect((await page.goto('/en/product/bpa-bps-free-thermal-roll'))?.status()).toBe(404);
  for(const locale of ['en','ar','ru','es']){
    await page.goto(`/${locale}/faq`);
    await expect(page.locator('main details')).toHaveCount(20);
    expect(await page.locator('main').innerText()).not.toMatch(/USD 1,550|12,000|to be confirmed|maigebio/i);
    await expect(page.locator('html')).toHaveAttribute('dir',locale==='ar'?'rtl':'ltr');
  }
});

test('new layouts fit small screens including Arabic',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  for(const path of ['/en/resources','/en/manufacturing-quality','/en/product/fanfold-shipping-labels','/ar/faq','/ar/product/thermal-transfer-paper-labels']){
    expect((await page.goto(path))?.status()).toBe(200);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),path).toBe(true);
    await expect(page.locator('main h1')).toBeVisible();
  }
});
