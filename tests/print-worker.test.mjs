import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const require = createRequire(import.meta.url);
const { createQueueWorker } = require('../print-service/queue-worker.js');
const root = dirname(dirname(fileURLToPath(import.meta.url)));
const logger = { log() {}, error() {} };

function createFakeQueue(initial) {
  const jobs = new Map(initial.map(job => [job.id, { ...job }]));
  const supabase = {
    from(table) {
      assert.equal(table, 'print_queue');
      function builder(kind, changes = null) {
        const eqs = [];
        return {
          eq(field, value) { eqs.push([field, value]); return this; },
          select() { return this; },
          order() { return this; },
          limit() { return this; },
          async maybeSingle() {
            assert.equal(kind, 'update');
            const row = [...jobs.values()].find(row => eqs.every(([key, value]) => row[key] === value));
            if (!row) return { data: null, error: null };
            Object.assign(row, changes);
            return { data: { id: row.id }, error: null };
          },
          then(resolve, reject) {
            let result;
            if (kind === 'update') {
              for (const row of jobs.values()) {
                if (eqs.every(([key, value]) => row[key] === value)) Object.assign(row, changes);
              }
              result = { error: null };
            } else {
              result = {
                data: [...jobs.values()].filter(row => eqs.every(([key, value]) => row[key] === value)),
                error: null,
              };
            }
            return Promise.resolve(result).then(resolve, reject);
          },
        };
      }
      return { update: patch => builder('update', patch), select: () => builder('select') };
    },
  };
  return { supabase, jobs };
}

function ticket(id, status = 'pending', printer_name = 'Kitchen') {
  return { id, status, printer_name, data: 'SG9sYQ==', created_at: '2026-10-17T00:00:00Z' };
}

test('two service instances cannot claim the same ticket', async () => {
  const { supabase, jobs } = createFakeQueue([ticket('a')]);
  const printed = [];
  const makeWorker = () => createQueueWorker({
    supabase, printRaw: async () => { printed.push('printed'); }, logger,
  });
  const a = makeWorker();
  const b = makeWorker();
  await Promise.all([a.processJob(ticket('a')), b.processJob(ticket('a'))]);
  assert.equal(printed.length, 1);
  assert.equal(jobs.get('a').status, 'done');
});

test('a processing ticket is never automatically reprinted after restart', async () => {
  const { supabase, jobs } = createFakeQueue([ticket('b', 'processing')]);
  let prints = 0;
  const worker = createQueueWorker({ supabase, printRaw: async () => { prints++; }, logger });
  assert.equal(await worker.processPendingJobs(), 0);
  assert.equal(await worker.processJob(ticket('b', 'processing')), false);
  assert.equal(prints, 0);
  assert.equal(jobs.get('b').status, 'processing');
});

test('an unavailable printer leaves a pending job intact until it returns', async () => {
  const { supabase, jobs } = createFakeQueue([ticket('c', 'pending', 'Missing')]);
  let available = false;
  let prints = 0;
  const worker = createQueueWorker({
    supabase, printRaw: async () => { prints++; },
    printerIsAvailable: () => available, logger,
  });
  assert.equal(await worker.processPendingJobs(), 0);
  assert.equal(jobs.get('c').status, 'pending');
  available = true;
  assert.equal(await worker.processPendingJobs(), 1);
  assert.equal(prints, 1);
  assert.equal(jobs.get('c').status, 'done');
});

test('failed printing marks the job error instead of silently losing it', async () => {
  const { supabase, jobs } = createFakeQueue([ticket('d')]);
  const worker = createQueueWorker({ supabase, printRaw: async () => { throw Error('impresora sin papel'); }, logger });
  assert.equal(await worker.processPendingJobs(), 0);
  assert.equal(jobs.get('d').status, 'error');
  assert.match(jobs.get('d').error_msg, /sin papel/);
});

test('printer command uses argument vector and private temporary directory', () => {
  const source = readFileSync(join(root, 'print-service/index.js'), 'utf8');
  assert.match(source, /execFile\('powershell\.exe'/);
  assert.match(source, /mkdtempSync/);
  assert.doesNotMatch(source, /exec\(cmd/);
  assert.match(source, /MAX_TICKET_BYTES/);
  const rawPrinter = readFileSync(join(root, 'print-service/raw-print.ps1'), 'utf8');
  assert.match(rawPrinter, /written != pBytes\.Length/);
});
