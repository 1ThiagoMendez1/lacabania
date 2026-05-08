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
  addOrden: (orden: Orden) => void;
  updateOrden: (ordenId: string, updates: Partial<Orden>) => void;
  updateItemEstado: (ordenId: string, itemId: string, estado: EstadoComanda) => void;
  updateStock: (productoId: string, cantidad: number) => void;
}

export const usePOSStore = create<POSState>((set) => ({
  user: { id: '1', nombre: 'Carlos Mesero', rol: 'MESERO' }, // Mock default user
  mesas: Array.from({ length: 15 }, (_, i) => ({
    id: i + 1,
    numero: i + 1,
    zona: i < 10 ? 'Interior' : 'Terraza',
    capacidad: 4,
    estado: 'LIBRE',
  })),
  productos: [
    { id: 'p1', nombre: 'Picaña Mediana', descripcion: 'Corte madurado a la parrilla', precio: 85000, categoria: 'Cortes', estacion: 'ASADO', stock: 45, stockMinimo: 10 },
    { id: 'p2', nombre: 'Costilla al Barril', descripcion: 'Cerdo cocido lentamente', precio: 120000, categoria: 'Cortes', estacion: 'ASADO', stock: 8, stockMinimo: 10 },
    { id: 'p3', nombre: 'Churrasco', descripcion: 'Clásico llanero', precio: 75000, categoria: 'Cortes', estacion: 'PARRILLA', stock: 30, stockMinimo: 10 },
    { id: 'p4', nombre: 'Cerveza Club Colombia', descripcion: 'Rubia o Roja', precio: 12000, categoria: 'Bebidas', estacion: 'BAR', stock: 100, stockMinimo: 20 },
    { id: 'p5', nombre: 'Patacones con Hogao', descripcion: 'Entrada tradicional', precio: 18000, categoria: 'Entradas', estacion: 'COCINA', stock: 50, stockMinimo: 15 },
    { id: 'p6', nombre: 'Limonada de Coco', descripcion: 'Refrescante', precio: 15000, categoria: 'Bebidas', estacion: 'BAR', stock: 40, stockMinimo: 10 },
  ],
  ordenes: [],

  setUser: (user) => set({ user }),
  updateMesaEstado: (mesaId, estado, meseroId) => set((state) => ({
    mesas: state.mesas.map(m => m.id === mesaId ? { ...m, estado, meseroId } : m)
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
    productos: state.productos.map(p => p.id === productoId ? { ...p, stock: p.stock - cantidad } : p)
  })),
}));