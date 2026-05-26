
"use client"

import { usePOSStore } from "@/lib/store";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Plus, 
  Minus, 
  Trash2, 
  Send, 
  ChevronLeft,
  Search,
  ShoppingCart,
  Utensils
} from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ItemOrden, Producto } from "@/lib/types";

export default function OrderPage() {
  const { mesaId } = useParams();
  const router = useRouter();
  const { productos, mesas, addOrden, updateMesaEstado, user } = usePOSStore();
  
  const mesa = mesas.find(m => m.id === Number(mesaId));
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("TODOS");
  const [cart, setCart] = useState<{producto: Producto, cantidad: number}[]>([]);

  const categories = ["TODOS", ...new Set(productos.map(p => p.categoria))];
  const filteredProducts = productos.filter(p => p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) && (selectedCategory === "TODOS" || p.categoria === selectedCategory));

  const addToCart = (product: Producto) => {
    setCart(prev => {
      const existing = prev.find(item => item.producto.id === product.id);
      if (existing) return prev.map(item => item.producto.id === product.id ? { ...item, cantidad: item.cantidad + 1 } : item);
      return [...prev, { producto: product, cantidad: 1 }];
    });
  };

  const handleSendOrder = () => {
    if (cart.length === 0) return;
    const newItems: ItemOrden[] = cart.map(item => ({
      id: Math.random().toString(36).substr(2, 9),
      productoId: item.producto.id,
      nombre: item.producto.nombre,
      cantidad: item.cantidad,
      precioUnitario: item.producto.precio,
      estacion: item.producto.estacion,
      estado: 'PENDIENTE',
      createdAt: new Date().toISOString()
    }));
    addOrden({ id: `ORD-${Date.now()}`, mesaId: Number(mesaId), meseroId: user?.id || 'sys', items: newItems, estado: 'ABIERTA', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    updateMesaEstado(Number(mesaId), 'EN PEDIDO', user?.id);
    router.push('/mesas');
  };

  if (!mesa) return <div className="p-8">Mesa no encontrada</div>;

  return (
    <main className="p-8 flex flex-col h-full">
      <header className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.back()}><ChevronLeft className="w-5 h-5" /></Button>
          <h2 className="text-3xl font-headline">Mesa {mesa.id}</h2>
        </div>
      </header>

      <div className="flex-1 flex gap-8 overflow-hidden">
        <div className="flex-1 flex flex-col gap-6 overflow-hidden">
          <div className="flex gap-4">
            <Input placeholder="Buscar..." className="bg-card" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            <ScrollArea className="w-full max-w-sm">
              <div className="flex gap-2">{categories.map(cat => <Button key={cat} variant={selectedCategory === cat ? "default" : "outline"} size="sm" onClick={() => setSelectedCategory(cat)}>{cat}</Button>)}</div>
            </ScrollArea>
          </div>
          <ScrollArea className="flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProducts.map(p => (
                <Card key={p.id} className="bg-card/50 cursor-pointer hover:border-primary" onClick={() => addToCart(p)}>
                  <CardContent className="p-4 flex flex-col justify-between h-full">
                    <h4 className="font-bold">{p.nombre}</h4>
                    <span className="text-xl font-black text-secondary mt-4">${p.precio.toLocaleString()}</span>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </div>

        <Card className="w-96 bg-card border-border paper-texture flex flex-col">
          <CardHeader className="border-b"><CardTitle className="text-lg">Comanda</CardTitle></CardHeader>
          <ScrollArea className="flex-1 p-4">
            {cart.map(item => (
              <div key={item.producto.id} className="flex justify-between items-center p-2 bg-accent/30 rounded mb-2">
                <span className="text-sm font-bold">{item.cantidad}x {item.producto.nombre}</span>
                <span className="text-xs font-mono">${(item.producto.precio * item.cantidad).toLocaleString()}</span>
              </div>
            ))}
          </ScrollArea>
          <div className="p-6 border-t bg-accent/20">
            <div className="flex justify-between mb-4"><span className="text-2xl font-black text-secondary">${cart.reduce((a, b) => a + (b.producto.precio * b.cantidad), 0).toLocaleString()}</span></div>
            <Button disabled={cart.length === 0} onClick={handleSendOrder} className="w-full h-12 font-bold">ENVIAR A COCINA</Button>
          </div>
        </Card>
      </div>
    </main>
  );
}
