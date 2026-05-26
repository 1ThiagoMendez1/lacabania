
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
  ShieldAlert
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

const ROLES: Rol[] = ["ADMINISTRADOR", "CAJERO", "MESERO", "COCINERO", "BARTENDER"];

export default function PersonalPage() {
  const { usuarios, addUsuario, updateUsuario, deleteUsuario, permisos, togglePermiso, user } = usePOSStore();
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
            <h2 className="text-3xl font-headline text-foreground">Personal y Seguridad</h2>
          </div>
          <p className="text-muted-foreground">Administra tu equipo y sus permisos de acceso 🤠</p>
        </div>
      </header>

      <Tabs defaultValue="equipo" className="space-y-8">
        <TabsList className="bg-accent/30 border border-border p-1 h-12">
          <TabsTrigger value="equipo" className="data-[state=active]:bg-primary data-[state=active]:text-white gap-2 px-6">
            <Users className="w-4 h-4" />
            Nómina de Equipo
          </TabsTrigger>
          <TabsTrigger value="permisos" className="data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground gap-2 px-6">
            <ShieldCheck className="w-4 h-4" />
            Permisos por Rol
          </TabsTrigger>
        </TabsList>

        <TabsContent value="equipo" className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
              <div className="flex gap-4">
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input placeholder="Buscar..." className="pl-10 bg-background" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-secondary text-secondary-foreground hover:glow-gold font-bold gap-2">
                      <UserPlus className="w-5 h-5" /> Nuevo
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
        </TabsContent>

        <TabsContent value="permisos">
          {user?.rol !== 'ADMINISTRADOR' ? (
            <Alert variant="destructive" className="max-w-md mx-auto">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Acceso Denegado</AlertTitle>
              <AlertDescription>
                Solo el Administrador tiene acceso a la configuración de seguridad.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-6">
              <Card className="bg-card border-border paper-texture overflow-hidden shadow-2xl">
                <CardHeader className="border-b border-border/50 bg-accent/20">
                  <CardTitle className="text-xl font-headline flex items-center gap-2">
                    <Lock className="w-5 h-5 text-secondary" />
                    Matriz de Visibilidad por Rol
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader className="bg-accent/50">
                      <TableRow className="border-border">
                        <TableHead className="w-[250px]">Apartado del Sistema</TableHead>
                        {ROLES.map(rol => (
                          <TableHead key={rol} className="text-center">
                            <div className="flex flex-col items-center gap-1">
                              <UserCircle className="w-4 h-4 opacity-50" />
                              <span className="text-[10px] uppercase font-bold tracking-tighter">{rol}</span>
                            </div>
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ALL_MENU_ITEMS.map((item) => (
                        <TableRow key={item.label} className="border-border hover:bg-accent/20 transition-colors">
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-3">
                              <div className="p-1.5 bg-accent/50 rounded-md">
                                <item.icon className="w-4 h-4 text-primary" />
                              </div>
                              <span>{item.label}</span>
                            </div>
                          </TableCell>
                          {ROLES.map(rol => {
                            const isAllowed = permisos[rol]?.includes(item.label);
                            const isSelfAdmin = rol === 'ADMINISTRADOR' && item.label === 'Personal';
                            
                            return (
                              <TableCell key={`${rol}-${item.label}`} className="text-center">
                                <div className="flex justify-center">
                                  <Checkbox 
                                    checked={isAllowed} 
                                    onCheckedChange={() => togglePermiso(rol, item.label)}
                                    disabled={isSelfAdmin} 
                                    className={cn(
                                      "h-5 w-5",
                                      isAllowed ? "data-[state=checked]:bg-secondary border-secondary" : "border-muted-foreground/30"
                                    )}
                                  />
                                </div>
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <Alert className="bg-secondary/10 border-secondary/20">
                <ShieldAlert className="h-4 w-4 text-secondary" />
                <AlertTitle className="text-secondary">Información de Seguridad</AlertTitle>
                <AlertDescription className="text-xs text-muted-foreground">
                  Los cambios se aplican inmediatamente. Puedes usar el <strong>Simulador de Roles</strong> en la barra lateral para verificar cómo ve el sistema cada integrante según tus ajustes.
                </AlertDescription>
              </Alert>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </main>
  );
}
