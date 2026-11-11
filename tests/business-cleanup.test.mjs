import assert from 'node:assert/strict';
import {test} from 'node:test';
import {testReasons,fingerprint} from '../scripts/business-cleanup-rules-20261111.mjs';
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
