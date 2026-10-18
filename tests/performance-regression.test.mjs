import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const read = path => readFileSync(join(root, path), 'utf8');

test('concurrent order refreshes share a single in-flight request', () => {
  const store = read('src/lib/store.ts');
  assert.match(store, /if \(activeOrdersRefresh\) return activeOrdersRefresh/);
  assert.match(store, /activeOrdersRefresh = \(async \(\) => \{/);
  assert.match(store, /\.finally\(\(\) => \{ activeOrdersRefresh = null; \}\)/);
});
test('polling skips background tabs and does not run every five seconds', () => {
  for (const page of ['caja', 'mesas', 'dashboard', 'menu', 'estaciones/[id]']) {
    const src = read('src/app/' + page + '/page.tsx');
    assert.match(src, /document\.visibilityState === 'hidden'/, page);
    assert.doesNotMatch(src, /}, 5000\);/, page);
    assert.match(src, /}, 20000\);/, page);
  }
});
