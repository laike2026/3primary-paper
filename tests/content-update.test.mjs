import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {reviseProduct, reviseWebsite, grammage, jumboWidths, packagingPath, catalogPath, coverPath, customSizeCopy, locales} from '../scripts/content-update-20261110.mjs';
const products=JSON.parse(readFileSync(new URL('../data/material-products.json',import.meta.url),'utf8'));

test('approved paper specifications agree in every locale and remain idempotent',()=>{
  for(const id of ['TP-8080','TP-5740','PP-ATM','TP-PRINTED','TP-JUMBO']){
    const p=products.find(p=>p.id===id);assert.ok(p,id);
    const spec=p.specifications.find(s=>s.key.en==='Paper grammage');
    for(const locale of locales)assert.equal(spec.value[locale],'35 / 40 / 45 / 48 / 55 / 60 / 65 / 70 / 75 / 80 gsm');
    assert.equal(grammage,spec.value.en);assert.deepEqual(reviseProduct(p),p);
  }
  assert.equal(products.find(p=>p.id==='TP-JUMBO').size,'405 / 565 / 636 / 790 / 795 mm');
  assert.equal(jumboWidths,products.find(p=>p.id==='TP-JUMBO').size);
  for(const id of ['TP-8080','TP-5740']){
    const p=products.find(p=>p.id===id),s=p.specifications.find(s=>s.key.en==='Common sizes / width');
    for(const locale of locales)assert.ok(s.value[locale].endsWith(customSizeCopy[locale]));
  }
});

test('updating repeated images and documents preserves unrelated product facts',()=>{
  const before={id:'UNRELATED',size:'100 × 150 mm',image:'https://sample.public.blob.vercel-storage.com/materials-2026-11/product-01-2.webp',
    gallery:['/images/materials/product-01-2.webp','/images/other.webp'],documents:['https://sample.public.blob.vercel-storage.com/materials-2026-11/3primary-product-catalog-2026-11.pdf'],
    specifications:[{key:{en:'Adhesive'},value:{en:'Customer-confirmed option'}}],name:{en:'Existing item'},source:'Original evidence'};
  const next=reviseProduct(before);
  assert.equal(next.image,packagingPath);assert.equal(next.gallery[0],packagingPath);assert.equal(next.documents[0],catalogPath);
  assert.equal(next.gallery[1],before.gallery[1]);assert.equal(next.size,before.size);assert.deepEqual(next.specifications,before.specifications);
  assert.deepEqual(next.name,before.name);assert.equal(next.source,before.source);assert.notEqual(next,before);
});

test('catalog download entry uses the four-product cover and final file',()=>{
  const row={kind:'download',topic:'catalog',image:'/images/materials/product-01-2.webp',file_url:'/downloads/3primary-product-catalog-2026-11.pdf',status:'published'};
  const next=reviseWebsite(row);assert.equal(next.image,coverPath);assert.equal(next.file_url,catalogPath);assert.equal(next.status,'published');
  assert.deepEqual(reviseWebsite(next),next);
});
