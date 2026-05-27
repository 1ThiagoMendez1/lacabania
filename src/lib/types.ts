export type Rol = 'ADMINISTRADOR' | 'MESERO' | 'COCINERO';

export type Estacion = 'ASADO' | 'PARRILLA' | 'COCINA' | 'BAR';

export type EstadoMesa = 'LIBRE' | 'OCUPADA' | 'EN PEDIDO' | 'LISTA PAGAR' | 'RESERVADA' | 'FUERA SERVICIO';

export type EstadoComanda = 'PENDIENTE' | 'EN PREPARACION' | 'LISTO' | 'ENTREGADO';

export type MetodoPago = 'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA';

export interface Usuario {
  id: string;
  nombre: string;
  cedula: string;
  rol: Rol;
  pin: string; // Últimos 4 dígitos de la cédula
  telefono?: string;
  estado: 'ACTIVO' | 'INACTIVO';
  fechaIngreso: string;
  fotoDocumento?: string; // Data URI de la foto del documento
}

export interface Producto {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  categoria: string;
  estacion: Estacion;
  imagen?: string;
  stock: number;
  stockMinimo: number;
}

export interface ItemOrden {
  id: string;
  productoId: string;
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
  mesaId: number;
  meseroId: string;
  items: ItemOrden[];
  estado: 'ABIERTA' | 'CERRADA' | 'ANULADA';
  metodoPago?: MetodoPago;
  createdAt: string;
  updatedAt: string;
}

export interface Mesa {
  id: number;
  numero: number;
  zona: 'Primer Piso' | 'Segundo Piso';
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
