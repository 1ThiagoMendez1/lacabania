import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';

const module = { exports: {} };
runInNewContext(ts.transpileModule(readFileSync(new URL('../src/lib/orderItems.ts', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, { module, exports: module.exports });
const { groupOrderItems, allocateCancellation, groupStatusLabel } = module.exports;
const unit = (id, extra = {}) => ({ id, menuItemId: 'churrasco', nombre: 'Churrasco', precioUnitario: 30000, cantidad: 1, estacion: 'PARRILLA', estado: 'EN PREPARACION', createdAt: `2026-11-08T18:0${id}:00Z`, ...extra });

test('three separate additions render as one product with three units and retain originals', () => {
  const items = [unit('1'), unit('2'), unit('3')];
  const groups = groupOrderItems(items);
  assert.equal(groups.length, 1);
  assert.equal(groups[0].cantidad, 3);
  assert.equal(groups[0].items.length, 3);
  assert.equal(items[0].cantidad, 1);
  assert.equal(groups[0].createdAt, items[0].createdAt);
});
test('preparation states share one visible product and report the actual quantities', () => {
  const group = groupOrderItems([unit('1'), unit('2', { estado: 'LISTO', cantidad: 2 })])[0];
  assert.equal(group.cantidad, 3);
  assert.equal(groupStatusLabel(group), '1 en preparación · 2 listo(s)');
});
test('observations, canceled units, prices and different products remain distinct', () => {
  assert.equal(groupOrderItems([unit('1'), unit('2', { notas: 'Sin cebolla' }), unit('3', { estado: 'CANCELADO' }), unit('4', { precioUnitario: 25000 }), unit('5', { menuItemId: 'pollo' })]).length, 5);
});
test('canceling two units allocates across their original additions, newest pending first', () => {
  const allocation = allocateCancellation([unit('1', { estado: 'ENTREGADO' }), unit('2'), unit('3')], 2);
  assert.equal(JSON.stringify(allocation), JSON.stringify([{ id: '3', cantidad: 1 }, { id: '2', cantidad: 1 }]));
});
test('quantity validation excludes canceled units and accepts a partial source line', () => {
  const items = [unit('1', { cantidad: 3 }), unit('2', { estado: 'CANCELADO', cantidad: 2 })];
  assert.equal(allocateCancellation(items, 2)[0].cantidad, 2);
  for (const quantity of [0, -1, 1.5, 4, NaN]) assert.throws(() => allocateCancellation(items, quantity));
});
