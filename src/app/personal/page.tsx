
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
  Trash2,
  CheckCircle2,
  XCircle,
  Lock,
  UserCircle,
  AlertCircle,
  ShieldAlert,
  IdCard,
  FileImage,
  Image as ImageIcon
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ALL_MENU_ITEMS } from "@/components/layout/AppSidebar";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const ROLES: Rol[] = ["ADMINISTRADOR", "MESERO", "COCINERO"];

export default function PersonalPage() {
  const { usuarios, addUsuario, updateUsuario, deleteUsuario, permisos, togglePermiso, user } = usePOSStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const [newStaff, setNewStaff] = useState<Partial<Usuario>>({
    nombre: "",
    cedula: "",
    rol: "MESERO",
    telefono: "",
    estado: "ACTIVO",
    fotoDocumento: ""
  });

  const filteredStaff = usuarios.filter(u => 
    u.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.rol.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.cedula.includes(searchTerm)
  );

  const stats = {
    total: usuarios.length,
    activos: usuarios.filter(u => u.estado === 'ACTIVO').length,
    meseros: usuarios.filter(u => u.rol === 'MESERO').length,
    cocina: usuarios.filter(u => u.rol === 'COCINERO').length,
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewStaff({ ...newStaff, fotoDocumento: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateStaff = () => {
    if (!newStaff.nombre || !newStaff.cedula) {
      toast({ variant: "destructive", title: "Datos Incompletos", description: "El nombre y la cédula son obligatorios." });
      return;
    }

    const cedula = newStaff.cedula!;
    const pin = cedula.length >= 4 ? cedula.slice(-4) : cedula;

    const staff: Usuario = {
      id: `u-${Date.now()}`,
      nombre: newStaff.nombre!,
      cedula: cedula,
      rol: (newStaff.rol as Rol) || "MESERO",
      pin: pin,
      telefono: newStaff.telefono || "",
      estado: "ACTIVO",
      fechaIngreso: new Date().toISOString().split('T')[0],
      fotoDocumento: newStaff.fotoDocumento
    };
    addUsuario(staff);
    setIsDialogOpen(false);
    setNewStaff({ nombre: "", cedula: "", rol: "MESERO", telefono: "", estado: "ACTIVO", fotoDocumento: "" });
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
      case 'MESERO': return <Badge className="bg-green-500/20 text-green-500 border-green-500/50">MESERO</Badge>;
      case 'COCINERO': return <Badge className="bg-orange-500/20 text-orange-500 border-orange-500/50">COCINA</Badge>;
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
            <h2 className="text-3xl font-headline text-foreground">Personal y Seguridad</h2>
          </div>
          <p className="text-muted-foreground">Administra tu equipo 🤠</p>
        </div>
      </header>

      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-card border-border shadow-md">
            <CardContent className="pt-6">
              <p className="text-xs text-muted-foreground uppercase mb-1">Total Equipo</p>
              <h3 className="text-2xl font-bold">{stats.total}</h3>
            </CardContent>
          </Card>
          <Card className="bg-card border-border shadow-md">
            <CardContent className="pt-6">
              <p className="text-xs text-muted-foreground uppercase mb-1">Activos</p>
              <h3 className="text-2xl font-bold text-green-500">{stats.activos}</h3>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-card border-border paper-texture overflow-hidden shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between border-b border-border/50">
            <CardTitle className="text-xl font-headline">Nómina Activa</CardTitle>
            <div className="flex gap-4">
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Buscar..." className="pl-10 bg-background" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-secondary text-secondary-foreground font-bold gap-2">
                    <UserPlus className="w-5 h-5" /> Nuevo
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-card border-border text-foreground max-w-2xl">
                  <DialogHeader><DialogTitle className="text-2xl font-headline">Nuevo Integrante</DialogTitle></DialogHeader>
                  <div className="grid gap-6 py-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Nombre Completo</Label>
                          <Input value={newStaff.nombre} onChange={(e) => setNewStaff({...newStaff, nombre: e.target.value})} placeholder="Ej: Pedro Pérez" />
                        </div>
                        <div className="space-y-2">
                          <Label>Cédula</Label>
                          <Input value={newStaff.cedula} onChange={(e) => setNewStaff({...newStaff, cedula: e.target.value})} placeholder="Número de documento" />
                        </div>
                        <div className="space-y-2">
                          <Label>Cargo</Label>
                          <Select onValueChange={(val) => setNewStaff({...newStaff, rol: val as Rol})} defaultValue="MESERO">
                            <SelectTrigger><SelectValue placeholder="Selecciona Rol" /></SelectTrigger>
                            <SelectContent className="bg-card border-border">
                              <SelectItem value="ADMINISTRADOR">Administrador</SelectItem>
                              <SelectItem value="MESERO">Mesero</SelectItem>
                              <SelectItem value="COCINERO">Cocinero</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <Label>Documento de Identidad (Foto)</Label>
                        <div className="border-2 border-dashed border-border rounded-xl p-4 flex flex-col items-center justify-center gap-4 bg-accent/10 min-h-[200px] relative overflow-hidden group">
                          {newStaff.fotoDocumento ? (
                            <>
                              <img src={newStaff.fotoDocumento} alt="Documento" className="absolute inset-0 w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                <Button variant="outline" size="sm" className="bg-background" onClick={() => setNewStaff({...newStaff, fotoDocumento: ""})}>Cambiar</Button>
                              </div>
                            </>
                          ) : (
                            <>
                              <FileImage className="w-12 h-12 text-muted-foreground opacity-30" />
                              <Input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleFileChange} />
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="ghost" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                    <Button className="bg-primary font-bold" onClick={handleCreateStaff}>AGREGAR</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-accent/50">
                <TableRow className="border-border">
                  <TableHead>Integrante</TableHead>
                  <TableHead>Documento</TableHead>
                  <TableHead>Cargo</TableHead>
                  <TableHead>Ingreso</TableHead>
                  <TableHead className="text-center">Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStaff.map((u) => (
                  <TableRow key={u.id} className={cn("border-border", u.estado === 'INACTIVO' && "opacity-60")}>
                    <TableCell className="font-bold flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">
                        {u.nombre[0]}
                      </div>
                      {u.nombre}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-xs font-mono">
                        <IdCard className="w-3 h-3 text-muted-foreground" /> {u.cedula}
                      </div>
                    </TableCell>
                    <TableCell>{getRoleBadge(u.rol)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3" /> {u.fechaIngreso}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={u.estado === 'ACTIVO' ? 'default' : 'secondary'}>
                        {u.estado}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon"><MoreVertical className="w-4 h-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-card border-border">
                          <DropdownMenuItem className="cursor-pointer" onClick={() => toggleEstado(u)}>
                            {u.estado === 'ACTIVO' ? 'Inactivar' : 'Activar'}
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive cursor-pointer" onClick={() => handleDelete(u.id)}>
                            Eliminar
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
      </div>
    </main>
  );
}
