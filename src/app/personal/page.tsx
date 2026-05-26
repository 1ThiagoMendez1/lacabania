"use client"

import { usePOSStore } from "@/lib/store";
import { 
  Users, 
  UserPlus, 
  Search, 
  Phone, 
  Calendar, 
  ShieldCheck, 
  MoreVertical,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle
} from "lucide-react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Rol, Usuario } from "@/lib/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function PersonalPage() {
  const { usuarios, addUsuario, updateUsuario, deleteUsuario } = usePOSStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const [newStaff, setNewStaff] = useState<Partial<Usuario>>({
    nombre: "",
    rol: "MESERO",
    telefono: "",
    estado: "ACTIVO"
  });

  const filteredStaff = usuarios.filter(u => 
    u.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.rol.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: usuarios.length,
    activos: usuarios.filter(u => u.estado === 'ACTIVO').length,
    meseros: usuarios.filter(u => u.rol === 'MESERO').length,
    cocina: usuarios.filter(u => u.rol === 'COCINERO').length,
  };

  const handleCreateStaff = () => {
    if (!newStaff.nombre) return;
    const staff: Usuario = {
      id: `u-${Date.now()}`,
      nombre: newStaff.nombre!,
      rol: (newStaff.rol as Rol) || "MESERO",
      telefono: newStaff.telefono || "",
      estado: "ACTIVO",
      fechaIngreso: new Date().toISOString().split('T')[0],
    };
    addUsuario(staff);
    setIsDialogOpen(false);
    setNewStaff({ nombre: "", rol: "MESERO", telefono: "", estado: "ACTIVO" });
    toast({ title: "Personal Registrado", description: `${staff.nombre} ha sido agregado al equipo.` });
  };

  const toggleEstado = (user: Usuario) => {
    const nuevoEstado = user.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
    updateUsuario(user.id, { estado: nuevoEstado });
    toast({ title: "Estado Actualizado", description: `${user.nombre} ahora está ${nuevoEstado.toLowerCase()}.` });
  };

  const handleDelete = (id: string) => {
    deleteUsuario(id);
    toast({ variant: "destructive", title: "Personal Eliminado", description: "El registro ha sido removido del sistema." });
  };

  const getRoleBadge = (rol: Rol) => {
    switch (rol) {
      case 'ADMINISTRADOR': return <Badge className="bg-purple-500/20 text-purple-500 border-purple-500/50">ADMIN</Badge>;
      case 'CAJERO': return <Badge className="bg-blue-500/20 text-blue-500 border-blue-500/50">CAJA</Badge>;
      case 'MESERO': return <Badge className="bg-green-500/20 text-green-500 border-green-500/50">MESERO</Badge>;
      case 'COCINERO': return <Badge className="bg-orange-500/20 text-orange-500 border-orange-500/50">COCINA</Badge>;
      case 'BARTENDER': return <Badge className="bg-cyan-500/20 text-cyan-500 border-cyan-500/50">BAR</Badge>;
      default: return <Badge variant="outline">{rol}</Badge>;
    }
  };

  return (
    <main className="p-8">
      <header className="flex justify-between items-end mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Users className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-3xl font-headline text-foreground">Gestión de Personal</h2>
          </div>
          <p className="text-muted-foreground">Administra tu equipo de La Cabaña 🤠</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-secondary text-secondary-foreground hover:glow-gold font-bold gap-2">
              <UserPlus className="w-5 h-5" /> Registrar Personal
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border text-foreground">
            <DialogHeader><DialogTitle className="text-2xl font-headline">Nuevo Integrante</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Nombre Completo</Label>
                <Input value={newStaff.nombre} onChange={(e) => setNewStaff({...newStaff, nombre: e.target.value})} placeholder="Ej: Pedro Pérez" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Rol / Cargo</Label>
                  <Select onValueChange={(val) => setNewStaff({...newStaff, rol: val as Rol})} defaultValue="MESERO">
                    <SelectTrigger><SelectValue placeholder="Selecciona Rol" /></SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="ADMINISTRADOR">Administrador</SelectItem>
                      <SelectItem value="CAJERO">Cajero</SelectItem>
                      <SelectItem value="MESERO">Mesero</SelectItem>
                      <SelectItem value="COCINERO">Cocinero</SelectItem>
                      <SelectItem value="BARTENDER">Bartender</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Teléfono</Label>
                  <Input value={newStaff.telefono} onChange={(e) => setNewStaff({...newStaff, telefono: e.target.value})} placeholder="300 123 4567" />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
              <Button className="bg-primary font-bold" onClick={handleCreateStaff}>AGREGAR EQUIPO</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="bg-card border-border shadow-md">
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground uppercase mb-1">Total Equipo</p>
            <h3 className="text-2xl font-bold">{stats.total} personas</h3>
          </CardContent>
        </Card>
        <Card className="bg-card border-border shadow-md">
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground uppercase mb-1">Activos</p>
            <h3 className="text-2xl font-bold text-green-500">{stats.activos}</h3>
          </CardContent>
        </Card>
        <Card className="bg-card border-border shadow-md">
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground uppercase mb-1">Meseros</p>
            <h3 className="text-2xl font-bold text-secondary">{stats.meseros}</h3>
          </CardContent>
        </Card>
        <Card className="bg-card border-border shadow-md">
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground uppercase mb-1">En Cocina</p>
            <h3 className="text-2xl font-bold text-primary">{stats.cocina}</h3>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-border paper-texture overflow-hidden shadow-xl">
        <CardHeader className="flex flex-row items-center justify-between border-b border-border/50">
          <CardTitle className="text-xl font-headline">Nómina Activa</CardTitle>
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Buscar por nombre o rol..." className="pl-10 bg-background" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-accent/50">
              <TableRow className="border-border">
                <TableHead>Integrante</TableHead>
                <TableHead>Cargo</TableHead>
                <TableHead>Contacto</TableHead>
                <TableHead>Ingreso</TableHead>
                <TableHead className="text-center">Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStaff.map((u) => (
                <TableRow key={u.id} className={cn("border-border hover:bg-accent/20", u.estado === 'INACTIVO' && "opacity-60 grayscale")}>
                  <TableCell className="font-bold flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">
                      {u.nombre[0]}
                    </div>
                    {u.nombre}
                  </TableCell>
                  <TableCell>{getRoleBadge(u.rol)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Phone className="w-3 h-3" /> {u.telefono || 'Sin tel.'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3" /> {u.fechaIngreso}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={u.estado === 'ACTIVO' ? 'default' : 'secondary'} className={cn(u.estado === 'ACTIVO' ? "bg-green-500/20 text-green-500" : "bg-slate-500/20 text-slate-500")}>
                      {u.estado}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="w-4 h-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-card border-border">
                        <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => toggleEstado(u)}>
                          {u.estado === 'ACTIVO' ? <XCircle className="w-4 h-4 text-destructive" /> : <CheckCircle2 className="w-4 h-4 text-green-500" />}
                          {u.estado === 'ACTIVO' ? 'Inactivar' : 'Activar'}
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2 text-destructive cursor-pointer" onClick={() => handleDelete(u.id)}>
                          <Trash2 className="w-4 h-4" /> Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  );
}
