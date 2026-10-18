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

export function getBogotaDateString(date: Date = new Date()): string {
  // Use explicit date parts: locale formatting can return MM/DD/YYYY on
  // certain devices. Never read the UTC date to decide Bogotá's business day.
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Bogota',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(date);
  const value = (type: string) => parts.find(part => part.type === type)?.value || '';
  return `${value('year')}-${value('month')}-${value('day')}`;
}

export function getBogotaHour(date: Date = new Date()): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Bogota',
    hour: '2-digit',
    hourCycle: 'h23'
  }).formatToParts(date);
  return Number(parts.find(part => part.type === 'hour')?.value ?? '0');
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
