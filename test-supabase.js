const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://efbyxoaxtqygtnuoiwmv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmYnl4b2F4dHF5Z3RudW9pd212Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwODA3MTksImV4cCI6MjA5NTY1NjcxOX0.RqfX7tHV7eZJnGzCBk7Z6gzA2rM_4eZH6-602Ye6WXg';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  try {
    console.log("Cleaning up permisos table...");
    
    // Delete Cocinero/Cajero permissions
    await supabase.from('permisos').delete().eq('rol', 'COCINERO');
    await supabase.from('permisos').delete().eq('rol', 'CAJERO');
    
    // Insert new Cajero permissions with only "Caja"
    const { data, error } = await supabase.from('permisos').insert({
      rol: 'CAJERO',
      labels: ['Caja']
    }).select();

    if (error) {
      console.error("Error inserting CAJERO permissions:", error);
    } else {
      console.log("CAJERO permissions set up successfully! Data:", data);
    }
  } catch (e) {
    console.error("Exception occurred:", e);
  }
}

run();
