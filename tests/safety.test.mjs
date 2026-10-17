import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';

const root = dirname(dirname(fileURLToPath(import.meta.url)));

function loadSimpleTypescript(relativePath) {
  const source = readFileSync(join(root, relativePath), 'utf8');
  const { outputText, diagnostics } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    reportDiagnostics: true,
  });
  assert.equal(diagnostics?.length ?? 0, 0);
  const module = { exports: {} };
  runInNewContext(outputText, { module, exports: module.exports, Response, Intl, Date });
  return { exported: module.exports, source };
}

test('GET /api/reset never deletes user data', async () => {
  const { exported, source } = loadSimpleTypescript('src/app/api/reset/route.ts');
  assert.doesNotMatch(source, /from\s*\(|\.delete\s*\(|\.update\s*\(|\.rpc\s*\(/);
  const response = await exported.GET();
  assert.equal(response.status, 410);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  const json = await response.json();
  assert.equal(json.success, false);
});

test('timezone helpers produce Colombian business dates', () => {
  const { exported } = loadSimpleTypescript('src/lib/dateUtils.ts');
  assert.match(exported.getBogotaDateString(), /^\d{4}-\d{2}-\d{2}$/);
  assert.equal(exported.toBogotaDate('2026-10-17T10:15:00Z').toISOString(), '2026-10-17T10:15:00.000Z');
  assert.ok(Math.abs(Date.parse(exported.getBogotaISOString()) - Date.now()) < 2000);
});

test('database bootstrap cannot drop existing business tables or types', () => {
  const sql = readFileSync(join(root, 'supabase/schema.sql'), 'utf8');
  assert.doesNotMatch(sql, /^\s*DROP\s+(?:TABLE|TYPE)\b/im);
  assert.match(sql, /CREATE\s+TYPE\s+public\.order_status/i);
});

test('order cancellation uses the database enum', () => {
  const source = readFileSync(join(root, 'src/app/mesas/page.tsx'), 'utf8');
  assert.match(source, /updateOrden\(activeOrder\.id,\s*\{\s*estado:\s*'ANULADA'/);
  assert.doesNotMatch(source, /estado:\s*'CANCELADA'/);
});
