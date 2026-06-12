import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    // Delete all items first
    await supabase.from('items_orden').delete().neq('id', 0);
    // Delete all modifications
    await supabase.from('modificaciones_comanda').delete().neq('id', 0);
    // Delete all orders
    await supabase.from('ordenes').delete().neq('id', 0);
    // Delete all closures
    await supabase.from('cierres_diarios').delete().neq('id', 0);
    // Delete all expenses
    await supabase.from('gastos').delete().neq('id', 0);

    // Reset mesas
    await supabase.from('mesas').update({
      estado: 'LIBRE',
      orden_activa_id: null,
      tiempo_abierta: null
    }).neq('id', 0);

    return NextResponse.json({ success: true, message: 'Database reset successful' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message });
  }
}
