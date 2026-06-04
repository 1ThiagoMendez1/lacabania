import { ItemOrden, Estacion } from './types';
import { usePOSStore } from './store';

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

      data.push('\x1B\x40'); // Inicializar impresora
      data.push('\x1B\x61\x01'); // Centrar texto
      data.push('\x1B\x45\x01'); // Negrita ON
      data.push(`LA CABANA - COMANDA ${station}\n`);
      data.push('--------------------------------\n');
      data.push('\x1B\x45\x00'); // Negrita OFF

      data.push('\x1B\x61\x00'); // Alinear a la izquierda
      data.push('\x1B\x21\x18'); // Doble altura + Negrita
      data.push(`MESA: ${mesaNumero}\n`);
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
