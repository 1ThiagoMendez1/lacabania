require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

// ─── Configuración ────────────────────────────────────────────────────────────
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('\n❌ ERROR: Faltan variables de entorno.');
  console.error('   Crea el archivo .env copiando .env.example y rellena los valores.\n');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const SCRIPT_PATH = path.join(__dirname, 'raw-print.ps1');

// ─── Obtener lista de impresoras de Windows ────────────────────────────────────
function getWindowsPrinters() {
  return new Promise((resolve) => {
    exec('powershell -Command "Get-Printer | Select-Object -ExpandProperty Name | ConvertTo-Json"', { encoding: 'utf8', timeout: 10000 }, (error, stdout) => {
      if (error) {
        console.warn('⚠ No se pudo obtener lista de impresoras:', error.message);
        resolve([]);
        return;
      }
      try {
        const raw = stdout.trim();
        if (!raw) { resolve([]); return; }
        const parsed = JSON.parse(raw);
        resolve(Array.isArray(parsed) ? parsed : [parsed]);
      } catch {
        resolve([]);
      }
    });
  });
}

// ─── Publicar impresoras disponibles en Supabase ──────────────────────────────
async function publishPrinters() {
  const printers = await getWindowsPrinters();
  console.log('🖨  Impresoras detectadas:', printers.length > 0 ? printers.join(', ') : 'ninguna');

  const { error } = await supabase
    .from('configuracion_impresoras')
    .upsert({ id: 'default', available_printers: printers }, { onConflict: 'id' });

  if (error) {
    console.error('❌ Error publicando impresoras en Supabase:', error.message);
  } else {
    console.log('✓  Lista de impresoras publicada en Supabase.');
  }
  return printers;
}

// ─── Imprimir datos RAW via PowerShell ────────────────────────────────────────
function printRaw(printerName, data) {
  return new Promise((resolve, reject) => {
    // Reconstruir el buffer binario desde el array de strings ESC/POS
    const buffers = data.map(s => Buffer.from(s, 'latin1'));
    const combined = Buffer.concat(buffers);

    // Escribir en archivo temporal
    const tmpFile = path.join(os.tmpdir(), `lacabana_${Date.now()}.bin`);
    fs.writeFileSync(tmpFile, combined);

    // Escapar comillas en el nombre de la impresora
    const safePrinter = printerName.replace(/"/g, '`"');
    const cmd = `powershell -ExecutionPolicy Bypass -File "${SCRIPT_PATH}" -printerName "${safePrinter}" -dataFile "${tmpFile}"`;

    exec(cmd, { timeout: 30000, encoding: 'utf8' }, (error, stdout, stderr) => {
      // Limpiar archivo temporal
      try { fs.unlinkSync(tmpFile); } catch (_) {}

      if (error) {
        reject(new Error(stderr?.trim() || error.message));
      } else {
        resolve(stdout.trim());
      }
    });
  });
}

// ─── Procesar un job de impresión ─────────────────────────────────────────────
async function processJob(job) {
  const { id, printer_name, data, station_id } = job;
  console.log(`📄 Procesando job ${id} → "${printer_name}" (${station_id})`);

  // Marcar como procesando
  await supabase.from('print_queue').update({ status: 'processing' }).eq('id', id);

  try {
    await printRaw(printer_name, data);
    await supabase.from('print_queue').update({ status: 'done' }).eq('id', id);
    console.log(`✓  Job ${id} impreso correctamente.`);
  } catch (err) {
    const msg = err.message || String(err);
    await supabase.from('print_queue').update({ status: 'error', error_msg: msg }).eq('id', id);
    console.error(`✗  Error en job ${id}:`, msg);
  }
}

// ─── Procesar jobs pendientes al arrancar ─────────────────────────────────────
async function processPendingJobs() {
  const { data, error } = await supabase
    .from('print_queue')
    .select('*')
    .in('status', ['pending', 'processing'])
    .order('created_at', { ascending: true });

  if (error) { console.error('Error consultando cola pendiente:', error.message); return; }
  if (data && data.length > 0) {
    console.log(`📋 ${data.length} job(s) pendiente(s) al arrancar. Procesando...`);
    for (const job of data) await processJob(job);
  }
}

// ─── Inicio del servicio ───────────────────────────────────────────────────────
async function start() {
  console.log('╔══════════════════════════════════════════╗');
  console.log('║   Servicio de Impresión - La Cabaña POS  ║');
  console.log('╚══════════════════════════════════════════╝\n');

  console.log('Conectando a Supabase...');
  await publishPrinters();

  await processPendingJobs();

  // Suscribirse a nuevos jobs via Realtime
  const channel = supabase
    .channel('print-queue')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'print_queue' }, async (payload) => {
      const job = payload.new;
      if (job.status === 'pending') {
        await processJob(job);
      }
    })
    .subscribe((status, err) => {
      if (status === 'SUBSCRIBED') {
        console.log('\n✅ Servicio listo. Escuchando trabajos de impresión...');
        console.log('   No cierres esta ventana mientras uses el POS.\n');
      } else if (status === 'CHANNEL_ERROR') {
        console.error('❌ Error en canal Realtime:', err);
      }
    });

  // Re-publicar impresoras cada 5 minutos (por si conectan nuevas)
  setInterval(publishPrinters, 5 * 60 * 1000);
}

start().catch(err => {
  console.error('Error fatal al iniciar el servicio:', err);
  process.exit(1);
});
