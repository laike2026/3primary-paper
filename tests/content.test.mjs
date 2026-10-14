import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const locales = ['en', 'ar', 'ru', 'es'];
const messages = Object.fromEntries(locales.map(locale => [locale, JSON.parse(readFileSync(new URL(`../messages/${locale}.json`, import.meta.url), 'utf8'))]));
function keys(value, prefix = '') {
  return Object.entries(value).flatMap(([key, child]) => typeof child === 'object' && child !== null ? keys(child, `${prefix}${key}.`) : [`${prefix}${key}`]);
}

test('every locale has the same translation keys and no empty translation', () => {
  const reference = keys(messages.en).sort();
  for (const locale of locales) {
    assert.deepEqual(keys(messages[locale]).sort(), reference, `${locale} translation keys`);
    for (const key of reference) {
      const value = key.split('.').reduce((part, segment) => part[segment], messages[locale]);
      assert.equal(typeof value, 'string');
      assert.ok(value.trim(), `${locale}.${key} is empty`);
    }
  }
});

test('published product records carry a unique ID and a source URL', () => {
  const source = readFileSync(new URL('../lib/content.ts', import.meta.url), 'utf8');
  const ids = [...source.matchAll(/id: '([A-Z]+-[A-Z0-9]+)'/g)].map(match => match[1]);
  assert.ok(ids.length >= 5);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal((source.match(/status: 'published'/g) || []).length, ids.length);
  assert.match(source, /productRecords\.filter\(item => item\.status === 'published'\)/);
  assert.ok((source.match(/source: 'https?:\/\//g) || []).length >= ids.length);
});
