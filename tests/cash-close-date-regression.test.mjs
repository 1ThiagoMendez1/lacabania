import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const dashboard = readFileSync(join(root, 'src/app/dashboard/page.tsx'), 'utf8');
const cierre = readFileSync(join(root, 'src/app/cierre/page.tsx'), 'utf8');

test('pre-close and dashboard both calculate the real Bogotá day rather than stale August operative date', () => {
  assert.match(dashboard, /const activeCloseDate = cierreFecha \|\| dashboardToday/);
  assert.match(dashboard, /const activeDate = cierreFecha \|\| dashboardToday/);
  assert.match(dashboard, /const kpiVentasCerradas = useMemo/);
  assert.match(dashboard, /orderDate === dashboardToday/);
  assert.match(dashboard, /o\.estado === 'CERRADA'[\s\S]{0,100}getOrderLocalDateStr\(o\.updatedAt \|\| o\.createdAt\) === activeCloseDate/);
  assert.match(dashboard, /Fecha del cierre: \{activeCloseDate\}/);
  assert.doesNotMatch(dashboard, /const activeCloseDate = cierreFecha \|\| fechaOperativa/);
});

test('pre-close cannot approve live orders from an old operative date', () => {
  assert.match(dashboard, /const pedidosAbiertosHoy = ordenes\.filter\(o => o\.estado === 'ABIERTA'\)\.length/);
  assert.match(dashboard, /disabled=\{totalPedidosHoy === 0 \|\| pedidosAbiertosHoy > 0\}/);
  assert.match(dashboard, /supabase\.from\('ordenes'\)\.select\('id'\)\.eq\('estado', 'ABIERTA'\)\.limit\(1\)/);
  assert.match(dashboard, /supabase\.from\('cierres_diarios'\)\.select\('fecha'\)\.eq\('fecha', fechaCierre\)\.limit\(1\)/);
});

test('administrative zero-income close rejects sales and does not advance historic operative dates', () => {
  assert.match(dashboard, /disabled=\{ventasCerradas\.length > 0 \|\| pedidosAbiertosHoy > 0 \|\| isSubmittingCierre\}/);
  assert.match(dashboard, /Cierre de \$0 bloqueado/);
  assert.match(dashboard, /if \(fechaCierre === dashboardToday\) handleIniciarSiguienteDia\(fechaCierre\)/);
});

test('dedicated close route defaults to today and applies the explicitly selected historical date consistently', () => {
  assert.match(cierre, /const fechaCierreHoy = getBogotaDateString\(\)/);
  assert.match(cierre, /const fechaCierre = selectedDate \|\| fechaCierreHoy/);
  assert.match(cierre, /gastos\.filter\(g => g\.fecha === fechaCierre\)/);
  assert.match(cierre, /const closureData = \{\s*fecha: fechaCierre/);
  assert.match(cierre, /const record = \{\s*fecha: fechaCierre/);
  assert.doesNotMatch(cierre, /getOrderLocalDateStr\(o\.updatedAt \|\| o\.createdAt\) === fechaOperativa/);
  assert.doesNotMatch(cierre, /o\.items\.reduce\(/);
});

test('dedicated close route rejects persisted open orders or duplicate server closures', () => {
  assert.match(cierre, /const \[openOrdersCheck, existingCloseCheck\] = await Promise\.all/);
  assert.match(cierre, /if \(\(openOrdersCheck\.data \|\| \[\]\)\.length > 0\)/);
  assert.match(cierre, /if \(\(existingCloseCheck\.data \|\| \[\]\)\.length > 0\)/);
});
