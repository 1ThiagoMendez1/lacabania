-- Schema for La Cabaña POS

-- Limpiar esquema anterior (Útil si necesitas volver a correr el script)
DROP TABLE IF EXISTS public.items_orden CASCADE;
DROP TABLE IF EXISTS public.ordenes CASCADE;
DROP TABLE IF EXISTS public.mesas CASCADE;
DROP TABLE IF EXISTS public.productos CASCADE;
DROP TABLE IF EXISTS public.menu_items CASCADE;
DROP TABLE IF EXISTS public.usuarios CASCADE;
DROP TABLE IF EXISTS public.permisos CASCADE;
DROP TABLE IF EXISTS public.cierres_diarios CASCADE;

DROP TYPE IF EXISTS public.user_role CASCADE;
DROP TYPE IF EXISTS public.station CASCADE;
DROP TYPE IF EXISTS public.table_status CASCADE;
DROP TYPE IF EXISTS public.order_item_status CASCADE;
DROP TYPE IF EXISTS public.order_status CASCADE;
DROP TYPE IF EXISTS public.payment_method CASCADE;

-- Enum for roles
CREATE TYPE public.user_role AS ENUM ('ADMINISTRADOR', 'MESERO', 'CAJERO');

-- Enum for stations
CREATE TYPE public.station AS ENUM ('ASADO', 'PARRILLA', 'COCINA', 'BAR');

-- Enum for table status
CREATE TYPE public.table_status AS ENUM ('LIBRE', 'OCUPADA', 'EN PEDIDO', 'LISTA PAGAR', 'RESERVADA', 'FUERA SERVICIO');

-- Enum for order item status
CREATE TYPE public.order_item_status AS ENUM ('PENDIENTE', 'EN PREPARACION', 'LISTO', 'ENTREGADO', 'CANCELADO');

-- Enum for order status
CREATE TYPE public.order_status AS ENUM ('ABIERTA', 'CERRADA', 'ANULADA');

-- Enum for payment methods
CREATE TYPE public.payment_method AS ENUM ('EFECTIVO', 'TARJETA', 'TRANSFERENCIA');

-- Tables

CREATE TABLE public.usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL,
    cedula TEXT UNIQUE NOT NULL,
    rol public.user_role NOT NULL,
    pin TEXT NOT NULL,
    telefono TEXT,
    estado TEXT NOT NULL DEFAULT 'ACTIVO' CHECK (estado IN ('ACTIVO', 'INACTIVO')),
    fecha_ingreso DATE NOT NULL DEFAULT CURRENT_DATE,
    foto_documento TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.productos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL,
    descripcion TEXT,
    precio NUMERIC NOT NULL CHECK (precio >= 0),
    categoria TEXT NOT NULL,
    estacion public.station NOT NULL,
    imagen TEXT,
    stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    stock_minimo INTEGER NOT NULL DEFAULT 0,
    sku TEXT,
    unidad_medida TEXT,
    costo_proveedor NUMERIC DEFAULT 0,
    fecha_vencimiento DATE,
    ubicacion TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.menu_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL,
    descripcion TEXT,
    precio NUMERIC NOT NULL CHECK (precio >= 0),
    categoria TEXT NOT NULL,
    estacion public.station NOT NULL,
    imagen TEXT,
    disponible BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.mesas (
    id INTEGER PRIMARY KEY,
    numero INTEGER NOT NULL UNIQUE,
    zona TEXT NOT NULL CHECK (zona IN ('Primer Piso', 'Segundo Piso', 'Para Llevar')),
    capacidad INTEGER NOT NULL CHECK (capacidad > 0),
    estado public.table_status NOT NULL DEFAULT 'LIBRE',
    mesero_id UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
    orden_activa_id UUID,
    tiempo_abierta INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.ordenes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mesa_id INTEGER NOT NULL REFERENCES public.mesas(id) ON DELETE RESTRICT,
    mesero_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE RESTRICT,
    estado public.order_status NOT NULL DEFAULT 'ABIERTA',
    metodo_pago public.payment_method,
    factura_electronica_id TEXT,
    cliente_nombre TEXT,
    cliente_documento TEXT,
    consecutivo SERIAL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.items_orden (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    orden_id UUID NOT NULL REFERENCES public.ordenes(id) ON DELETE CASCADE,
    menu_item_id UUID NOT NULL REFERENCES public.menu_items(id) ON DELETE RESTRICT,
    nombre TEXT NOT NULL,
    cantidad INTEGER NOT NULL CHECK (cantidad > 0),
    precio_unitario NUMERIC NOT NULL,
    notas TEXT,
    estacion public.station NOT NULL,
    estado public.order_item_status NOT NULL DEFAULT 'PENDIENTE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Permisos (Optional depending on how you want to handle it, could just be a JSONB column or a separate table, but currently stored in zustand)
CREATE TABLE public.permisos (
    rol public.user_role PRIMARY KEY,
    labels TEXT[] NOT NULL DEFAULT '{}'
);

-- Insert initial permissions
INSERT INTO public.permisos (rol, labels) VALUES
    ('ADMINISTRADOR', '{"Dashboard", "Mesas", "Asado", "Parrilla", "Cocina", "Bar", "Caja", "Menú Carta", "Inventario", "Personal", "Reportes & AI", "Impresoras", "Historial Meseros"}'),
    ('MESERO', '{"Mesas", "Asado", "Parrilla", "Cocina", "Bar"}'),
    ('CAJERO', '{"Caja"}');



CREATE TABLE public.cierres_diarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fecha DATE UNIQUE NOT NULL,
    esperado_efectivo NUMERIC NOT NULL,
    esperado_tarjeta NUMERIC NOT NULL,
    esperado_transferencia NUMERIC NOT NULL,
    real_efectivo NUMERIC NOT NULL,
    diferencia NUMERIC NOT NULL,
    notas TEXT,
    creado_por UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.cierres_diarios DISABLE ROW LEVEL SECURITY;

CREATE TABLE public.gastos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    categoria TEXT NOT NULL,
    descripcion TEXT,
    valor NUMERIC NOT NULL CHECK (valor >= 0),
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.gastos DISABLE ROW LEVEL SECURITY;

CREATE TABLE public.modificaciones_comanda (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    orden_id UUID NOT NULL REFERENCES public.ordenes(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE RESTRICT,
    tipo TEXT NOT NULL CHECK (tipo IN ('CANCELACION', 'ADICION', 'MODIFICACION')),
    items_afectados JSONB NOT NULL,
    observaciones TEXT,
    fecha TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.modificaciones_comanda DISABLE ROW LEVEL SECURITY;

-- Insertar Super Usuario Administrador Inicial
INSERT INTO public.usuarios (nombre, cedula, rol, pin, estado, telefono) 
VALUES ('Super Admin', '1000518202', 'ADMINISTRADOR', '8202', 'ACTIVO', '0000000000');

-- Compartir Impresoras y Habilitar Impresión Móvil (Red Local)
CREATE TABLE IF NOT EXISTS public.configuracion_impresoras (
    id TEXT PRIMARY KEY DEFAULT 'default',
    ip_servidor TEXT NOT NULL DEFAULT 'localhost',
    mappings JSONB NOT NULL DEFAULT '{}'::jsonb
);

INSERT INTO public.configuracion_impresoras (id, ip_servidor, mappings)
VALUES ('default', 'localhost', '{}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- Añadir las tablas a la publicación de tiempo real de forma segura y libre de errores
DO $$
DECLARE
    tabla_name TEXT;
    tablas_realtime TEXT[] := ARRAY['mesas', 'ordenes', 'items_orden', 'productos', 'menu_items', 'configuracion_impresoras', 'gastos', 'modificaciones_comanda'];
BEGIN
    FOREACH tabla_name IN ARRAY tablas_realtime LOOP
        IF NOT EXISTS (
            SELECT 1 
            FROM pg_publication_tables 
            WHERE pubname = 'supabase_realtime' 
              AND schemaname = 'public' 
              AND tablename = tabla_name
        ) THEN
            EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', tabla_name);
        END IF;
    END LOOP;
END
$$;

ALTER TABLE public.configuracion_impresoras DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.productos DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.mesas DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.ordenes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.items_orden DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.permisos DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.gastos DISABLE ROW LEVEL SECURITY;

