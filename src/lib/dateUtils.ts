export function getBogotaCurrentDate(): Date {
  // Obtenemos la hora actual en la zona horaria de Bogotá
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Bogota',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  
  const parts = formatter.formatToParts(new Date());
  const map: Record<string, string> = {};
  parts.forEach(p => map[p.type] = p.value);
  
  // Construimos una fecha que estrictamente mapea a la hora local en Bogotá, usando el timezone offset de UTC-5.
  // Esto es para que new Date() retorne el timestamp correcto.
  return new Date(`${map.year}-${map.month}-${map.day}T${map.hour}:${map.minute}:${map.second}-05:00`);
}

export function getBogotaDateString(): string {
  // Retorna la fecha en formato YYYY-MM-DD según el día que es en Bogotá.
  const formatter = new Intl.DateTimeFormat('en-CA', { 
    timeZone: 'America/Bogota',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  return formatter.format(new Date());
}

export function getBogotaISOString(): string {
  // Retorna un ISO String exacto (con el offset o en UTC pero equivalente al momento actual)
  // El Date devuelto por getBogotaCurrentDate() ya tiene el timestamp absoluto correcto.
  return getBogotaCurrentDate().toISOString();
}

export function toBogotaDate(dateString: string | Date): Date {
  const d = new Date(dateString);
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Bogota',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  
  const parts = formatter.formatToParts(d);
  const map: Record<string, string> = {};
  parts.forEach(p => map[p.type] = p.value);
  
  return new Date(`${map.year}-${map.month}-${map.day}T${map.hour}:${map.minute}:${map.second}-05:00`);
}
