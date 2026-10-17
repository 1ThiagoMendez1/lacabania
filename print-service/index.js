'use strict';

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { exec, execFile } = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
const { createQueueWorker } = require('./queue-worker');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Faltan SUPABASE_URL y SUPABASE_SERVICE_KEY. Configura print-service/.env.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const SCRIPT_PATH = path.join(__dirname, 'raw-print.ps1');
const MAX_TICKET_BYTES = 1024 * 1024;
let installedPrinters = new Set();

function getWindowsPrinters() {
  return new Promise((resolve) => {
    // Static command: no content from a database or client is interpolated here.
    exec('powershell -NoProfile -NonInteractive -Command "Get-Printer | Select-Object -ExpandProperty Name | ConvertTo-Json"',
      { encoding: 'utf8', timeout: 10000, windowsHide: true },
      (error, stdout) => {
        if (error) {
          console.warn('No se pudo obtener lista de impresoras:', error.message);
          resolve([]);
          return;
        }
        try {
          const parsed = JSON.parse(stdout.trim());
          resolve((Array.isArray(parsed) ? parsed : [parsed]).filter(name => typeof name === 'string' && name.trim()));
        } catch {
          resolve([]);
        }
      });
  });
}

async function publishPrinters() {
  const printers = await getWindowsPrinters();
  installedPrinters = new Set(printers);
  console.log('Impresoras detectadas:', printers.length ? printers.join(', ') : 'ninguna');
  const { error } = await supabase.from('configuracion_impresoras')
    .upsert({ id: 'default', available_printers: printers }, { onConflict: 'id' });
  if (error) console.error('Error publicando impresoras en Supabase:', error.message);
  return printers;
}

function decodeTicket(data) {
  let bytes;
  if (typeof data === 'string') {
    if (data.length === 0 || data.length % 4 !== 0 || data.length > MAX_TICKET_BYTES * 2 ||
        !/^[A-Za-z0-9+/]*={0,2}$/.test(data)) {
      throw new Error('Datos de impresión base64 inválidos');
    }
    bytes = Buffer.from(data, 'base64');
  } else if (Array.isArray(data) && data.every(part => typeof part === 'string')) {
    bytes = Buffer.concat(data.map(part => Buffer.from(part, 'latin1')));
  } else {
    throw new Error('Formato de impresión no soportado');
  }
  if (!bytes.length || bytes.length > MAX_TICKET_BYTES) throw new Error('Tamaño del ticket inválido');
  return bytes;
}

function printRaw(printerName, data) {
  if (typeof printerName !== 'string' || !installedPrinters.has(printerName)) {
    return Promise.reject(new Error('Impresora desconocida o desconectada'));
  }

  let bytes;
  try {
    bytes = decodeTicket(data);
  } catch (error) {
    return Promise.reject(error);
  }

  // Isolated temporary directory avoids collisions between simultaneous jobs.
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lacabana-print-'));
  const tmpFile = path.join(tempDir, 'ticket.bin');
  try {
    fs.writeFileSync(tmpFile, bytes);
  } catch (error) {
    fs.rmSync(tempDir, { recursive: true, force: true });
    return Promise.reject(error);
  }
  return new Promise((resolve, reject) => {
    // execFile does not invoke cmd.exe: a malicious printer name isn't shell code.
    execFile('powershell.exe', [
      '-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass',
      '-File', SCRIPT_PATH, '-printerName', printerName, '-dataFile', tmpFile
    ], { timeout: 30000, encoding: 'utf8', windowsHide: true }, (error, stdout, stderr) => {
      try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch (cleanupError) {
        console.warn('No se pudo limpiar temporal de impresión:', cleanupError.message);
      }
      if (error) reject(new Error(stderr?.trim() || error.message));
      else resolve(stdout.trim());
    });
  });
}

const worker = createQueueWorker({
  supabase,
  printRaw,
  printerIsAvailable: name => installedPrinters.has(name),
});

async function start() {
  console.log('Servicio de impresión — La Cabaña POS');
  await publishPrinters();

  supabase.channel('print-queue')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'print_queue' }, (payload) => {
      if (payload.new?.status === 'pending') {
        void worker.processJob(payload.new).catch(error => console.error('Error en cola:', error));
      }
    })
    .subscribe((status, error) => {
      if (status === 'SUBSCRIBED') {
        console.log('Servicio conectado. Consultando trabajos pendientes.');
        void worker.processPendingJobs().catch(err => console.error('Error al recuperar cola:', err));
      } else if (status === 'CHANNEL_ERROR') {
        console.error('Error Realtime:', error);
      } else if (status === 'CLOSED') {
        console.warn('Realtime desconectado; el sondeo recuperará trabajos pendientes.');
      }
    });

  // Polling catches INSERT events missed during brief internet interruptions.
  // Jobs already in 'processing' are NEVER retried automatically.
  setInterval(() => {
    void worker.processPendingJobs().catch(err => console.error('Error de sondeo:', err));
  }, 30000);
  setInterval(() => {
    void publishPrinters().catch(err => console.error('Error detectando impresoras:', err));
  }, 5 * 60 * 1000);
}

start().catch(error => {
  console.error('Error fatal al iniciar el servicio:', error);
  process.exit(1);
});
