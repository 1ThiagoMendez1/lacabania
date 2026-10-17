'use strict';

/**
 * Claim-first, at-most-once automatic printing.
 *
 * 'processing' is intentionally not retried on restart: the printer may have
 * produced the ticket before the process/network failed. Operators must verify
 * these entries manually; blindly retrying them creates duplicate tickets.
 */
function createQueueWorker({ supabase, printRaw, printerIsAvailable = () => true, logger = console }) {
  const activeJobs = new Set();
  let scanning = false;

  async function processJob(job) {
    if (!job || !job.id || activeJobs.has(job.id) || !printerIsAvailable(job.printer_name)) {
      return false;
    }
    activeJobs.add(job.id);
    try {
      // Only one service instance may claim an unprocessed job.
      const { data: claimed, error: claimError } = await supabase.from('print_queue')
        .update({ status: 'processing' })
        .eq('id', job.id)
        .eq('status', 'pending')
        .select('id')
        .maybeSingle();

      if (claimError) {
        logger.error('No se pudo reclamar el ticket:', job.id, claimError.message);
        return false;
      }
      if (!claimed) return false;

      try {
        await printRaw(job.printer_name, job.data);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        const { error: recordError } = await supabase.from('print_queue')
          .update({ status: 'error', error_msg: message })
          .eq('id', job.id).eq('status', 'processing');
        if (recordError) logger.error('No se pudo registrar el fallo de impresión:', job.id, recordError.message);
        logger.error('Fallo de impresión:', job.id, message);
        return false;
      }

      // Recording a successful print may fail if the connection went down.
      // Leave the row in processing in that case; do not reprint automatically.
      const { error: completionError } = await supabase.from('print_queue')
        .update({ status: 'done', error_msg: null })
        .eq('id', job.id).eq('status', 'processing');
      if (completionError) {
        logger.error('Ticket posiblemente impreso, pendiente de confirmación manual:', job.id, completionError.message);
        return false;
      }
      logger.log('Ticket impreso:', job.id);
      return true;
    } finally {
      activeJobs.delete(job.id);
    }
  }

  async function processPendingJobs() {
    if (scanning) return 0;
    scanning = true;
    try {
      // Limit each scan to prevent excessive memory use on long-running sites.
      const { data, error } = await supabase.from('print_queue')
        .select('*').eq('status', 'pending')
        .order('created_at', { ascending: true }).limit(100);
      if (error) {
        logger.error('Error consultando cola pendiente:', error.message);
        return 0;
      }
      let completed = 0;
      for (const job of data || []) {
        if (await processJob(job)) completed++;
      }
      return completed;
    } finally {
      scanning = false;
    }
  }

  return { processJob, processPendingJobs };
}

module.exports = { createQueueWorker };
