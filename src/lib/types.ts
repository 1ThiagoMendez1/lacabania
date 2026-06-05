export type Rol = 'ADMINISTRADOR' | 'MESERO' | 'CAJERO';

export type Estacion = 'ASADO' | 'PARRILLA' | 'COCINA' | 'BAR';

export type EstadoMesa = 'LIBRE' | 'OCUPADA' | 'EN PEDIDO' | 'LISTA PAGAR' | 'RESERVADA' | 'FUERA SERVICIO';

export type EstadoComanda = 'PENDIENTE' | 'EN PREPARACION' | 'LISTO' | 'ENTREGADO';

export type MetodoPago = 'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA';

export type TipoDocumentoFE = '13' | '31' | '11' | '12' | '21' | '22' | '41' | '42' | '47' | '50';

export interface ClienteFE {
  tipoDocumento: TipoDocumentoFE;
  numeroDocumento: string;
  nombre: string;
  email: string;
  telefono: string;
  direccion: string;
}

export interface Usuario {
  id: string;
  nombre: string;
  cedula: string;
  rol: Rol;
  pin: string; // Últimos 4 dígitos de la cédula
  telefono?: string;
  sueldo?: number;
  estado: 'ACTIVO' | 'INACTIVO';
  fechaIngreso: string;
  fotoDocumento?: string; // Data URI de la foto del documento
}

export interface Producto {
  id: string;
  sku?: string;
  nombre: string;
  descripcion: string;
  precio: number;
  categoria: string;
  estacion: Estacion;
  imagen?: string;
  stock: number;
  stockMinimo: number;
  unidadMedida?: string;
  costoProveedor?: number;
  fechaVencimiento?: string;
  ubicacion?: string;
}

export interface MenuItem {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  categoria: string;
  estacion: Estacion;
  imagen?: string;
  disponible: boolean;
  stock?: number;
}

export interface ItemOrden {
  id: string;
  menuItemId: string;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  notas?: string;
  estacion: Estacion;
  estado: EstadoComanda;
  createdAt: string;
}

export interface Orden {
  id: string;
  consecutivo?: number;
  mesaId: number;
  meseroId: string;
  items: ItemOrden[];
  estado: 'ABIERTA' | 'CERRADA' | 'ANULADA';
  metodoPago?: MetodoPago;
  clienteFE?: ClienteFE;
  facturaElectronicaId?: string;
  clienteNombre?: string;
  rating?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Mesa {
  id: number;
  numero: number;
  zona: 'Primer Piso' | 'Segundo Piso' | 'Para Llevar';
  capacidad: number;
  estado: EstadoMesa;
  meseroId?: string;
  ordenActivaId?: string;
  tiempoAbierta?: number; // minutos
}

export interface Gasto {
  id: string;
  categoria: string;
  descripcion: string;
  valor: number;
  fecha: string;
}
