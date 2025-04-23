import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { DatabaseConfig } from "@shared/schema";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Loader2, Database, Trash2, Edit, Check, X, Plus, RefreshCw, ArrowRightLeft } from "lucide-react";

// Schema per la validazione del form di aggiunta/modifica database
const databaseFormSchema = z.object({
  name: z.string().min(1, "Il nome è obbligatorio"),
  connection_string: z.string().min(1, "La stringa di connessione è obbligatoria"),
  description: z.string().optional(),
  is_active: z.boolean().default(false),
});

type DatabaseFormValues = z.infer<typeof databaseFormSchema>;

// Schema per la validazione della migrazione
const migrationFormSchema = z.object({
  sourceId: z.number().int().positive(),
  targetId: z.number().int().positive(),
  migrateAll: z.boolean().default(true),
  migrateContent: z.boolean().optional(),
  migrateSettings: z.boolean().optional(),
  migrateHashes: z.boolean().optional(),
  migrateSeoRules: z.boolean().optional(),
});

type MigrationFormValues = z.infer<typeof migrationFormSchema>;

export function DatabaseManager() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isMigrateDialogOpen, setIsMigrateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState<DatabaseConfig | null>(null);
  const [migrationInProgress, setMigrationInProgress] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Form per aggiunta/modifica database
  const form = useForm<DatabaseFormValues>({
    resolver: zodResolver(databaseFormSchema),
    defaultValues: {
      name: "",
      connection_string: "",
      description: "",
      is_active: false,
    },
  });

  // Form per la migrazione
  const migrationForm = useForm<MigrationFormValues>({
    resolver: zodResolver(migrationFormSchema),
    defaultValues: {
      sourceId: 0,
      targetId: 0,
      migrateAll: true,
      migrateContent: true,
      migrateSettings: true,
      migrateHashes: true,
      migrateSeoRules: true,
    },
  });

  // Recupero configurazioni database
  const { 
    data: configs, 
    isLoading: isLoadingConfigs,
    refetch: refetchConfigs
  } = useQuery({
    queryKey: ["/api/database/configs"],
    select: (data: any) => data as DatabaseConfig[],
  });

  // Recupero configurazione attiva
  const { 
    data: activeConfig,
    isLoading: isLoadingActiveConfig,
    refetch: refetchActiveConfig
  } = useQuery({
    queryKey: ["/api/database/active"],
    select: (data: any) => data as DatabaseConfig,
  });

  // Mutazione per aggiungere un database
  const addDatabaseMutation = useMutation({
    mutationFn: (config: DatabaseFormValues) => {
      return apiRequest("POST", "/api/database/configs", config);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/database/configs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/database/active"] });
      toast({
        title: "Database aggiunto",
        description: "La configurazione del database è stata salvata con successo",
      });
      setIsAddDialogOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Errore",
        description: "Non è stato possibile aggiungere il database",
        variant: "destructive",
      });
    },
  });

  // Mutazione per modificare un database
  const updateDatabaseMutation = useMutation({
    mutationFn: (data: { id: number; config: Partial<DatabaseFormValues> }) => {
      return apiRequest("PATCH", `/api/database/configs/${data.id}`, data.config);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/database/configs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/database/active"] });
      toast({
        title: "Database aggiornato",
        description: "La configurazione del database è stata aggiornata con successo",
      });
      setIsEditDialogOpen(false);
      setSelectedConfig(null);
    },
    onError: (error) => {
      toast({
        title: "Errore",
        description: "Non è stato possibile aggiornare il database",
        variant: "destructive",
      });
    },
  });

  // Mutazione per eliminare un database
  const deleteDatabaseMutation = useMutation({
    mutationFn: (id: number) => {
      return apiRequest("DELETE", `/api/database/configs/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/database/configs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/database/active"] });
      toast({
        title: "Database eliminato",
        description: "La configurazione del database è stata eliminata con successo",
      });
      setIsDeleteDialogOpen(false);
      setSelectedConfig(null);
    },
    onError: (error) => {
      toast({
        title: "Errore",
        description: "Non è stato possibile eliminare il database",
        variant: "destructive",
      });
    },
  });

  // Mutazione per impostare un database come attivo
  const setActiveDatabaseMutation = useMutation({
    mutationFn: (id: number) => {
      return apiRequest("POST", `/api/database/configs/${id}/activate`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/database/configs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/database/active"] });
      toast({
        title: "Database attivato",
        description: "Il database è stato impostato come attivo con successo",
      });
    },
    onError: (error) => {
      toast({
        title: "Errore",
        description: "Non è stato possibile attivare il database",
        variant: "destructive",
      });
    },
  });

  // Mutazione per la migrazione dei dati
  const migrateDatabaseMutation = useMutation({
    mutationFn: (data: MigrationFormValues) => {
      return apiRequest("POST", "/api/database/migrate", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/database/configs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/content"] });
      setMigrationInProgress(false);
      setIsMigrateDialogOpen(false);
      toast({
        title: "Migrazione completata",
        description: "I dati sono stati migrati con successo",
      });
      migrationForm.reset();
    },
    onError: (error) => {
      setMigrationInProgress(false);
      toast({
        title: "Errore di migrazione",
        description: "Non è stato possibile migrare i dati. Controlla i log per maggiori dettagli.",
        variant: "destructive",
      });
    },
  });

  // Gestisce il submit del form di aggiunta database
  const onAddSubmit = (values: DatabaseFormValues) => {
    addDatabaseMutation.mutate(values);
  };

  // Gestisce il submit del form di modifica database
  const onEditSubmit = (values: DatabaseFormValues) => {
    if (!selectedConfig) return;
    updateDatabaseMutation.mutate({
      id: selectedConfig.id,
      config: values,
    });
  };

  // Gestisce il submit del form di migrazione
  const onMigrateSubmit = (values: MigrationFormValues) => {
    setMigrationInProgress(true);
    migrateDatabaseMutation.mutate(values);
  };

  // Gestisce l'apertura del dialog di modifica
  const handleEditClick = (config: DatabaseConfig) => {
    setSelectedConfig(config);
    form.reset({
      name: config.name,
      connection_string: config.connection_string,
      description: config.description || "",
      is_active: config.is_active,
    });
    setIsEditDialogOpen(true);
  };

  // Gestisce l'apertura del dialog di eliminazione
  const handleDeleteClick = (config: DatabaseConfig) => {
    setSelectedConfig(config);
    setIsDeleteDialogOpen(true);
  };

  // Gestisce l'attivazione di un database
  const handleActivateClick = (config: DatabaseConfig) => {
    setActiveDatabaseMutation.mutate(config.id);
  };

  // Gestisce l'apertura del dialog di migrazione
  const handleMigrateClick = () => {
    if (!configs || configs.length < 2) {
      toast({
        title: "Impossibile migrare",
        description: "Sono necessari almeno due database configurati per eseguire una migrazione",
        variant: "destructive",
      });
      return;
    }

    // Reset del form di migrazione
    migrationForm.reset({
      sourceId: configs[0].id,
      targetId: configs.length > 1 ? configs[1].id : configs[0].id,
      migrateAll: true,
      migrateContent: true,
      migrateSettings: true,
      migrateHashes: true,
      migrateSeoRules: true,
    });

    setIsMigrateDialogOpen(true);
  };

  // Osserva i cambiamenti nel checkbox di migrazione completa
  useEffect(() => {
    const subscription = migrationForm.watch((value, { name }) => {
      if (name === "migrateAll") {
        const migrateAll = value.migrateAll as boolean;
        if (migrateAll) {
          migrationForm.setValue("migrateContent", true);
          migrationForm.setValue("migrateSettings", true);
          migrationForm.setValue("migrateHashes", true);
          migrationForm.setValue("migrateSeoRules", true);
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [migrationForm]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Gestione Database</h2>
          <p className="text-sm text-muted-foreground">
            Gestisci le connessioni ai database e migra i dati tra diverse istanze
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleMigrateClick}>
            <ArrowRightLeft className="h-4 w-4 mr-2" />
            Migra Dati
          </Button>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Aggiungi Database
          </Button>
        </div>
      </div>

      {/* Database attivo */}
      <Card>
        <CardHeader>
          <CardTitle>Database Attivo</CardTitle>
          <CardDescription>
            Il database attualmente utilizzato dall'applicazione
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingActiveConfig ? (
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ) : activeConfig ? (
            <div className="space-y-2">
              <div className="flex items-center">
                <h3 className="text-lg font-medium">{activeConfig.name}</h3>
                <Badge className="ml-2 bg-green-500">Attivo</Badge>
              </div>
              <p className="text-sm text-slate-600">{activeConfig.description}</p>
              <div className="text-xs text-slate-500 font-mono bg-slate-50 p-2 rounded border">
                {activeConfig.connection_string.replace(/[:@/]/g, match => match === ':' ? ':#' : match === '@' ? '@#' : match === '/' ? '/#' : match)}
              </div>
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded p-4">
              <p className="text-amber-800">
                Nessun database attivo configurato. Configura un database per utilizzare l'applicazione.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Elenco configurazioni */}
      <Card>
        <CardHeader>
          <CardTitle>Configurazioni Database</CardTitle>
          <CardDescription>
            Tutte le configurazioni database salvate
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingConfigs ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="border rounded-md p-4 space-y-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-full" />
                  <div className="flex justify-end gap-2">
                    <Skeleton className="h-8 w-20" />
                    <Skeleton className="h-8 w-20" />
                  </div>
                </div>
              ))}
            </div>
          ) : !configs || configs.length === 0 ? (
            <div className="border border-dashed rounded-md p-8 text-center">
              <Database className="mx-auto h-8 w-8 text-slate-400 mb-2" />
              <p className="text-slate-600">Nessuna configurazione database trovata</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => setIsAddDialogOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Aggiungi Primo Database
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {configs.map((config) => (
                <Card key={config.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Database className="h-4 w-4 text-slate-500" />
                        <h3 className="font-medium">{config.name}</h3>
                        {config.is_active && (
                          <Badge className="bg-green-500">Attivo</Badge>
                        )}
                      </div>
                      <div className="flex gap-1">
                        {!config.is_active && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleActivateClick(config)}
                            disabled={setActiveDatabaseMutation.isPending}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Attiva
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditClick(config)}
                          disabled={updateDatabaseMutation.isPending}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-500 hover:text-red-700"
                          onClick={() => handleDeleteClick(config)}
                          disabled={deleteDatabaseMutation.isPending || config.is_active}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    {config.description && (
                      <p className="text-sm text-slate-600 mb-2">{config.description}</p>
                    )}
                    <div className="text-xs text-slate-500 font-mono bg-slate-50 p-2 rounded border truncate">
                      {config.connection_string.replace(/[:@/]/g, match => match === ':' ? ':#' : match === '@' ? '@#' : match === '/' ? '/#' : match)}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog Aggiungi Database */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Aggiungi Database</DialogTitle>
            <DialogDescription>
              Aggiungi una nuova configurazione di database
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onAddSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input placeholder="Produzione" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="connection_string"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stringa di connessione</FormLabel>
                    <FormControl>
                      <Input placeholder="postgresql://user:password@host:port/database" {...field} />
                    </FormControl>
                    <FormDescription>
                      La stringa di connessione al database PostgreSQL
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrizione (opzionale)</FormLabel>
                    <FormControl>
                      <Input placeholder="Database di produzione principale" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between border p-4 rounded-md">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Attiva</FormLabel>
                      <FormDescription>
                        Imposta questo database come attivo per l'applicazione
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Annulla
                </Button>
                <Button type="submit" disabled={addDatabaseMutation.isPending}>
                  {addDatabaseMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvataggio...
                    </>
                  ) : (
                    <>Salva</>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Dialog Modifica Database */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Modifica Database</DialogTitle>
            <DialogDescription>
              Modifica la configurazione del database esistente
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onEditSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="connection_string"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stringa di connessione</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormDescription>
                      La stringa di connessione al database PostgreSQL
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrizione (opzionale)</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between border p-4 rounded-md">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Attiva</FormLabel>
                      <FormDescription>
                        Imposta questo database come attivo per l'applicazione
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Annulla
                </Button>
                <Button type="submit" disabled={updateDatabaseMutation.isPending}>
                  {updateDatabaseMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Aggiornamento...
                    </>
                  ) : (
                    <>Aggiorna</>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Dialog Elimina Database */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sei sicuro di voler eliminare questo database?</AlertDialogTitle>
            <AlertDialogDescription>
              Questa azione non può essere annullata. Verranno rimosse tutte le informazioni
              di configurazione del database "{selectedConfig?.name}".
              <br /><br />
              <span className="font-medium text-red-600">
                Nota: I dati all'interno del database non verranno eliminati, 
                ma non saranno più accessibili dall'applicazione.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => selectedConfig && deleteDatabaseMutation.mutate(selectedConfig.id)}
              disabled={deleteDatabaseMutation.isPending}
            >
              {deleteDatabaseMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Eliminazione...
                </>
              ) : (
                <>Elimina</>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog Migrazione Database */}
      <Dialog open={isMigrateDialogOpen} onOpenChange={setIsMigrateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Migrazione Dati</DialogTitle>
            <DialogDescription>
              Migra i dati da un database all'altro
            </DialogDescription>
          </DialogHeader>
          <Form {...migrationForm}>
            <form onSubmit={migrationForm.handleSubmit(onMigrateSubmit)} className="space-y-4">
              <FormField
                control={migrationForm.control}
                name="sourceId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Database di origine</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      defaultValue={field.value.toString()}
                      disabled={migrationInProgress}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleziona il database di origine" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {configs && configs.map((config) => (
                          <SelectItem 
                            key={config.id} 
                            value={config.id.toString()}
                          >
                            {config.name} {config.is_active && "(Attivo)"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      I dati verranno estratti da questo database
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={migrationForm.control}
                name="targetId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Database di destinazione</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      defaultValue={field.value.toString()}
                      disabled={migrationInProgress}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleziona il database di destinazione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {configs && configs.map((config) => (
                          <SelectItem 
                            key={config.id} 
                            value={config.id.toString()}
                          >
                            {config.name} {config.is_active && "(Attivo)"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      I dati verranno importati in questo database
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="border rounded-md p-4 space-y-3">
                <h4 className="font-medium">Dati da migrare</h4>
                <FormField
                  control={migrationForm.control}
                  name="migrateAll"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={migrationInProgress}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          Migra tutti i dati
                        </FormLabel>
                        <FormDescription>
                          Trasferisci tutti i tipi di dati dal database di origine a quello di destinazione
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                {!migrationForm.watch("migrateAll") && (
                  <div className="pl-8 space-y-3 border-l-2 border-slate-100">
                    <FormField
                      control={migrationForm.control}
                      name="migrateContent"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              disabled={migrationInProgress}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>
                              Contenuti
                            </FormLabel>
                            <FormDescription>
                              Articoli, post e altri contenuti generati
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={migrationForm.control}
                      name="migrateSettings"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              disabled={migrationInProgress}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>
                              Impostazioni
                            </FormLabel>
                            <FormDescription>
                              Impostazioni API e preferenze di contenuto
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={migrationForm.control}
                      name="migrateHashes"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              disabled={migrationInProgress}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>
                              Hash di contenuto
                            </FormLabel>
                            <FormDescription>
                              Identificatori unici per prevenire duplicati
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={migrationForm.control}
                      name="migrateSeoRules"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              disabled={migrationInProgress}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>
                              Regole SEO
                            </FormLabel>
                            <FormDescription>
                              Regole di ottimizzazione per i vari canali
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsMigrateDialogOpen(false)} disabled={migrationInProgress}>
                  Annulla
                </Button>
                <Button 
                  type="submit" 
                  disabled={migrationInProgress || migrationForm.watch("sourceId") === migrationForm.watch("targetId")}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {migrationInProgress ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Migrazione in corso...
                    </>
                  ) : (
                    <>
                      <ArrowRightLeft className="mr-2 h-4 w-4" />
                      Avvia Migrazione
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}