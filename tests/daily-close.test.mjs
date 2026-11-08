import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';

function load(relative, imports = {}) {
  const text = readFileSync(new URL(`../src/lib/${relative}.ts`, import.meta.url), 'utf8');
  const module = { exports: {} };
  const compiled = ts.transpileModule(text, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  runInNewContext(compiled, { module, exports: module.exports, Intl, Date, require: path => imports[path] });
  return module.exports;
}
const dates = load('dateUtils');
const { getPendingCloseDays, orderBusinessDate, hasBlockingOpenOrder, isValidBusinessDate } = load('dailyClose', { './dateUtils': dates });
const { mapOrderItem } = load('orderItems');
function order(date, estado = 'CERRADA', extra = {}) {
  return { id: date, estado, createdAt: `${date}T18:00:00Z`, updatedAt: `${date}T19:00:00Z`, items: [
    { cantidad: 1, precioUnitario: 30000, estado: 'ENTREGADO' },
    { cantidad: 2, precioUnitario: 30000, estado: 'CANCELADO' },
  ], ...extra };
}

test('reminders include only worked dates, expenses-only dates and confirmed missing closures', () => {
  const pending = getPendingCloseDays([order('2026-11-05'), order('2026-11-07'), order('2026-11-08'), order('2026-11-09')],
    [{ fecha: '2026-11-06', valor: 5000 }], ['2026-11-07'], '2026-11-08');
  assert.equal(JSON.stringify(pending.map(day => day.fecha)), JSON.stringify(['2026-11-05', '2026-11-06', '2026-11-08']));
  assert.equal(pending[0].total, 30000);
  assert.equal(pending[1].gastos, 5000);
  assert.equal(pending[1].pedidos, 0);
});
test('empty activity and already closed dates produce no reminder', () => {
  assert.equal(getPendingCloseDays([], [], [], '2026-11-08').length, 0);
  assert.equal(getPendingCloseDays([order('2026-11-08')], [], ['2026-11-08'], '2026-11-08').length, 0);
});
test('invalid calendar dates are rejected without crashing the close page', () => {
  assert.equal(isValidBusinessDate('2026-99-99'), false);
  assert.equal(isValidBusinessDate('2026-02-31'), false);
  assert.equal(isValidBusinessDate(''), false);
  assert.equal(isValidBusinessDate('2026-11-08'), true);
});
test('payments after UTC midnight remain on the Colombian date and canceled units never increase the total', () => {
  const crossMidnight = order('2026-11-07', 'CERRADA', { updatedAt: '2026-11-08T03:59:59Z', propina: 3000 });
  assert.equal(orderBusinessDate(crossMidnight), '2026-11-07');
  assert.equal(getPendingCloseDays([crossMidnight], [], [], '2026-11-08')[0].total, 33000);
});
test('open orders from earlier days block their close; today orders allow regularizing earlier days', () => {
  assert.equal(hasBlockingOpenOrder([order('2026-11-08', 'ABIERTA')], '2026-11-07', '2026-11-08'), false);
  assert.equal(hasBlockingOpenOrder([order('2026-11-07', 'ABIERTA')], '2026-11-07', '2026-11-08'), true);
  assert.equal(hasBlockingOpenOrder([order('2026-11-06', 'ABIERTA')], '2026-11-08', '2026-11-08'), true);
});
test('payment day is used for closed orders and creation day for open orders', () => {
  const row = order('2026-11-07', 'ABIERTA', { updatedAt: '2026-11-08T18:00:00Z' });
  assert.equal(orderBusinessDate(row), '2026-11-07');
  assert.equal(orderBusinessDate({ ...row, estado: 'CERRADA' }), '2026-11-08');
  const pending = getPendingCloseDays([{ ...row, estado: 'CERRADA' }], [], [], '2026-11-08');
  assert.equal(pending.length, 2);
  assert.equal(pending[0].fecha, '2026-11-07');
  assert.equal(pending[0].total, 0);
  assert.equal(pending[1].total, 30000);
});
test('exact event times include seconds, always use Colombia and do not invent missing times', () => {
  const output = dates.formatBogotaDateTime('2026-11-08T03:12:34Z');
  assert.match(output, /07\/11\/2026/);
  assert.match(output, /22:12:34/);
  assert.equal(dates.formatBogotaDateTime(undefined), 'Sin registro');
  assert.equal(dates.formatBogotaDateTime('invalid'), 'Sin registro');
});
test('database reload retains cancellation actor, reason, timestamp and quantity', () => {
  const item = mapOrderItem({ id: 'a', cantidad: 2, precio_unitario: '30000', estado: 'CANCELADO',
    created_at: '2026-11-07T18:00:00Z', canceled_at: '2026-11-07T18:12:34Z', canceled_by: 'user', cancellation_reason: 'Solo uno' });
  assert.equal(item.cantidad, 2);
  assert.equal(item.precioUnitario, 30000);
  assert.equal(item.canceledAt, '2026-11-07T18:12:34Z');
  assert.equal(item.canceledBy, 'user');
  assert.equal(item.cancellationReason, 'Solo uno');
});
