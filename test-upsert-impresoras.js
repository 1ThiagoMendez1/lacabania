const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://efbyxoaxtqygtnuoiwmv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmYnl4b2F4dHF5Z3RudW9pd212Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwODA3MTksImV4cCI6MjA5NTY1NjcxOX0.RqfX7tHV7eZJnGzCBk7Z6gzA2rM_4eZH6-602Ye6WXg';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  try {
    console.log("Attempting to upsert to configuracion_impresoras...");
    const { data, error } = await supabase.from('configuracion_impresoras').upsert({
      id: 'default',
      ip_servidor: '192.168.1.99',
      mappings: { 'TEST': 'Printer-99' }
    }).select();

    if (error) {
      console.error("Upsert failed! Error details:", error);
    } else {
      console.log("Upsert succeeded! Data:", data);
    }
  } catch (e) {
    console.error("Exception occurred:", e);
  }
}

run();
