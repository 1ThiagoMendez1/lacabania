
import { create } from 'zustand';
import { Mesa, Producto, Orden, Usuario, ItemOrden, EstadoComanda } from './types';

interface POSState {
  user: Usuario | null;
  mesas: Mesa[];
  productos: Producto[];
  ordenes: Orden[];
  
  // Actions
  setUser: (user: Usuario | null) => void;
  updateMesaEstado: (mesaId: number, estado: Mesa['estado'], meseroId?: string) => void;
  updateMesa: (mesaId: number, updates: Partial<Mesa>) => void;
  addMesa: (mesa: Mesa) => void;
  addOrden: (orden: Orden) => void;
  updateOrden: (ordenId: string, updates: Partial<Orden>) => void;
  updateItemEstado: (ordenId: string, itemId: string, estado: EstadoComanda) => void;
  updateStock: (productoId: string, cantidad: number) => void;
  adjustStock: (productoId: string, nuevoStock: number) => void;
  addProducto: (producto: Producto) => void;
  closeOrden: (ordenId: string, mesaId: number) => void;
}

// Datos de prueba iniciales para que las estaciones no se vean vacías
const initialOrdenes: Orden[] = [
  {
    id: 'ORD-PROMO-1',
    mesaId: 5,
    meseroId: '1',
    estado: 'ABIERTA',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    items: [
      {
        id: 'item-1',
        productoId: 'p2',
        nombre: 'Costilla al Barril',
        cantidad: 1,
        precioUnitario: 120000,
        estacion: 'ASADO',
        estado: 'PENDIENTE',
        createdAt: new Date().toISOString(),
        notas: 'Bien cocida'
      },
      {
        id: 'item-2',
        productoId: 'p3',
        nombre: 'Churrasco',
        cantidad: 2,
        precioUnitario: 75000,
        estacion: 'PARRILLA',
        estado: 'EN PREPARACION',
        createdAt: new Date().toISOString()
      }
    ]
  }
];

export const usePOSStore = create<POSState>((set) => ({
  user: { id: '1', nombre: 'Admin La Cabaña', rol: 'ADMINISTRADOR' },
  mesas: Array.from({ length: 15 }, (_, i) => ({
    id: i + 1,
    numero: i + 1,
    zona: i < 10 ? 'Interior' : 'Terraza',
    capacidad: 4,
    estado: i === 4 ? 'EN PEDIDO' : 'LIBRE',
  })),
  productos: [
    { id: 'p1', nombre: 'Picaña Mediana', descripcion: 'Corte madurado a la parrilla', precio: 85000, categoria: 'Cortes', estacion: 'ASADO', stock: 45, stockMinimo: 10 },
    { id: 'p2', nombre: 'Costilla al Barril', descripcion: 'Cerdo cocido lentamente', precio: 120000, categoria: 'Cortes', estacion: 'ASADO', stock: 8, stockMinimo: 10 },
    { id: 'p3', nombre: 'Churrasco', descripcion: 'Clásico llanero', precio: 75000, categoria: 'Cortes', estacion: 'PARRILLA', stock: 30, stockMinimo: 10 },
    { id: 'p4', nombre: 'Cerveza Club Colombia', descripcion: 'Rubia o Roja', precio: 12000, categoria: 'Bebidas', estacion: 'BAR', stock: 100, stockMinimo: 20 },
    { id: 'p5', nombre: 'Patacones con Hogao', descripcion: 'Entrada tradicional', precio: 18000, categoria: 'Entradas', estacion: 'COCINA', stock: 50, stockMinimo: 15 },
    { id: 'p6', nombre: 'Limonada de Coco', descripcion: 'Refrescante', precio: 15000, categoria: 'Bebidas', estacion: 'BAR', stock: 40, stockMinimo: 10 },
  ],
  ordenes: initialOrdenes,

  setUser: (user) => set({ user }),
  updateMesaEstado: (mesaId, estado, meseroId) => set((state) => ({
    mesas: state.mesas.map(m => m.id === mesaId ? { ...m, estado, meseroId } : m)
  })),
  updateMesa: (mesaId, updates) => set((state) => ({
    mesas: state.mesas.map(m => m.id === mesaId ? { ...m, ...updates } : m)
  })),
  addMesa: (mesa) => set((state) => ({
    mesas: [...state.mesas, mesa].sort((a, b) => a.id - b.id)
  })),
  addOrden: (orden) => set((state) => ({ ordenes: [...state.ordenes, orden] })),
  updateOrden: (ordenId, updates) => set((state) => ({
    ordenes: state.ordenes.map(o => o.id === ordenId ? { ...o, ...updates } : o)
  })),
  updateItemEstado: (ordenId, itemId, estado) => set((state) => ({
    ordenes: state.ordenes.map(o => 
      o.id === ordenId 
        ? { ...o, items: o.items.map(i => i.id === itemId ? { ...i, estado } : i) }
        : o
    )
  })),
  updateStock: (productoId, cantidad) => set((state) => ({
    productos: state.productos.map(p => p.id === productoId ? { ...p, stock: Math.max(0, p.stock - cantidad) } : p)
  })),
  adjustStock: (productoId, nuevoStock) => set((state) => ({
    productos: state.productos.map(p => p.id === productoId ? { ...p, stock: nuevoStock } : p)
  })),
  addProducto: (producto) => set((state) => ({
    productos: [...state.productos, producto]
  })),
  closeOrden: (ordenId, mesaId) => set((state) => ({
    ordenes: state.ordenes.map(o => o.id === ordenId ? { ...o, estado: 'CERRADA', updatedAt: new Date().toISOString() } : o),
    mesas: state.mesas.map(m => m.id === mesaId ? { ...m, estado: 'LIBRE', meseroId: undefined, ordenActivaId: undefined } : m)
  })),
}));
