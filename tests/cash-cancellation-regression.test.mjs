import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const source = (path) => readFileSync(join(root, path), 'utf8');

test('cash desk lists a table whenever it has an open order, regardless of stale table status', () => {
  const caja = source('src/app/caja/page.tsx');
  assert.match(caja, /const mesasConOrden = mesas\.filter\(m => ordenes\.some\(o => o\.mesaId === m\.id && o\.estado === 'ABIERTA'\)\)/);
});
test('cash desk awaits closing and does not confirm or print on failure', () => {
  const caja = source('src/app/caja/page.tsx');
  assert.match(caja, /await closeOrden\(/);
  assert.match(caja, /title: 'No se confirmó el pago'/);
  assert.match(caja, /if \(isClosing\) return/);
});
test('cash register propagates Supabase errors to UI and refreshes persisted state', () => {
  const store = source('src/lib/store.ts');
  assert.match(store, /throw new Error\(error\.message \|\| 'No se pudo actualizar orden'\)/);
  assert.match(store, /throw new Error\(error\.message \|\| 'No se pudo actualizar mesa'\)/);
  assert.match(store, /Cierre no confirmado\. Verifique estado/);
});
test('financial reports exclude canceled line items from totals and costs', () => {
  const dashboard = source('src/app/dashboard/page.tsx');
  assert.doesNotMatch(dashboard, /o\.items\.reduce\(/);
  assert.match(dashboard, /filter\(i => i\.estado !== 'CANCELADO'\)/);
  assert.match(dashboard, /filter\(\(item: any\) => item\.estado !== 'CANCELADO'\)/);
});
test('release-table displays failure instead of silently claiming cancellation persisted', () => {
  const mesas = source('src/app/mesas/page.tsx');
  assert.match(mesas, /No se confirmó la cancelación/);
  assert.match(mesas, /items\.some\(item => item\.estado !== 'CANCELADO'\)/);
  assert.match(mesas, /await updateOrden\(activeOrder\.id, \{ estado: 'ANULADA' \}\)/);
});
