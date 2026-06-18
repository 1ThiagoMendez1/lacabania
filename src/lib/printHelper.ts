import { ItemOrden, Estacion } from './types';
import { usePOSStore } from './store';
import { getOrderIdentifier } from './utils';

/**
 * Agrupa los nuevos productos de un pedido por su impresora de destino (estación)
 * y los envía a imprimir de forma automática usando QZ Tray.
 */
export async function printKitchenTickets(
  mesaNumero: number,
  meseroNombre: string,
  newItems: ItemOrden[]
): Promise<void> {
  const store = usePOSStore.getState();
  const { printTicket, printerMappings } = store;

  // Agrupar ítems por estación
  const itemsByStation = newItems.reduce((acc, item) => {
    if (!acc[item.estacion]) {
      acc[item.estacion] = [];
    }
    acc[item.estacion].push(item);
    return acc;
  }, {} as Record<Estacion, ItemOrden[]>);

  // Recorrer las estaciones y mandar a imprimir a cada una
  for (const station of Object.keys(itemsByStation) as Estacion[]) {
    const stationItems = itemsByStation[station];
    if (!stationItems || stationItems.length === 0) continue;

    // Verificar si esta estación tiene una impresora configurada
    const printerName = printerMappings[station];
    if (!printerName) {
      console.warn(`No hay impresora configurada para la estación ${station}. Se omitió la impresión.`);
      continue;
    }

    try {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
      const dateStr = now.toLocaleDateString('es-CO');

      // Comandos ESC/POS estándar para impresión térmica
      const data: any[] = [];

      const mesa = store.mesas.find(m => m.id === mesaNumero || m.numero === mesaNumero);
      const isParaLlevar = mesa?.zona === 'Para Llevar' || mesaNumero >= 100;
      const activeOrder = store.ordenes.find(o => o.mesaId === mesaNumero && o.estado === 'ABIERTA');
      const consecutivo = activeOrder?.consecutivo;
      
      const orderIdStr = activeOrder ? getOrderIdentifier({ mesaId: mesaNumero, consecutivo, id: activeOrder.id }) : (isParaLlevar ? 'PLL-NUEVO' : 'ORD-NUEVO');

      data.push('\x1B\x40'); // Inicializar impresora
      data.push('\x1B\x61\x01'); // Centrar texto
      
      data.push('\x1B\x21\x38'); // Doble ancho + Doble alto + Negrita
      if (isParaLlevar) {
        data.push('*** PARA LLEVAR ***\n\n');
      } else {
        data.push(`*** MESA ${mesaNumero} ***\n\n`);
      }
      data.push('\x1B\x21\x00'); // Volver a tamaño normal
      data.push('\x1B\x61\x01'); // Centrar

      data.push('\x1B\x21\x18'); // Doble altura + Negrita
      data.push(`PEDIDO ${orderIdStr}\n`);
      data.push('\x1B\x21\x00'); // Normal
      data.push('\x1B\x61\x01'); // Centrar

      data.push('\x1B\x45\x01'); // Negrita ON
      data.push(`LA CABANA - COMANDA ${station}\n`);
      data.push('--------------------------------\n');
      data.push('\x1B\x45\x00'); // Negrita OFF

      data.push('\x1B\x61\x00'); // Alinear a la izquierda
      data.push('\x1B\x21\x18'); // Doble altura + Negrita
      data.push(`PEDIDO: ${orderIdStr}\n`);
      data.push(`MESERO: ${meseroNombre}\n`);
      data.push('\x1B\x21\x00'); // Volver a tamaño normal
      data.push(`FECHA: ${dateStr} ${timeStr}\n`);
      data.push('--------------------------------\n\n');

      data.push('\x1B\x45\x01'); // Negrita ON
      data.push('CANT   PRODUCTO / NOTA\n');
      data.push('--------------------------------\n');
      data.push('\x1B\x45\x00'); // Negrita OFF

      for (const item of stationItems) {
        // ESC/POS para fuente doble altura y doble ancho (para que sea muy visible la cantidad)
        data.push('\x1B\x21\x30'); 
        data.push(`${item.cantidad}x `);
        
        // Volver a tamaño normal pero en negrita para el nombre del plato
        data.push('\x1B\x21\x00'); 
        data.push('\x1B\x45\x01'); 
        data.push(` ${item.nombre}\n`);
        data.push('\x1B\x45\x00'); 

        if (item.notas && item.notas.trim() !== '') {
          data.push(`   * NOTAS: ${item.notas.trim()}\n`);
        }
        data.push('\n');
      }

      data.push('--------------------------------\n');
      data.push('\x1B\x61\x01'); // Centrar texto
      data.push('Comanda POS La Cabana\n');
      
      // Avance de papel y corte de papel automático
      data.push('\n\n\n\n\x1D\x56\x41\x10');

      // Llamar al printTicket en el store que ejecuta la lógica de QZ Tray
      await printTicket(station, data);
      console.log(`Ticket de comanda enviado a la impresora "${printerName}" de la estación ${station}.`);
    } catch (error) {
      console.error(`Error al imprimir comanda en la estación ${station}:`, error);
      throw error;
    }
  }
}

export async function printModificacionTicket(
  mesaNumero: number,
  meseroNombre: string,
  cancelados: ItemOrden[],
  agregados: ItemOrden[],
  observaciones?: string
): Promise<void> {
  const store = usePOSStore.getState();
  const { printTicket, printerMappings } = store;

  const affectedStations = new Set<Estacion>();
  cancelados.forEach(i => affectedStations.add(i.estacion));
  agregados.forEach(i => affectedStations.add(i.estacion));

  for (const station of Array.from(affectedStations)) {
    const canceladosStation = cancelados.filter(i => i.estacion === station);
    const agregadosStation = agregados.filter(i => i.estacion === station);
    
    if (canceladosStation.length === 0 && agregadosStation.length === 0) continue;

    const printerName = printerMappings[station];
    if (!printerName) {
      console.warn(`No hay impresora para la estación ${station}. Omitiendo ticket de modificación.`);
      continue;
    }

    try {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
      const dateStr = now.toLocaleDateString('es-CO');

      const data: any[] = [];
      const mesa = store.mesas.find(m => m.id === mesaNumero || m.numero === mesaNumero);
      const isParaLlevar = mesa?.zona === 'Para Llevar' || mesaNumero >= 100;
      const activeOrder = store.ordenes.find(o => o.mesaId === mesaNumero && o.estado === 'ABIERTA');
      const consecutivo = activeOrder?.consecutivo;
      
      const orderIdStr = activeOrder ? getOrderIdentifier({ mesaId: mesaNumero, consecutivo, id: activeOrder.id }) : (isParaLlevar ? 'PLL-NUEVO' : 'ORD-NUEVO');

      data.push('\x1B\x40'); // Inicializar
      data.push('\x1B\x61\x01'); // Centrar
      
      // Encabezado de MODIFICACIÓN en colores inversos (si lo soporta) o negrita
      data.push('\x1D\x42\x01'); // Invertido ON
      data.push('\x1B\x21\x38'); // Doble ancho + Doble alto
      data.push(' MODIFICACION \n\n');
      data.push('\x1B\x21\x00');
      data.push('\x1D\x42\x00'); // Invertido OFF

      data.push('\x1B\x61\x01'); // Centrar texto
      data.push('\x1B\x21\x38'); // Doble ancho + Doble alto + Negrita
      if (isParaLlevar) {
        data.push('*** PARA LLEVAR ***\n\n');
      } else {
        data.push(`*** MESA ${mesaNumero} ***\n\n`);
      }
      data.push('\x1B\x21\x00'); // Volver a tamaño normal

      data.push('\x1B\x61\x00'); // Izquierda
      data.push('\x1B\x21\x18'); // Doble altura + Negrita
      data.push(`PEDIDO: ${orderIdStr}\n`);
      data.push(`MESERO: ${meseroNombre}\n`);
      data.push('\x1B\x21\x00'); 
      data.push(`FECHA: ${dateStr} ${timeStr}\n`);
      data.push('--------------------------------\n\n');

      if (observaciones) {
        data.push('\x1B\x45\x01');
        data.push(`MOTIVO: ${observaciones}\n`);
        data.push('\x1B\x45\x00');
        data.push('--------------------------------\n\n');
      }

      if (canceladosStation.length > 0) {
        data.push('\x1B\x61\x01'); // Centrar
        data.push('\x1B\x21\x18'); // Doble altura + Negrita
        data.push('*** CANCELAR ***\n');
        data.push('\x1B\x21\x00'); 
        data.push('\x1B\x61\x00'); // Izquierda
        
        for (const item of canceladosStation) {
          data.push('\x1B\x21\x30'); 
          data.push(`-${item.cantidad}x `);
          data.push('\x1B\x21\x00'); 
          data.push('\x1B\x45\x01'); 
          data.push(` ${item.nombre}\n`);
          data.push('\x1B\x45\x00'); 
          data.push('\n');
        }
        data.push('--------------------------------\n');
      }

      if (agregadosStation.length > 0) {
        data.push('\x1B\x61\x01'); // Centrar
        data.push('\x1B\x21\x18'); // Doble altura + Negrita
        data.push('*** AGREGAR ***\n');
        data.push('\x1B\x21\x00'); 
        data.push('\x1B\x61\x00'); // Izquierda
        
        for (const item of agregadosStation) {
          data.push('\x1B\x21\x30'); 
          data.push(`+${item.cantidad}x `);
          data.push('\x1B\x21\x00'); 
          data.push('\x1B\x45\x01'); 
          data.push(` ${item.nombre}\n`);
          data.push('\x1B\x45\x00'); 
          if (item.notas && item.notas.trim() !== '') {
            data.push(`   * NOTAS: ${item.notas.trim()}\n`);
          }
          data.push('\n');
        }
        data.push('--------------------------------\n');
      }

      data.push('\x1B\x61\x01'); // Centrar texto
      data.push('Comanda Modificada La Cabana\n');
      data.push('\n\n\n\n\x1D\x56\x41\x10');

      await printTicket(station, data);
      console.log(`Ticket de modificacion enviado a "${printerName}" (estación ${station}).`);
    } catch (error) {
      console.error(`Error al imprimir modificacion en la estación ${station}:`, error);
      throw error;
    }
  }
}

export async function printReceiptTicket(
  orden: any,
  meseroNombre: string
): Promise<void> {
  const store = usePOSStore.getState();
  const { printTicket, printerMappings } = store;

  const printerName = printerMappings['CAJA'];
  if (!printerName) {
    throw new Error('No hay impresora configurada para la CAJA. Por favor configúrala en "Configuración > Impresoras".');
  }

  try {
    const data: any[] = [];
    const orderIdStr = getOrderIdentifier({ mesaId: orden.mesaId, consecutivo: orden.consecutivo, id: orden.id });
    const dateStr = new Date(orden.updatedAt).toLocaleDateString('es-CO');
    const timeStr = new Date(orden.updatedAt).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });

    data.push('\x1B\x40'); // Init
    data.push('\x1B\x61\x01'); // Center
    
    // Header
    data.push('\x1B\x21\x18'); // Doble altura + Negrita
    data.push('ASADERO Y RESTAURANTE\nLA CABANA\n');
    data.push('\x1B\x21\x00'); // Normal
    data.push('--------------------------------\n');
    data.push(`PEDIDO: ${orderIdStr}\n`);
    data.push('--------------------------------\n');
    data.push('NIT: 1070386281\n');
    data.push('Calle 6 #4-71\n');

    if (orden.clienteFE) {
       data.push('\x1B\x21\x08'); // Negrita
       data.push('\nFACTURA ELECTRONICA\n');
       data.push('\x1B\x21\x00');
       data.push(`CLIENTE: ${orden.clienteFE.nombre}\n`);
       data.push(`NIT/CC: ${orden.clienteFE.numeroDocumento}\n`);
    }

    data.push('\x1B\x61\x00'); // Left align
    data.push('\n--------------------------------\n');
    data.push(`FECHA:  ${dateStr} ${timeStr}\n`);
    data.push(`MESERO: ${meseroNombre}\n`);
    data.push('--------------------------------\n');

    // Items
    data.push('\x1B\x45\x01'); // Bold
    data.push('CANT PRODUCTO             TOTAL\n');
    data.push('\x1B\x45\x00'); // Unbold
    data.push('--------------------------------\n');

    let subtotal = 0;
    for (const item of orden.items) {
      if (item.estado === 'CANCELADO') continue;
      const totalItem = item.cantidad * item.precioUnitario;
      subtotal += totalItem;

      const qtyStr = item.cantidad.toString().padEnd(3, ' ');
      // truncate name to 18 chars, pad right
      const nameStr = item.nombre.substring(0, 18).padEnd(18, ' ');
      // pad price to left
      const priceStr = `$${totalItem.toLocaleString('es-CO')}`.padStart(9, ' ');
      
      data.push(`${qtyStr} ${nameStr} ${priceStr}\n`);
    }

    data.push('--------------------------------\n');
    data.push('\x1B\x61\x02'); // Right align
    data.push(`SUBTOTAL: $${subtotal.toLocaleString('es-CO')}\n`);
    if (orden.propina) {
      data.push(`SERVICIO (PROPINA): $${orden.propina.toLocaleString('es-CO')}\n`);
    }
    
    data.push('\x1B\x21\x18'); // Doble altura + Negrita
    const totalFinal = subtotal + (orden.propina || 0);
    data.push(`TOTAL: $${totalFinal.toLocaleString('es-CO')}\n`);
    data.push('\x1B\x21\x00'); // Normal

    data.push('\x1B\x61\x01'); // Center
    data.push('\n--------------------------------\n');
    data.push(`PAGADO: ${orden.metodoPago || 'N/A'}\n\n`);
    
    data.push('\x1B\x45\x01'); // Bold
    data.push('"Gracias por preferir el sabor\ndel barril"\n');
    data.push('\x1B\x45\x00'); // Unbold

    // Avance y corte
    data.push('\n\n\n\n\x1D\x56\x41\x10');

    await printTicket('CAJA', data);
    console.log(`[Impresión] Factura ${orderIdStr} enviada exitosamente a la impresora CAJA (${printerName}).`);
  } catch (error) {
    console.error(`Error al imprimir factura en CAJA:`, error);
    throw error;
  }
}
