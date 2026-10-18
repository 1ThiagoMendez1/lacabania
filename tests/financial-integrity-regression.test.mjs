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
