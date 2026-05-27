import { create } from 'zustand';
import { Mesa, Producto, Orden, Usuario, ItemOrden, EstadoComanda, MetodoPago, Rol } from './types';

interface POSState {
  user: Usuario | null;
  usuarios: Usuario[];
  mesas: Mesa[];
  productos: Producto[];
  ordenes: Orden[];
  permisos: Record<Rol, string[]>;
  
  // Actions
  setUser: (user: Usuario | null) => void;
  login: (pin: string) => Usuario | null;
  logout: () => void;
  setUsuarios: (usuarios: Usuario[]) => void;
  addUsuario: (usuario: Usuario) => void;
  updateUsuario: (id: string, updates: Partial<Usuario>) => void;
  deleteUsuario: (id: string) => void;
  updateMesaEstado: (mesaId: number, estado: Mesa['estado'], meseroId?: string) => void;
  updateMesa: (mesaId: number, updates: Partial<Mesa>) => void;
  addMesa: (mesa: Mesa) => void;
  addOrden: (orden: Orden) => void;
  updateOrden: (ordenId: string, updates: Partial<Orden>) => void;
  updateItemEstado: (ordenId: string, itemId: string, estado: EstadoComanda) => void;
  updateStock: (productoId: string, cantidad: number) => void;
  adjustStock: (productoId: string, nuevoStock: number) => void;
  addProducto: (producto: Producto) => void;
  closeOrden: (ordenId: string, mesaId: number, metodoPago: MetodoPago) => void;
  togglePermiso: (rol: Rol, menuLabel: string) => void;
}

const initialUsuarios: Usuario[] = [
  { id: '1', nombre: 'Admin La Cabaña', cedula: '123456789', rol: 'ADMINISTRADOR', pin: '6789', estado: 'ACTIVO', fechaIngreso: '2024-01-01', telefono: '3001234567' },
  { id: '2', nombre: 'Juan Mesero', cedula: '1010202033', rol: 'MESERO', pin: '2033', estado: 'ACTIVO', fechaIngreso: '2024-02-15', telefono: '3109876543' },
  { id: '3', nombre: 'Marta Cocina', cedula: '9988776655', rol: 'COCINERO', pin: '6655', estado: 'ACTIVO', fechaIngreso: '2024-01-20', telefono: '3201112233' },
];

const initialPermisos: Record<Rol, string[]> = {
  ADMINISTRADOR: ["Dashboard", "Mesas", "Asado", "Parrilla", "Cocina", "Bar", "Caja", "Inventario", "Personal", "Reportes & AI"],
  MESERO: ["Mesas", "Asado", "Parrilla", "Cocina", "Bar"],
  COCINERO: ["Asado", "Parrilla", "Cocina"],
};

// Generar una fecha de hace 70 minutos para la prueba de retraso
const delayedTime = new Date(Date.now() - 70 * 60 * 1000).toISOString();

const initialOrdenes: Orden[] = [
  {
    id: 'ORD-PROMO-1',
    mesaId: 5,
    meseroId: '2',
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
  },
  {
    id: 'ORD-TEST-DELAY',
    mesaId: 10,
    meseroId: '2',
    estado: 'ABIERTA',
    createdAt: delayedTime,
    updatedAt: delayedTime,
    items: [
      {
        id: 'item-delayed-1',
        productoId: 'p1',
        nombre: 'Picaña Mediana',
        cantidad: 1,
        precioUnitario: 85000,
        estacion: 'ASADO',
        estado: 'PENDIENTE',
        createdAt: delayedTime,
        notas: 'Término Azul, urgente'
      }
    ]
  }
];

export const usePOSStore = create<POSState>((set, get) => ({
  user: null,
  usuarios: initialUsuarios,
  permisos: initialPermisos,
  mesas: [
    ...Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      numero: i + 1,
      zona: 'Primer Piso' as const,
      capacidad: 4,
      estado: (i === 4 || i === 9) ? 'EN PEDIDO' : 'LIBRE' as any,
    })),
    ...Array.from({ length: 5 }, (_, i) => ({
      id: 20 + i + 1,
      numero: 20 + i + 1,
      zona: 'Segundo Piso' as const,
      capacidad: 6,
      estado: 'LIBRE' as any,
    }))
  ],
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
  login: (pin) => {
    // Busca usuario cuyo PIN (últimos 4 de cédula) coincida
    const foundUser = get().usuarios.find(u => u.pin === pin && u.estado === 'ACTIVO');
    if (foundUser) {
      set({ user: foundUser });
      return foundUser;
    }
    return null;
  },
  logout: () => set({ user: null }),
  setUsuarios: (usuarios) => set({ usuarios }),
  addUsuario: (usuario) => set((state) => ({ usuarios: [...state.usuarios, usuario] })),
  updateUsuario: (id, updates) => set((state) => ({
    usuarios: state.usuarios.map(u => {
      if (u.id === id) {
        const newCedula = updates.cedula || u.cedula;
        const newPin = newCedula.length >= 4 ? newCedula.slice(-4) : newCedula;
        return { ...u, ...updates, pin: newPin };
      }
      return u;
    })
  })),
  deleteUsuario: (id) => set((state) => ({
    usuarios: state.usuarios.filter(u => u.id !== id)
  })),
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
  closeOrden: (ordenId, mesaId, metodoPago) => set((state) => ({
    ordenes: state.ordenes.map(o => o.id === ordenId ? { ...o, estado: 'CERRADA', metodoPago, updatedAt: new Date().toISOString() } : o),
    mesas: state.mesas.map(m => m.id === mesaId ? { ...m, estado: 'LIBRE', meseroId: undefined, ordenActivaId: undefined } : m)
  })),
  togglePermiso: (rol, label) => set((state) => {
    const rolPermisos = state.permisos[rol] || [];
    const exists = rolPermisos.includes(label);
    const updated = exists 
      ? rolPermisos.filter(p => p !== label)
      : [...rolPermisos, label];
    return {
      permisos: {
        ...state.permisos,
        [rol]: updated
      }
    };
  }),
}));
