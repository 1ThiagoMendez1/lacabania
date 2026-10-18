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

test('historical orders are paginated beyond PostgREST default 1,000', () => {
  const store = read('src/lib/store.ts');
  assert.match(store, /ORDER_HISTORY_PAGE_SIZE = 400/);
  assert.match(store, /\.range\(offset, offset \+ ORDER_HISTORY_PAGE_SIZE - 1\)/);
  assert.match(store, /loadEntireOrderHistory\(\)/);
});
test('fast refresh only queries open and recently updated orders', () => {
  const store = read('src/lib/store.ts');
  const refresh = store.split('refreshOrdenesYMesas: () => {')[1]?.split('refreshMenuItems: async')[0] || '';
  assert.match(refresh, /\.eq\('estado', 'ABIERTA'\)/);
  assert.match(refresh, /\.limit\(ORDER_REFRESH_RECENT_LIMIT\)/);
  assert.match(refresh, /o\.estado !== 'ABIERTA' \|\| incoming\.has\(o\.id\)/);
  assert.doesNotMatch(refresh, /loadEntireOrderHistory\(\)/);
});
test('unchanged polls do not trigger global rendering', () => {
  assert.match(read('src/lib/store.ts'), /if \(changedOrders \|\| changedMesas\)/);
  assert.match(read('src/lib/store.ts'), /JSON\.stringify\(get\(\)\.menuItems\)/);
  assert.match(read('src/components/layout/AuthWrapper.tsx'), /usePOSStore\(useShallow/);
});
