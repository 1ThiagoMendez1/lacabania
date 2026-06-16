# Servicio de Impresión - La Cabaña POS

## Requisitos

- Node.js 18+ instalado en la PC con las impresoras
- Las impresoras térmicas instaladas como impresoras de Windows (aparecen en "Dispositivos e impresoras")

## Configuración (solo una vez)

### 1. Ejecutar la migración en Supabase

Abre el **SQL Editor** en tu dashboard de Supabase y ejecuta el contenido de `supabase-migration.sql`.

### 2. Crear el archivo .env

Copia `.env.example` como `.env` y rellena:

```
SUPABASE_URL=https://XXXXXXXXXX.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJ...  ← la "service_role" key (NO la anon key)
```

La service_role key la encuentras en: **Supabase → Settings → API → service_role**.

### 3. Iniciar el servicio

Doble clic en **iniciar.bat**. La primera vez instalará las dependencias automáticamente.

Verás algo así:
```
╔══════════════════════════════════════════╗
║   Servicio de Impresión - La Cabaña POS  ║
╚══════════════════════════════════════════╝

Conectando a Supabase...
🖨  Impresoras detectadas: EPSON TM-T20III, Microsoft Print to PDF
✓  Lista de impresoras publicada en Supabase.
✅ Servicio listo. Escuchando trabajos de impresión...
```

### 4. Configurar en la app

Abre la app → **Configuración → Impresoras** → clic en **"Detectar Impresoras"**.  
Las impresoras detectadas por el servicio aparecerán en el desplegable para asignarlas a cada estación.

### 5. (Opcional) Inicio automático con Windows

Doble clic en **autostart.bat** para que el servicio arranque automáticamente cada vez que enciendas el PC.

## Cómo funciona

```
[App / Celular] → inserta en Supabase print_queue → [Servicio Node.js] → imprime vía Windows
```

No necesitas certificados, ni configuración por dispositivo, ni abrir puertos. Funciona desde cualquier celular en cualquier red.

## Solución de problemas

| Síntoma | Causa | Solución |
|---------|-------|----------|
| "Servicio no detectado" en la app | El servicio no está corriendo | Abre iniciar.bat |
| El servicio arranca pero no imprime | Nombre de impresora incorrecto | Verifica que el nombre coincide exactamente con "Dispositivos e impresoras" |
| Error en raw-print.ps1 | Política de ejecución de PowerShell | El .bat ya incluye `-ExecutionPolicy Bypass` |
