import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const src = readFileSync(join(dirname(dirname(fileURLToPath(import.meta.url))), 'src/app/dashboard/page.tsx'), 'utf8');
const closing = src.split('const handleConfirmarCierre = async')[1]?.split('const handleIniciarSiguienteDia')[0] || '';

test('cash closure requires server confirmation before persisting local success', () => {
  const insert = closing.indexOf(".from('cierres_diarios').insert(");
  const errorCheck = closing.indexOf("if (error) {");
  const localMark = closing.indexOf("localStorage.setItem('cierre_'");
  const lock = closing.indexOf('setCajaCerrada(true)');
  assert.ok(insert >= 0 && errorCheck > insert && localMark > errorCheck && lock > errorCheck);
  assert.match(closing, /return false;/);
  assert.match(closing, /finally \{/);
});

test('financial close wizard never shows success after an unsuccessful save', () => {
  assert.match(src, /if \(await handleConfirmarCierre\(\)\) setCierreStep\(3\)/);
  assert.match(src, /if \(await handleConfirmarCierre\(\)\) setIsAdminDayOpen\(false\)/);
});

test('dashboard does not silently rewrite archived financial dates on mount', () => {
  assert.doesNotMatch(src, /\.from\('ordenes'\)\.update\(\{ updated_at: parsed\.timestamp \}\)/);
  assert.doesNotMatch(src, /localStorage\.removeItem\(key\)/);
  assert.doesNotMatch(src, /startsWith\('cierre_2026-06-'\)/);
});

test('secondary cash close route also waits for Supabase and ignores canceled items', () => {
  const secondary = readFileSync(join(dirname(dirname(fileURLToPath(import.meta.url))), 'src/app/cierre/page.tsx'), 'utf8');
  const block = secondary.split('const handleConfirmarCierre = async')[1]?.split('return (\n    <main')[0] || '';
  const insert = block.indexOf(".from('cierres_diarios').insert(record)");
  const local = block.indexOf("localStorage.setItem(");
  const errorCheck = block.indexOf("if (error) {");
  assert.ok(insert >= 0 && errorCheck > insert && local > errorCheck);
  assert.match(block, /if \(ordenes\.some\(o => o\.estado === 'ABIERTA'\)\)/);
  assert.match(block, /finally \{/);
  assert.match(secondary, /filter\(\(item: any\) => item.estado !== 'CANCELADO'\)/);
  assert.match(secondary, /el día operativo es \{fechaOperativa\}/);
});
test('reopening a cash day updates local state only after the database permits it', () => {
  const secondary = readFileSync(join(dirname(dirname(fileURLToPath(import.meta.url))), 'src/app/cierre/page.tsx'), 'utf8');
  const dbDelete = secondary.indexOf(".from('cierres_diarios').delete()");
  const errorCheck = secondary.indexOf("if (error) throw new Error(error.message)", dbDelete);
  const localDelete = secondary.indexOf("localStorage.removeItem(", dbDelete);
  assert.ok(dbDelete >= 0 && errorCheck > dbDelete && localDelete > errorCheck);
});
