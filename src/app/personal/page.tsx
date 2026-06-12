
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
  Image as ImageIcon,
  Star,
  CircleDollarSign
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
import { useState, useMemo, Fragment } from "react";
import { cn, formatCurrencyInput, parseCurrencyInput } from "@/lib/utils";
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

const ROLES: Rol[] = ["ADMINISTRADOR", "MESERO", "CAJERO"];

export default function PersonalPage() {
  const { usuarios, addUsuario, updateUsuario, deleteUsuario, permisos, togglePermiso, user, ordenes, gastos } = usePOSStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isReviewsDialogOpen, setIsReviewsDialogOpen] = useState(false);
  const [selectedMesero, setSelectedMesero] = useState<Usuario | null>(null);
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const { toast } = useToast();

  const [staffToEdit, setStaffToEdit] = useState<Partial<Usuario>>({});

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

  // Calcular ranking de meseros según calificación promedio
  const meserosRanking = useMemo(() => {
    const closedOrders = ordenes.filter(o => o.estado === 'CERRADA');
    return usuarios
      .filter(u => u.rol === 'MESERO' && u.estado === 'ACTIVO')
      .map(m => {
        const waiterOrders = closedOrders.filter(o => o.meseroId === m.id);
        const ratedOrders = waiterOrders.filter(o => o.rating && o.rating > 0);
        const avgRating = ratedOrders.length > 0 
          ? ratedOrders.reduce((sum, o) => sum + (o.rating || 0), 0) / ratedOrders.length
          : 0;
        return {
          nombre: m.nombre,
          avgRating,
          ratedCount: ratedOrders.length
        };
      })
      .filter(m => m.avgRating > 0)
      .sort((a, b) => b.avgRating - a.avgRating)
      .slice(0, 3);
  }, [usuarios, ordenes]);

  const stats = {
    total: usuarios.length,
    activos: usuarios.filter(u => u.estado === 'ACTIVO').length,
    meseros: usuarios.filter(u => u.rol === 'MESERO').length,
    caja: usuarios.filter(u => u.rol === 'CAJERO').length,
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean = false) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 600;
          const MAX_HEIGHT = 600;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          
          if (isEdit) {
            setStaffToEdit(prev => ({ ...prev, fotoDocumento: dataUrl }));
          } else {
            setNewStaff(prev => ({ ...prev, fotoDocumento: dataUrl }));
          }
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateStaff = async () => {
    if (!newStaff.nombre || !newStaff.cedula || !newStaff.rol) {
      toast({ variant: "destructive", title: "Campos Incompletos", description: "Por favor diligencia todos los campos obligatorios antes de guardar." });
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
      sueldo: newStaff.sueldo,
      estado: "ACTIVO",
      fechaIngreso: new Date().toISOString().split('T')[0],
      fotoDocumento: newStaff.fotoDocumento || undefined
    };

    try {
      await addUsuario(staff);
      setIsDialogOpen(false);
      setNewStaff({ nombre: "", cedula: "", rol: "MESERO", telefono: "", sueldo: undefined, estado: "ACTIVO", fotoDocumento: "" });
      toast({ title: "Personal Registrado", description: `${staff.nombre} ha sido agregado al equipo.` });
    } catch (error: any) {
      console.error("Error creating staff:", error);
      toast({
        variant: "destructive",
        title: "Error al Guardar",
        description: error.message || "No se pudo registrar en la base de datos. Verifica si la cédula ya existe."
      });
    }
  };

  const handleEditStaff = async () => {
    if (!staffToEdit.id || !staffToEdit.nombre || !staffToEdit.cedula || !staffToEdit.rol) {
      toast({ variant: "destructive", title: "Campos Incompletos", description: "Por favor diligencia todos los campos obligatorios antes de guardar." });
      return;
    }

    const cedula = staffToEdit.cedula;
    const pin = cedula.length >= 4 ? cedula.slice(-4) : cedula;

    try {
      await updateUsuario(staffToEdit.id, {
        nombre: staffToEdit.nombre,
        cedula: cedula,
        rol: staffToEdit.rol,
        pin: pin,
        telefono: staffToEdit.telefono,
        sueldo: staffToEdit.sueldo,
        estado: staffToEdit.estado,
        fotoDocumento: staffToEdit.fotoDocumento || undefined
      });
      setIsEditDialogOpen(false);
      toast({ title: "Personal Actualizado", description: `${staffToEdit.nombre} ha sido modificado.` });
    } catch (error: any) {
      console.error("Error editing staff:", error);
      toast({
        variant: "destructive",
        title: "Error al Actualizar",
        description: error.message || "No se pudieron guardar los cambios en la base de datos."
      });
    }
  };

  const openEditDialog = (user: Usuario) => {
    setStaffToEdit(user);
    setIsEditDialogOpen(true);
  };

  const toggleEstado = async (user: Usuario) => {
    const nuevoEstado = user.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
    try {
      await updateUsuario(user.id, { estado: nuevoEstado });
      toast({ title: "Estado Actualizado", description: `${user.nombre} ahora está ${nuevoEstado.toLowerCase()}.` });
    } catch (error: any) {
      console.error("Error toggling staff status:", error);
      toast({
        variant: "destructive",
        title: "Error al Cambiar Estado",
        description: error.message || "No se pudo actualizar el estado en la base de datos."
      });
    }
  };

  const handleDelete = (id: string) => {
    deleteUsuario(id);
    toast({ variant: "destructive", title: "Personal Eliminado", description: "El registro ha sido removido del sistema." });
  };

  const getRoleBadge = (rol: Rol) => {
    switch (rol) {
      case 'ADMINISTRADOR': return <Badge className="bg-purple-500/20 text-purple-500 border-purple-500/50">ADMIN</Badge>;
      case 'MESERO': return <Badge className="bg-green-500/20 text-green-500 border-green-500/50">MESERO</Badge>;
      case 'CAJERO': return <Badge className="bg-blue-500/20 text-blue-500 border-blue-500/50">CAJA</Badge>;
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
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
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
            <Card className="bg-card border-border shadow-md">
              <CardContent className="pt-6">
                <p className="text-xs text-muted-foreground uppercase mb-1">Meseros</p>
                <h3 className="text-2xl font-bold text-primary">{stats.meseros}</h3>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-gradient-to-br from-amber-500/10 to-yellow-600/5 border-amber-500/30 shadow-md">
            <CardContent className="pt-6">
              <p className="text-xs text-amber-500 uppercase font-black tracking-wider mb-2">🏆 TOP MESEROS</p>
              {meserosRanking.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">Sin calificaciones</p>
              ) : (
                <div className="space-y-2">
                  {meserosRanking.map((m, idx) => (
                    <div key={m.nombre} className="flex justify-between items-center text-xs">
                      <span className="font-bold truncate max-w-[120px]">
                        {idx + 1}. {m.nombre}
                      </span>
                      <span className="text-yellow-500 font-bold flex items-center gap-0.5 shrink-0">
                        ⭐ {m.avgRating.toFixed(1)} <span className="text-[9px] text-muted-foreground font-normal">({m.ratedCount})</span>
                      </span>
                    </div>
                  ))}
                </div>
              )}
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
                <DialogContent className="bg-card border-border text-foreground max-w-[95vw] md:max-w-2xl rounded-[2rem] p-4 md:p-6 max-h-[90vh] flex flex-col">
                  <DialogHeader><DialogTitle className="text-xl md:text-2xl font-headline">Nuevo Integrante</DialogTitle></DialogHeader>
                  <div className="grid gap-6 py-2 overflow-y-auto px-1 flex-1">
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
                              <SelectItem value="CAJERO">Cajero</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Teléfono / Celular</Label>
                          <Input value={newStaff.telefono || ""} onChange={(e) => setNewStaff({...newStaff, telefono: e.target.value})} placeholder="Ej: 3001234567" />
                        </div>
                        <div className="space-y-2">
                          <Label>Sueldo Mensual</Label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                            <Input 
                              className="pl-7 bg-background"
                              value={formatCurrencyInput(newStaff.sueldo)} 
                              onChange={(e) => setNewStaff({...newStaff, sueldo: parseCurrencyInput(e.target.value) || undefined})} 
                              placeholder="Ej: 1.300.000" 
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <Label>Documento de Identidad (Foto)</Label>
                        <label className="border-2 border-dashed border-border rounded-xl p-4 flex flex-col items-center justify-center gap-4 bg-accent/10 min-h-[200px] relative overflow-hidden group cursor-pointer hover:bg-accent/20 transition-colors block w-full">
                          {newStaff.fotoDocumento ? (
                            <>
                              <img src={newStaff.fotoDocumento} alt="Documento" className="absolute inset-0 w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                <span className="bg-background text-foreground border border-input px-3 py-1 rounded-md text-sm shadow-sm font-medium">Cambiar</span>
                              </div>
                            </>
                          ) : (
                            <>
                              <FileImage className="w-12 h-12 text-muted-foreground opacity-30" />
                              <span className="text-sm text-muted-foreground font-medium">Toca para subir foto</span>
                            </>
                          )}
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, false)} />
                        </label>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="ghost" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                    <Button className="bg-primary font-bold" onClick={handleCreateStaff}>AGREGAR</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="bg-card border-border text-foreground max-w-[95vw] md:max-w-2xl rounded-[2rem] p-4 md:p-6 max-h-[90vh] flex flex-col">
                  <DialogHeader><DialogTitle className="text-xl md:text-2xl font-headline">Editar Integrante</DialogTitle></DialogHeader>
                  <div className="grid gap-6 py-2 overflow-y-auto px-1 flex-1">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Nombre Completo</Label>
                          <Input value={staffToEdit.nombre || ""} onChange={(e) => setStaffToEdit({...staffToEdit, nombre: e.target.value})} placeholder="Ej: Pedro Pérez" />
                        </div>
                        <div className="space-y-2">
                          <Label>Cédula</Label>
                          <Input value={staffToEdit.cedula || ""} onChange={(e) => setStaffToEdit({...staffToEdit, cedula: e.target.value})} placeholder="Número de documento" />
                        </div>
                        <div className="space-y-2">
                          <Label>Cargo</Label>
                          <Select onValueChange={(val) => setStaffToEdit({...staffToEdit, rol: val as Rol})} value={staffToEdit.rol}>
                            <SelectTrigger><SelectValue placeholder="Selecciona Rol" /></SelectTrigger>
                            <SelectContent className="bg-card border-border">
                              <SelectItem value="ADMINISTRADOR">Administrador</SelectItem>
                              <SelectItem value="MESERO">Mesero</SelectItem>
                              <SelectItem value="CAJERO">Cajero</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Teléfono / Celular</Label>
                          <Input value={staffToEdit.telefono || ""} onChange={(e) => setStaffToEdit({...staffToEdit, telefono: e.target.value})} placeholder="Ej: 3001234567" />
                        </div>
                        <div className="space-y-2">
                          <Label>Sueldo Mensual</Label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                            <Input 
                              className="pl-7 bg-background"
                              value={formatCurrencyInput(staffToEdit.sueldo)} 
                              onChange={(e) => setStaffToEdit({...staffToEdit, sueldo: parseCurrencyInput(e.target.value) || undefined})} 
                              placeholder="Ej: 1.300.000" 
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <Label>Documento de Identidad (Foto)</Label>
                        <label className="border-2 border-dashed border-border rounded-xl p-4 flex flex-col items-center justify-center gap-4 bg-accent/10 min-h-[200px] relative overflow-hidden group cursor-pointer hover:bg-accent/20 transition-colors block w-full">
                          {staffToEdit.fotoDocumento ? (
                            <>
                              <img src={staffToEdit.fotoDocumento} alt="Documento" className="absolute inset-0 w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                <span className="bg-background text-foreground border border-input px-3 py-1 rounded-md text-sm shadow-sm font-medium">Cambiar</span>
                              </div>
                            </>
                          ) : (
                            <>
                              <FileImage className="w-12 h-12 text-muted-foreground opacity-30" />
                              <span className="text-sm text-muted-foreground font-medium">Toca para subir foto</span>
                            </>
                          )}
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, true)} />
                        </label>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="ghost" onClick={() => setIsEditDialogOpen(false)}>Cancelar</Button>
                    <Button className="bg-primary font-bold" onClick={handleEditStaff}>GUARDAR CAMBIOS</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Diálogo de Reseñas */}
              <Dialog open={isReviewsDialogOpen} onOpenChange={setIsReviewsDialogOpen}>
                <DialogContent className="bg-card border-border text-foreground max-w-[95vw] md:max-w-2xl rounded-[2rem] p-4 md:p-6 max-h-[90vh] flex flex-col">
                  <DialogHeader>
                    <DialogTitle className="text-xl md:text-2xl font-headline flex items-center gap-2">
                      <Star className="w-6 h-6 text-yellow-500" />
                      Reseñas: {selectedMesero?.nombre}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-2 overflow-y-auto px-1 flex-1">
                    {(() => {
                      if (!selectedMesero) return null;
                      const closedOrders = ordenes.filter(o => o.estado === 'CERRADA' && o.meseroId === selectedMesero.id);
                      const ratedOrders = closedOrders.filter(o => o.rating && o.rating > 0).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                      if (ratedOrders.length === 0) return <p className="text-sm text-muted-foreground italic text-center py-8">No hay reseñas todavía.</p>;
                      return ratedOrders.map(o => (
                        <div key={o.id} className="border border-border/50 bg-accent/20 rounded-xl p-4 space-y-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="text-yellow-500 font-bold tracking-widest text-lg">
                                {"⭐".repeat(o.rating || 0)}
                              </span>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {new Date(o.createdAt).toLocaleDateString()} {new Date(o.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </span>
                          </div>
                          {o.ratingObservacion ? (
                            <p className="text-sm italic text-foreground border-l-2 border-yellow-500/50 pl-3 py-1 bg-background/50 rounded-r-md">
                              "{o.ratingObservacion}"
                            </p>
                          ) : (
                            <p className="text-xs text-muted-foreground italic">Sin comentario.</p>
                          )}
                        </div>
                      ));
                    })()}
                  </div>
                  <DialogFooter>
                    <Button variant="ghost" onClick={() => setIsReviewsDialogOpen(false)}>Cerrar</Button>
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
                {filteredStaff.map((u) => {
                  const diasTrabajados = [...new Set(ordenes.filter(o => o.meseroId === u.id).map(o => o.createdAt.split('T')[0]))].sort((a,b) => b.localeCompare(a));
                  const pagos = gastos.filter(g => g.categoria === 'Nómina' && g.descripcion.includes(u.nombre)).sort((a,b) => b.fecha.localeCompare(a.fecha));
                  const isExpanded = expandedUserId === u.id;

                  return (
                  <Fragment key={u.id}>
                  <TableRow className={cn("border-border cursor-pointer hover:bg-accent/10 transition-colors", u.estado === 'INACTIVO' && "opacity-60", isExpanded && "bg-accent/10")} onClick={() => setExpandedUserId(isExpanded ? null : u.id)}>
                    <TableCell className="font-bold flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">
                        {u.nombre[0]}
                      </div>
                      {u.nombre}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-xs font-mono">
                        <IdCard className="w-3 h-3 text-muted-foreground" /> {u.cedula}
                        {u.fotoDocumento && (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-6 w-6 ml-2 hover:text-primary" title="Ver Documento">
                                <ImageIcon className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-md bg-card border-border text-foreground">
                              <DialogHeader><DialogTitle className="font-headline">Documento: {u.nombre}</DialogTitle></DialogHeader>
                              <div className="mt-4 rounded-xl overflow-hidden border border-border">
                                <img src={u.fotoDocumento} alt={`Documento de ${u.nombre}`} className="w-full h-auto object-contain max-h-[70vh]" />
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getRoleBadge(u.rol)}
                        {u.rol === 'MESERO' && (() => {
                          const closedOrders = ordenes.filter(o => o.estado === 'CERRADA' && o.meseroId === u.id);
                          const ratedOrders = closedOrders.filter(o => o.rating && o.rating > 0);
                          const avgRating = ratedOrders.length > 0 
                            ? ratedOrders.reduce((sum, o) => sum + (o.rating || 0), 0) / ratedOrders.length
                            : 0;
                          return avgRating > 0 ? (
                            <span className="text-yellow-500 text-xs font-bold flex items-center gap-0.5" title={`${ratedOrders.length} calificaciones`}>
                              ⭐ {avgRating.toFixed(1)}
                            </span>
                          ) : null;
                        })()}
                      </div>
                    </TableCell>

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
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon"><MoreVertical className="w-4 h-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-card border-border">
                          <DropdownMenuItem className="cursor-pointer" onClick={() => { setTimeout(() => openEditDialog(u), 150); }}>
                            Editar
                          </DropdownMenuItem>
                          {u.rol === 'MESERO' && (
                            <DropdownMenuItem className="cursor-pointer text-yellow-600 font-bold" onClick={() => { 
                              setSelectedMesero(u); 
                              setTimeout(() => setIsReviewsDialogOpen(true), 150); 
                            }}>
                              Ver Reseñas
                            </DropdownMenuItem>
                          )}
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
                  {isExpanded && (
                    <TableRow className="bg-accent/5 border-border hover:bg-accent/5">
                      <TableCell colSpan={6} className="p-0 border-b border-border/50">
                        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                          <div className="space-y-2 bg-card p-4 rounded-xl border border-border/50 shadow-inner">
                            <h5 className="text-xs font-black uppercase text-primary mb-2 flex items-center gap-2"><Calendar className="w-4 h-4"/> Días Trabajados (Turnos)</h5>
                            {diasTrabajados.length > 0 ? (
                              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto pr-1">
                                {diasTrabajados.map(d => <Badge key={d} variant="outline" className="text-[10px] bg-background border-primary/20">{d}</Badge>)}
                              </div>
                            ) : (
                              <p className="text-xs text-muted-foreground italic">No hay registro de turnos u órdenes.</p>
                            )}
                          </div>
                          <div className="space-y-2 bg-card p-4 rounded-xl border border-border/50 shadow-inner">
                            <h5 className="text-xs font-black uppercase text-green-500 mb-2 flex items-center gap-2"><CircleDollarSign className="w-4 h-4"/> Pagos y Adelantos</h5>
                            {pagos.length > 0 ? (
                              <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
                                {pagos.map(p => (
                                  <div key={p.id} className="flex justify-between items-center text-xs bg-background p-2 rounded-lg border border-border/50">
                                    <span>{p.fecha.split('T')[0]}</span>
                                    <span className="font-bold text-green-500">${p.valor.toLocaleString('es-CO')}</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs text-muted-foreground italic">No hay pagos registrados.</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                  </Fragment>
                )})}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
