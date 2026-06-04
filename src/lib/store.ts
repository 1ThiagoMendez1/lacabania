import { create } from 'zustand';
import { Mesa, Producto, MenuItem, Orden, Usuario, ItemOrden, EstadoComanda, MetodoPago, Rol } from './types';
import { supabase } from './supabase';
import { uuidv4 } from './utils';

// Helper seguro para importar QZ Tray únicamente en el cliente (evita errores SSR)
const getQz = () => {
  if (typeof window === 'undefined') return null;
  try {
    return require('qz-tray');
  } catch (e) {
    console.error("Error cargando QZ Tray dinámicamente:", e);
    return null;
  }
};

interface POSState {
  user: Usuario | null;
  usuarios: Usuario[];
  mesas: Mesa[];
  productos: Producto[];
  menuItems: MenuItem[];
  ordenes: Orden[];
  permisos: Record<Rol, string[]>;
  isInitialized: boolean;
  isCajaCerrada: boolean;
  fechaOperativa: string;
  isQzConnected: boolean;
  isQzConnecting: boolean;
  availablePrinters: string[];
  printerMappings: Record<string, string>;
  ipServidorImpresion: string;
  
  // Actions
  fetchInitialData: () => Promise<void>;
  setupRealtime: () => void;
  setUser: (user: Usuario | null) => void;
  login: (pin: string) => Promise<Usuario | null>;
  logout: () => void;
  setUsuarios: (usuarios: Usuario[]) => void;
  addUsuario: (usuario: Usuario) => Promise<void>;
  updateUsuario: (id: string, updates: Partial<Usuario>) => Promise<void>;
  deleteUsuario: (id: string) => Promise<void>;
  updateMesaEstado: (mesaId: number, estado: Mesa['estado'], meseroId?: string) => Promise<void>;
  updateMesa: (mesaId: number, updates: Partial<Mesa>) => Promise<void>;
  addMesa: (mesa: Mesa) => Promise<void>;
  deleteMesa: (mesaId: number) => Promise<void>;
  addOrden: (orden: Orden) => Promise<void>;
  updateOrden: (ordenId: string, updates: Partial<Orden>) => Promise<void>;
  addItemsToOrden: (ordenId: string, newItems: ItemOrden[]) => Promise<void>;
  updateItemEstado: (ordenId: string, itemId: string, estado: EstadoComanda) => Promise<void>;
  updateStock: (productoId: string, cantidad: number) => Promise<void>;
  adjustStock: (productoId: string, nuevoStock: number) => Promise<void>;
  addProducto: (producto: Producto) => Promise<void>;
  updateProducto: (id: string, updates: Partial<Producto>) => Promise<void>;
  deleteProducto: (id: string) => Promise<void>;
  addMenuItem: (item: MenuItem) => Promise<void>;
  updateMenuItem: (id: string, updates: Partial<MenuItem>) => Promise<void>;
  deleteMenuItem: (id: string) => Promise<void>;
  closeOrden: (ordenId: string, mesaId: number, metodoPago: MetodoPago) => Promise<void>;
  togglePermiso: (rol: Rol, menuLabel: string) => Promise<void>;
  setCajaCerrada: (cerrada: boolean) => void;
  setFechaOperativa: (fecha: string) => void;
  connectQz: () => Promise<void>;
  updatePrinterMapping: (stationId: string, printerName: string) => Promise<void>;
  updateIpServidorImpresion: (ip: string) => Promise<void>;
  printTicket: (stationId: string, data: any[]) => Promise<void>;
  checkQzConnection: () => Promise<void>;
}

export const usePOSStore = create<POSState>((set, get) => ({
  user: null,
  usuarios: [],
  permisos: {
    ADMINISTRADOR: ["Dashboard", "Mesas", "Asado", "Parrilla", "Cocina", "Bar", "Caja", "Menú Carta", "Inventario", "Personal", "Reportes & AI", "Impresoras", "Historial Meseros"],
    MESERO: ["Mesas", "Asado", "Parrilla", "Cocina", "Bar"],
    CAJERO: ["Caja"],
  },
  mesas: [],
  productos: [],
  menuItems: [],
  ordenes: [],
  isInitialized: false,
  isCajaCerrada: false,
  fechaOperativa: '',
  isQzConnected: false,
  isQzConnecting: false,
  availablePrinters: [],
  printerMappings: {},
  ipServidorImpresion: 'localhost',
  setCajaCerrada: (cerrada) => set({ isCajaCerrada: cerrada }),
  setFechaOperativa: (fecha) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('fecha_operativa', fecha);
    }
    const isClosed = typeof window !== 'undefined' && !!localStorage.getItem(`cierre_${fecha}`);
    set({ fechaOperativa: fecha, isCajaCerrada: isClosed });
  },

  fetchInitialData: async () => {
    // Fetch from Supabase
    const [usuariosRes, mesasRes, productosRes, menuRes, ordenesRes, permisosRes, configImpresorasRes] = await Promise.all([
      supabase.from('usuarios').select('*'),
      supabase.from('mesas').select('*'),
      supabase.from('productos').select('*'),
      supabase.from('menu_items').select('*'),
      supabase.from('ordenes').select('*, items:items_orden(*)'),
      supabase.from('permisos').select('*'),
      supabase.from('configuracion_impresoras').select('*').eq('id', 'default').maybeSingle(),
    ]);

    if (usuariosRes.error) console.error("Error al cargar usuarios de Supabase:", usuariosRes.error);
    if (mesasRes.error) console.error("Error al cargar mesas de Supabase:", mesasRes.error);
    if (productosRes.error) console.error("Error al cargar productos de Supabase:", productosRes.error);
    if (menuRes.error) console.error("Error al cargar menú de Supabase:", menuRes.error);
    if (ordenesRes.error) console.error("Error al cargar órdenes de Supabase:", ordenesRes.error);
    if (permisosRes.error) console.error("Error al cargar permisos de Supabase:", permisosRes.error);
    if (configImpresorasRes.error) console.error("Error al cargar configuracion de impresoras de Supabase:", configImpresorasRes.error);

    const permisosParsed: Record<string, string[]> = {
      ADMINISTRADOR: ["Dashboard", "Mesas", "Asado", "Parrilla", "Cocina", "Bar", "Caja", "Menú Carta", "Inventario", "Personal", "Reportes & AI", "Impresoras", "Historial Meseros"],
      MESERO: ["Mesas", "Asado", "Parrilla", "Cocina", "Bar"],
      CAJERO: ["Caja"],
    };
    if (permisosRes.data) {
      permisosRes.data.forEach(p => {
        permisosParsed[p.rol] = p.labels;
      });
    }

    const productosMapped = (productosRes.data || []).map((p: any) => ({
      id: p.id,
      sku: p.sku,
      nombre: p.nombre,
      descripcion: p.descripcion,
      precio: p.precio,
      categoria: p.categoria,
      estacion: p.estacion,
      imagen: p.imagen,
      stock: p.stock,
      stockMinimo: p.stock_minimo,
      unidadMedida: p.unidad_medida,
      costoProveedor: p.costo_proveedor,
      fechaVencimiento: p.fecha_vencimiento,
      ubicacion: p.ubicacion
    }));

    const menuMapped = (menuRes.data || []).map((m: any) => ({
      id: m.id,
      nombre: m.nombre,
      descripcion: m.descripcion,
      precio: m.precio,
      categoria: m.categoria,
      estacion: m.estacion,
      imagen: m.imagen,
      disponible: m.disponible,
    }));

    const usuariosMapped = (usuariosRes.data || []).map((u: any) => ({
      id: u.id,
      nombre: u.nombre,
      cedula: u.cedula,
      rol: u.rol,
      pin: u.pin,
      telefono: u.telefono,
      estado: u.estado,
      fechaIngreso: u.fecha_ingreso,
      fotoDocumento: u.foto_documento,
    }));

    const mapOrden = (o: any): Orden => ({
      id: o.id,
      mesaId: o.mesa_id,
      meseroId: o.mesero_id,
      estado: o.estado,
      metodoPago: o.metodo_pago,
      facturaElectronicaId: o.factura_electronica_id,
      createdAt: o.created_at,
      updatedAt: o.updated_at,
      items: (o.items || []).map((i: any) => ({
        id: i.id,
        menuItemId: i.menu_item_id || i.producto_id,
        nombre: i.nombre,
        cantidad: i.cantidad,
        precioUnitario: i.precio_unitario,
        notas: i.notas,
        estacion: i.estacion,
        estado: i.estado,
        createdAt: i.created_at
      }))
    });

    const ordenesMapped = (ordenesRes.data || []).map(mapOrden);

    const mesasMapped = (mesasRes.data || []).map((m: any) => ({
      id: m.id,
      numero: m.numero,
      zona: m.zona,
      capacidad: m.capacidad,
      estado: m.estado,
      meseroId: m.mesero_id || undefined,
      ordenActivaId: m.orden_activa_id || undefined,
      tiempoAbierta: m.tiempo_abierta || undefined,
    }));

    const getLocalDateString = () => {
      const d = new Date();
      const tzOffset = d.getTimezoneOffset() * 60000;
      const localISOTime = (new Date(d.getTime() - tzOffset)).toISOString().split('T')[0];
      return localISOTime;
    };
    let activeFecha = getLocalDateString();
    if (typeof window !== 'undefined') {
      const savedFecha = localStorage.getItem('fecha_operativa');
      if (savedFecha && /^\d{4}-\d{2}-\d{2}$/.test(savedFecha)) {
        activeFecha = savedFecha;
      } else {
        localStorage.setItem('fecha_operativa', activeFecha);
      }
    }
    const isClosed = typeof window !== 'undefined' && !!localStorage.getItem(`cierre_${activeFecha}`);

    let savedMappings: Record<string, string> = {};
    let ipServidor = 'localhost';
    if (configImpresorasRes.data) {
      ipServidor = configImpresorasRes.data.ip_servidor || 'localhost';
      savedMappings = configImpresorasRes.data.mappings || {};
    } else {
      if (typeof window !== 'undefined') {
        const raw = localStorage.getItem('printer_mappings');
        if (raw) {
          try {
            savedMappings = JSON.parse(raw);
          } catch (e) {
            console.error("Error parsing printer mappings:", e);
          }
        }
        const savedIp = localStorage.getItem('ip_servidor_impresion');
        if (savedIp) {
          ipServidor = savedIp;
        }
      }
    }

    set({
      usuarios: usuariosMapped,
      mesas: mesasMapped,
      productos: productosMapped,
      menuItems: menuMapped,
      ordenes: ordenesMapped,
      permisos: permisosParsed as Record<Rol, string[]>,
      isInitialized: true,
      fechaOperativa: activeFecha,
      isCajaCerrada: isClosed,
      printerMappings: savedMappings,
      ipServidorImpresion: ipServidor
    });
    
    get().setupRealtime();
    get().checkQzConnection().catch(e => console.warn("QZ Tray auto-connect skipped:", e));
  },

  setupRealtime: () => {
    supabase.removeAllChannels();
    supabase
      .channel('mesas-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'mesas' },
        (payload) => {
          const { eventType, new: newRecord, old: oldRecord } = payload;
          if (eventType === 'INSERT') {
            set((state) => {
              if (state.mesas.find(m => m.id === newRecord.id)) return state;
              const mappedMesa: Mesa = {
                id: newRecord.id,
                numero: newRecord.numero,
                zona: newRecord.zona,
                capacidad: newRecord.capacidad,
                estado: newRecord.estado,
                meseroId: newRecord.mesero_id || undefined,
                ordenActivaId: newRecord.orden_activa_id || undefined,
                tiempoAbierta: newRecord.tiempo_abierta || undefined,
              };
              return { mesas: [...state.mesas, mappedMesa].sort((a, b) => a.id - b.id) };
            });
          } else if (eventType === 'UPDATE') {
            set((state) => ({
              mesas: state.mesas.map(m => m.id === newRecord.id ? { 
                ...m, 
                estado: newRecord.estado,
                zona: newRecord.zona,
                capacidad: newRecord.capacidad,
                meseroId: newRecord.mesero_id || undefined,
                ordenActivaId: newRecord.orden_activa_id || undefined,
                tiempoAbierta: newRecord.tiempo_abierta || undefined,
              } : m)
            }));
          } else if (eventType === 'DELETE') {
            set((state) => ({
              mesas: state.mesas.filter(m => m.id !== oldRecord.id)
            }));
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'ordenes' },
        (payload) => {
          const { eventType, new: newRecord, old: oldRecord } = payload;
          if (eventType === 'INSERT') {
            // Fetch the full order with items to have complete data
            supabase.from('ordenes').select('*, items:items_orden(*)').eq('id', newRecord.id).maybeSingle()
              .then(({ data }) => {
                if (data) {
                  const mappedOrder: Orden = {
                    id: data.id,
                    mesaId: data.mesa_id,
                    meseroId: data.mesero_id,
                    estado: data.estado,
                    metodoPago: data.metodo_pago,
                    facturaElectronicaId: data.factura_electronica_id,
                    createdAt: data.created_at,
                    updatedAt: data.updated_at,
                    items: (data.items || []).map((i: any) => ({
                      id: i.id,
                      menuItemId: i.menu_item_id || i.producto_id,
                      nombre: i.nombre,
                      cantidad: i.cantidad,
                      precioUnitario: i.precio_unitario,
                      notas: i.notas,
                      estacion: i.estacion,
                      estado: i.estado,
                      createdAt: i.created_at
                    }))
                  };
                  set((state) => {
                    if (state.ordenes.find(o => o.id === mappedOrder.id)) return state;
                    return { ordenes: [...state.ordenes, mappedOrder] };
                  });
                }
              });
          } else if (eventType === 'UPDATE') {
            set((state) => ({
              ordenes: state.ordenes.map(o => o.id === newRecord.id ? { ...o, estado: newRecord.estado, metodoPago: newRecord.metodo_pago, updatedAt: newRecord.updated_at } : o)
            }));
          } else if (eventType === 'DELETE') {
            set((state) => ({
              ordenes: state.ordenes.filter(o => o.id !== oldRecord.id)
            }));
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'items_orden' },
        (payload) => {
          const { eventType, new: newRecord } = payload;
          if (eventType === 'INSERT') {
            set((state) => ({
              ordenes: state.ordenes.map(o => {
                if (o.id === newRecord.orden_id) {
                  const newItem = {
                    id: newRecord.id,
                    menuItemId: newRecord.menu_item_id,
                    nombre: newRecord.nombre,
                    cantidad: newRecord.cantidad,
                    precioUnitario: newRecord.precio_unitario,
                    notas: newRecord.notas,
                    estacion: newRecord.estacion,
                    estado: newRecord.estado,
                    createdAt: newRecord.created_at
                  };
                  if (o.items?.find(i => i.id === newItem.id)) return o;
                  return { ...o, items: [...(o.items || []), newItem] };
                }
                return o;
              })
            }));
          } else if (eventType === 'UPDATE') {
            set((state) => ({
              ordenes: state.ordenes.map(o => {
                if (o.id === newRecord.orden_id) {
                  return {
                    ...o,
                    items: o.items.map(i => i.id === newRecord.id ? { ...i, estado: newRecord.estado } : i)
                  };
                }
                return o;
              })
            }));
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'configuracion_impresoras' },
        (payload) => {
          const { eventType, new: newRecord } = payload;
          if (eventType === 'INSERT' || eventType === 'UPDATE') {
            if (newRecord.id === 'default') {
              set({
                ipServidorImpresion: newRecord.ip_servidor || 'localhost',
                printerMappings: newRecord.mappings || {}
              });
              if (typeof window !== 'undefined') {
                localStorage.setItem('printer_mappings', JSON.stringify(newRecord.mappings || {}));
                localStorage.setItem('ip_servidor_impresion', newRecord.ip_servidor || 'localhost');
              }
            }
          }
        }
      )
      .subscribe();
  },

  setUser: (user) => set({ user }),
  login: async (pin) => {
    // Optimistic check first if already loaded, else query
    let foundUser = get().usuarios.find(u => u.pin === pin && u.estado === 'ACTIVO');
    if (!foundUser) {
      try {
        const { data, error } = await supabase.from('usuarios').select('*').eq('pin', pin).eq('estado', 'ACTIVO').maybeSingle();
        if (error) {
          console.error("Supabase login error:", error);
        }
        if (data) {
          foundUser = data as Usuario;
        }
      } catch (err) {
        console.error("Unexpected login error:", err);
      }
    }
    
    if (foundUser) {
      set({ user: foundUser });
      return foundUser;
    }
    return null;
  },
  logout: () => {
    supabase.removeAllChannels();
    set({ 
      user: null, 
      isInitialized: false,
      ordenes: [],
      mesas: [],
      productos: [],
      menuItems: [],
      isCajaCerrada: false,
      fechaOperativa: ''
    });
  },
  setUsuarios: (usuarios) => set({ usuarios }),
  addUsuario: async (usuario) => {
    const id = uuidv4();
    const newUser = { ...usuario, id };
    
    const { error } = await supabase.from('usuarios').insert({
      id,
      nombre: newUser.nombre,
      cedula: newUser.cedula,
      rol: newUser.rol,
      pin: newUser.pin,
      telefono: newUser.telefono,
      estado: newUser.estado,
      fecha_ingreso: newUser.fechaIngreso,
      foto_documento: newUser.fotoDocumento || null
    });
    
    if (error) {
      console.error("Error al insertar usuario en Supabase:", error);
      throw new Error(error.message);
    }

    set((state) => ({ usuarios: [...state.usuarios, newUser] }));
  },
  updateUsuario: async (id, updates) => {
    const dbUpdates: any = { ...updates };
    if (dbUpdates.fechaIngreso !== undefined) {
      dbUpdates.fecha_ingreso = dbUpdates.fechaIngreso;
      delete dbUpdates.fechaIngreso;
    }
    if (dbUpdates.fotoDocumento !== undefined) {
      dbUpdates.foto_documento = dbUpdates.fotoDocumento;
      delete dbUpdates.fotoDocumento;
    }
    delete dbUpdates.id;

    const { error } = await supabase.from('usuarios').update(dbUpdates).eq('id', id);
    if (error) {
      console.error("Error al actualizar usuario en Supabase:", error);
      throw new Error(error.message);
    }

    set((state) => ({
      usuarios: state.usuarios.map(u => {
        if (u.id === id) {
          const newCedula = updates.cedula || u.cedula;
          const newPin = newCedula.length >= 4 ? newCedula.slice(-4) : newCedula;
          return { ...u, ...updates, pin: newPin };
        }
        return u;
      })
    }));
  },
  deleteUsuario: async (id) => {
    set((state) => ({ usuarios: state.usuarios.filter(u => u.id !== id) }));
    const { error } = await supabase.from('usuarios').delete().eq('id', id);
    if (error) console.error("Error al eliminar usuario de Supabase:", error);
  },
  updateMesaEstado: async (mesaId, estado, meseroId) => {
    set((state) => ({ mesas: state.mesas.map(m => m.id === mesaId ? { ...m, estado, meseroId } : m) }));
    const { error } = await supabase.from('mesas').update({ estado, mesero_id: meseroId }).eq('id', mesaId);
    if (error) console.error("Error al actualizar estado de mesa en Supabase:", error);
  },
  updateMesa: async (mesaId, updates) => {
    set((state) => ({ mesas: state.mesas.map(m => m.id === mesaId ? { ...m, ...updates } : m) }));
    const { error } = await supabase.from('mesas').update(updates).eq('id', mesaId);
    if (error) console.error("Error al actualizar mesa en Supabase:", error);
  },
  addMesa: async (mesa) => {
    set((state) => ({ mesas: [...state.mesas, mesa].sort((a, b) => a.id - b.id) }));
    const { error } = await supabase.from('mesas').insert(mesa);
    if (error) console.error("Error al añadir mesa en Supabase:", error);
  },
  deleteMesa: async (mesaId) => {
    set((state) => ({ mesas: state.mesas.filter(m => m.id !== mesaId) }));
    const { error } = await supabase.from('mesas').delete().eq('id', mesaId);
    if (error) console.error("Error al eliminar mesa de Supabase:", error);
  },
  addOrden: async (orden) => {
    set((state) => ({ ordenes: [...state.ordenes, orden] }));
    const { items, ...ordenData } = orden as any;
    const { error: orderError } = await supabase.from('ordenes').insert({
      id: ordenData.id,
      mesa_id: ordenData.mesaId,
      mesero_id: ordenData.meseroId,
      estado: ordenData.estado,
      created_at: ordenData.createdAt,
      updated_at: ordenData.updatedAt
    });
    if (orderError) {
      console.error("Error al insertar orden en Supabase:", orderError);
    }
    if (items && items.length > 0) {
      const { error: itemsError } = await supabase.from('items_orden').insert(items.map((i: any) => ({
        id: i.id,
        orden_id: ordenData.id,
        menu_item_id: i.menuItemId,
        nombre: i.nombre,
        cantidad: i.cantidad,
        precio_unitario: i.precioUnitario,
        notas: i.notas,
        estacion: i.estacion,
        estado: i.estado,
        created_at: i.createdAt
      })));
      if (itemsError) {
        console.error("Error al insertar items de orden en Supabase:", itemsError);
      }
    }
  },
  updateOrden: async (ordenId, updates) => {
    set((state) => ({ ordenes: state.ordenes.map(o => o.id === ordenId ? { ...o, ...updates } : o) }));
    const { error } = await supabase.from('ordenes').update(updates).eq('id', ordenId);
    if (error) console.error("Error al actualizar orden en Supabase:", error);
  },
  addItemsToOrden: async (ordenId, newItems) => {
    set((state) => ({
      ordenes: state.ordenes.map(o => o.id === ordenId ? { ...o, items: [...(o.items || []), ...newItems] } : o)
    }));
    const { error } = await supabase.from('items_orden').insert(newItems.map((i: any) => ({
      id: i.id,
      orden_id: ordenId,
      menu_item_id: i.menuItemId,
      nombre: i.nombre,
      cantidad: i.cantidad,
      precio_unitario: i.precioUnitario,
      notas: i.notas,
      estacion: i.estacion,
      estado: i.estado,
      created_at: i.createdAt
    })));
    if (error) {
      console.error("Error al añadir items a la orden en Supabase:", error);
    }
  },
  updateItemEstado: async (ordenId, itemId, estado) => {
    set((state) => ({
      ordenes: state.ordenes.map(o => 
        o.id === ordenId 
          ? { ...o, items: o.items.map(i => i.id === itemId ? { ...i, estado } : i) }
          : o
      )
    }));
    const { error } = await supabase.from('items_orden').update({ estado }).eq('id', itemId);
    if (error) console.error("Error al actualizar estado de item de orden en Supabase:", error);
  },
  updateStock: async (productoId, cantidad) => {
    const p = get().productos.find(p => p.id === productoId);
    if (!p) return;
    const newStock = Math.max(0, p.stock - cantidad);
    set((state) => ({
      productos: state.productos.map(p => p.id === productoId ? { ...p, stock: newStock } : p)
    }));
    const { error } = await supabase.from('productos').update({ stock: newStock }).eq('id', productoId);
    if (error) console.error("Error al actualizar stock del producto en Supabase:", error);
  },
  adjustStock: async (productoId, nuevoStock) => {
    set((state) => ({
      productos: state.productos.map(p => p.id === productoId ? { ...p, stock: nuevoStock } : p)
    }));
    const { error } = await supabase.from('productos').update({ stock: nuevoStock }).eq('id', productoId);
    if (error) console.error("Error al ajustar stock del producto en Supabase:", error);
  },
  addProducto: async (producto) => {
    const id = uuidv4();
    const newProducto = { ...producto, id };
    
    set((state) => ({ productos: [...state.productos, newProducto] }));
    
    const { error } = await supabase.from('productos').insert({
      id,
      sku: newProducto.sku,
      nombre: newProducto.nombre,
      descripcion: newProducto.descripcion,
      precio: newProducto.precio,
      categoria: newProducto.categoria,
      estacion: newProducto.estacion,
      stock: newProducto.stock,
      stock_minimo: newProducto.stockMinimo,
      imagen: newProducto.imagen,
      unidad_medida: newProducto.unidadMedida,
      costo_proveedor: newProducto.costoProveedor,
      fecha_vencimiento: newProducto.fechaVencimiento || null,
      ubicacion: newProducto.ubicacion
    });

    if (error) {
      console.error("Error al insertar producto:", error);
      // Optional: rollback state if needed
    }
  },
  updateProducto: async (id, updates) => {
    set((state) => ({
      productos: state.productos.map(p => p.id === id ? { ...p, ...updates } : p)
    }));
    
    const dbUpdates: any = { ...updates };
    if (dbUpdates.stockMinimo !== undefined) {
      dbUpdates.stock_minimo = dbUpdates.stockMinimo;
      delete dbUpdates.stockMinimo;
    }
    if (dbUpdates.unidadMedida !== undefined) {
      dbUpdates.unidad_medida = dbUpdates.unidadMedida;
      delete dbUpdates.unidadMedida;
    }
    if (dbUpdates.costoProveedor !== undefined) {
      dbUpdates.costo_proveedor = dbUpdates.costoProveedor;
      delete dbUpdates.costoProveedor;
    }
    if (dbUpdates.fechaVencimiento !== undefined) {
      dbUpdates.fecha_vencimiento = dbUpdates.fechaVencimiento;
      delete dbUpdates.fechaVencimiento;
    }
    const { error } = await supabase.from('productos').update(dbUpdates).eq('id', id);
    if (error) console.error("Error al actualizar producto en Supabase:", error);
  },
  deleteProducto: async (id) => {
    set((state) => ({ productos: state.productos.filter(p => p.id !== id) }));
    const { error } = await supabase.from('productos').delete().eq('id', id);
    if (error) console.error("Error al eliminar producto de Supabase:", error);
  },
  addMenuItem: async (item) => {
    const id = uuidv4();
    const newItem = { ...item, id };
    set((state) => ({ menuItems: [...state.menuItems, newItem] }));
    const { error } = await supabase.from('menu_items').insert({
      id,
      nombre: newItem.nombre,
      descripcion: newItem.descripcion,
      precio: newItem.precio,
      categoria: newItem.categoria,
      estacion: newItem.estacion,
      imagen: newItem.imagen,
      disponible: newItem.disponible
    });
    if (error) console.error("Error al insertar menu item:", error);
  },
  updateMenuItem: async (id, updates) => {
    set((state) => ({
      menuItems: state.menuItems.map(m => m.id === id ? { ...m, ...updates } : m)
    }));
    const { error } = await supabase.from('menu_items').update(updates).eq('id', id);
    if (error) console.error("Error al actualizar menu item en Supabase:", error);
  },
  deleteMenuItem: async (id) => {
    set((state) => ({ menuItems: state.menuItems.filter(m => m.id !== id) }));
    const { error } = await supabase.from('menu_items').delete().eq('id', id);
    if (error) console.error("Error al eliminar menu item de Supabase:", error);
  },
  closeOrden: async (ordenId, mesaId, metodoPago) => {
    const activeFecha = get().fechaOperativa;
    
    // Construct local timestamp matching the active operational date
    const now = new Date();
    const timePart = now.toTimeString().split(' ')[0]; // hh:mm:ss
    const ms = String(now.getMilliseconds()).padStart(3, '0');
    const offsetMinutes = now.getTimezoneOffset();
    const absOffset = Math.abs(offsetMinutes);
    const sign = offsetMinutes > 0 ? '-' : '+';
    const offsetHours = String(Math.floor(absOffset / 60)).padStart(2, '0');
    const offsetMins = String(absOffset % 60).padStart(2, '0');
    const timezoneOffsetStr = `${sign}${offsetHours}:${offsetMins}`;
    
    const operationalTimestamp = activeFecha 
      ? `${activeFecha}T${timePart}.${ms}${timezoneOffsetStr}`
      : new Date().toISOString();

    set((state) => ({
      ordenes: state.ordenes.map(o => o.id === ordenId ? { ...o, estado: 'CERRADA', metodoPago, updatedAt: operationalTimestamp } : o),
      mesas: state.mesas.map(m => m.id === mesaId ? { ...m, estado: 'LIBRE', meseroId: undefined, ordenActivaId: undefined } : m)
    }));
    const [orderRes, mesaRes] = await Promise.all([
      supabase.from('ordenes').update({ 
        estado: 'CERRADA', 
        metodo_pago: metodoPago, 
        updated_at: operationalTimestamp 
      }).eq('id', ordenId),
      supabase.from('mesas').update({ estado: 'LIBRE', mesero_id: null, orden_activa_id: null }).eq('id', mesaId)
    ]);
    if (orderRes.error) console.error("Error al cerrar orden en Supabase:", orderRes.error);
    if (mesaRes.error) console.error("Error al actualizar mesa al cerrar orden en Supabase:", mesaRes.error);
  },
  togglePermiso: async (rol, label) => {
    const state = get();
    const rolPermisos = state.permisos[rol] || [];
    const exists = rolPermisos.includes(label);
    const updated = exists 
      ? rolPermisos.filter(p => p !== label)
      : [...rolPermisos, label];
    
    set((state) => ({
      permisos: {
        ...state.permisos,
        [rol]: updated
      }
    }));

    const { error } = await supabase.from('permisos').upsert({ rol, labels: updated });
    if (error) console.error("Error al guardar permisos en Supabase:", error);
  },
  connectQz: async () => {
    const qz = getQz();
    if (!qz) throw new Error("QZ Tray no está disponible en este entorno.");
    
    set({ isQzConnecting: true });
    try {
      if (!qz.websocket.isActive()) {
        try {
          // Intentar conectar a localhost primero (para la computadora misma)
          await qz.websocket.connect({ retries: 1, delay: 1 });
        } catch (localErr: any) {
          // Si falla, probar con el ipServidorImpresion configurado en la base de datos
          const dbIp = get().ipServidorImpresion;
          const host = typeof window !== 'undefined' ? window.location.hostname : '';
          
          if (dbIp && dbIp !== 'localhost' && dbIp !== '127.0.0.1') {
            try {
              await qz.websocket.connect({ retries: 2, delay: 1, host: dbIp });
            } catch (remoteErr: any) {
              throw new Error(`Fallo al conectar con servidor de impresión en IP ${dbIp}: ${remoteErr.message || remoteErr}`);
            }
          } else if (host && host !== 'localhost' && host !== '127.0.0.1') {
            try {
              await qz.websocket.connect({ retries: 2, delay: 1, host });
            } catch (remoteErr: any) {
              throw new Error(`Fallo al conectar con servidor de impresión en host ${host}: ${remoteErr.message || remoteErr}`);
            }
          } else {
            throw new Error(`QZ Tray no está corriendo localmente: ${localErr.message || localErr}`);
          }
        }
      }
      const printers = await qz.printers.find();
      set({ isQzConnected: true, availablePrinters: printers, isQzConnecting: false });
    } catch (e: any) {
      set({ isQzConnected: false, isQzConnecting: false });
      throw e;
    }
  },
  updatePrinterMapping: async (stationId, printerName) => {
    const current = get().printerMappings;
    const updated = { ...current, [stationId]: printerName };
    set({ printerMappings: updated });
    if (typeof window !== 'undefined') {
      localStorage.setItem('printer_mappings', JSON.stringify(updated));
    }
    
    // Guardar en Supabase
    const ip = get().ipServidorImpresion;
    const { error } = await supabase.from('configuracion_impresoras').upsert({
      id: 'default',
      ip_servidor: ip,
      mappings: updated
    });
    if (error) console.error("Error al guardar mappings en Supabase:", error);
  },
  updateIpServidorImpresion: async (ip) => {
    set({ ipServidorImpresion: ip });
    if (typeof window !== 'undefined') {
      localStorage.setItem('ip_servidor_impresion', ip);
    }
    const mappings = get().printerMappings;
    const { error } = await supabase.from('configuracion_impresoras').upsert({
      id: 'default',
      ip_servidor: ip,
      mappings
    });
    if (error) console.error("Error al guardar IP de servidor en Supabase:", error);
  },
  printTicket: async (stationId, data) => {
    const qz = getQz();
    if (!qz) throw new Error("QZ Tray no está disponible en este entorno.");

    const printer = get().printerMappings[stationId];
    if (!printer) {
      throw new Error(`No hay impresora asignada para la estación ${stationId}`);
    }
    
    const connectIfNeeded = async () => {
      if (!qz.websocket.isActive()) {
        try {
          await qz.websocket.connect({ retries: 1, delay: 1 });
        } catch (localErr: any) {
          const dbIp = get().ipServidorImpresion;
          const host = typeof window !== 'undefined' ? window.location.hostname : '';
          if (dbIp && dbIp !== 'localhost' && dbIp !== '127.0.0.1') {
            try {
              await qz.websocket.connect({ retries: 2, delay: 1, host: dbIp });
            } catch (remoteErr: any) {
              throw new Error(`No se pudo conectar a la PC impresora en IP ${dbIp}: ${remoteErr.message || remoteErr}`);
            }
          } else if (host && host !== 'localhost' && host !== '127.0.0.1') {
            try {
              await qz.websocket.connect({ retries: 2, delay: 1, host });
            } catch (remoteErr: any) {
              throw new Error(`No se pudo conectar a la PC impresora en host ${host}: ${remoteErr.message || remoteErr}`);
            }
          } else {
            throw new Error(`QZ Tray local inactivo y no hay IP externa configurada: ${localErr.message || localErr}`);
          }
        }
        set({ isQzConnected: true });
      }
    };

    await connectIfNeeded();
    
    try {
      const config = qz.configs.create(printer);
      await qz.print(config, data);
    } catch (printErr: any) {
      // Si el error es que la conexión no se ha establecido, forzamos desconexión y reintento
      if (printErr.message && printErr.message.includes("not been established yet")) {
        console.warn("Conexión perdida con QZ Tray, intentando reconectar y reintentar...");
        try {
          try {
            await qz.websocket.disconnect();
          } catch (e) {}
          await connectIfNeeded();
          const config = qz.configs.create(printer);
          await qz.print(config, data);
          return;
        } catch (retryErr: any) {
          throw new Error(`Reconexión fallida: ${retryErr.message || retryErr}`);
        }
      }
      throw new Error(`QZ Tray conectado, pero falló la impresión física en "${printer}": ${printErr.message || printErr}`);
    }
  },
  checkQzConnection: async () => {
    const qz = getQz();
    if (!qz) return;
    try {
      if (qz.websocket.isActive()) {
        const printers = await qz.printers.find();
        set({ isQzConnected: true, availablePrinters: printers });
      } else {
        set({ isQzConnecting: true });
        try {
          await qz.websocket.connect({ retries: 1, delay: 1 });
        } catch (localErr) {
          const dbIp = get().ipServidorImpresion;
          const host = typeof window !== 'undefined' ? window.location.hostname : '';
          if (dbIp && dbIp !== 'localhost' && dbIp !== '127.0.0.1') {
            await qz.websocket.connect({ retries: 1, delay: 1, host: dbIp });
          } else if (host && host !== 'localhost' && host !== '127.0.0.1') {
            await qz.websocket.connect({ retries: 1, delay: 1, host });
          } else {
            throw localErr;
          }
        }
        const printers = await qz.printers.find();
        set({ isQzConnected: true, availablePrinters: printers, isQzConnecting: false });
      }
    } catch (e) {
      set({ isQzConnected: false, isQzConnecting: false });
    }
  },
}));
