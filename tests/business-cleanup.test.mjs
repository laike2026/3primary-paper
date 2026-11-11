import assert from 'node:assert/strict';
import {test} from 'node:test';
import {testReasons,fingerprint} from '../scripts/business-cleanup-rules-20261111.mjs';
import {assetAliases,canonicalAsset,rewriteAssets,cleanBusinessMetadata,isStorageUrl} from '../lib/business-assets.mjs';
test('test cleanup identifies reserved addresses and explicit fixtures',()=>{
  assert.ok(testReasons('inquiries',{id:'INQ-1',name:'Buyer',email:'qa@example.invalid'}).includes('reserved-test-mail-domain'));
  assert.ok(testReasons('content_products',{id:'QA-123',name:{en:'QA Product'}}).includes('explicit-test-identifier'));
  assert.ok(testReasons('media_assets',{id:'uuid',filename:'qa-logo.jpg'}).includes('explicit-test-filename'));
});
test('real procurement requests, samples and technical company names are preserved',()=>{
  assert.deepEqual(testReasons('inquiries',{id:'INQ-REAL',email:'buyer@actual-supplier.com',name:'Alex',company:'Test Automation Inc.',requirements:'Please test the paper samples for our AI printer.'}),[]);
  for(const id of ['TP-8080','TP-5740','PP-ATM','TP-PRINTED','TP-JUMBO','LB-THERMAL'])assert.deepEqual(testReasons('content_products',{id,name:{en:'Paper samples'}}),[]);
});
test('concurrency fingerprint ignores JSON key order but detects content edits',()=>{
  assert.equal(fingerprint({id:'A',value:{en:'paper',ar:'ورق'}}),fingerprint({value:{ar:'ورق',en:'paper'},id:'A'}));
  assert.notEqual(fingerprint({id:'A',value:'old'}),fingerprint({id:'A',value:'new'}));
});
test('verified company assets use first-party paths and unknown uploads use opaque file IDs',()=>{
  const index={files:{'/images/paper.webp':{sha256:'verified'}}};
  const row={id:'asset-1',storage_key:'/images/paper.webp',url:'https://store.public.blob.vercel-storage.com/paper.webp',sha256:'verified'};
  assert.equal(canonicalAsset(row,index),'/images/paper.webp');
  assert.equal(canonicalAsset({...row,sha256:'different'},index),'/files/asset-1');
  assert.deepEqual(rewriteAssets({image:row.url},assetAliases([row],index)),{image:'/images/paper.webp'});
  assert.equal(cleanBusinessMetadata('AI-generated editorial illustration'),'Illustrative artwork');
  assert.equal(cleanBusinessMetadata('Company materials supplied 2026-11-02'),'Company materials supplied 2026-11-02');
});
test('file delivery cannot target private hosts or disguised storage domains',()=>{
  assert.equal(isStorageUrl('https://store.public.blob.vercel-storage.com/media/file.webp'),true);
  for(const url of ['http://127.0.0.1/file','https://store.public.blob.vercel-storage.com.evil.test/file','https://user:pass@store.public.blob.vercel-storage.com/file','https://store.public.blob.vercel-storage.com/file?token=secret','file:///private'])assert.equal(isStorageUrl(url),false,url);
});
