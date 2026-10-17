import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const root = dirname(dirname(fileURLToPath(import.meta.url)));
test('realtime subscription is reused across page mounts', () => {
 const source = readFileSync(join(root, 'src/lib/store.ts'), 'utf8');
 assert.match(source, /let realtimeSubscriptionCreated = false/);
 assert.match(source, /if \(realtimeSubscriptionCreated\) return/);
 const setup = source.split('setupRealtime: () => {')[1]?.split('setUser:')[0] || '';
 assert.doesNotMatch(setup, /supabase\.removeAllChannels\(/);
});
test('no destructive schema bootstrap', () => {
 const sql = readFileSync(join(root, 'supabase/schema.sql'), 'utf8');
 assert.doesNotMatch(sql, /^\s*DROP\s+(TABLE|TYPE)\b/im);
});
