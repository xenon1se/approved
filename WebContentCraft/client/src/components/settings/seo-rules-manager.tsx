import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { SeoRule } from "@shared/schema";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

import {
  Card,
  CardContent,
  CardDescription,
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
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, Trash2, Edit, RefreshCw, Search, Sparkles, Check } from "lucide-react";

// Schema per la validazione del form di aggiunta/modifica regola SEO
const seoRuleFormSchema = z.object({
  platform: z.string().min(1, "La piattaforma è obbligatoria"),
  ruleName: z.string().min(1, "Il nome della regola è obbligatorio"),
  ruleContent: z.string().min(1, "Il contenuto della regola è obbligatorio"),
  category: z.string().optional(),
  isActive: z.boolean().default(true),
  importance: z.string().optional(),
  source: z.string().optional(),
});

type SeoRuleFormValues = z.infer<typeof seoRuleFormSchema>;

// Schema per la ricerca automatica di regole SEO
const seoResearchFormSchema = z.object({
  platform: z.string().min(1, "La piattaforma è obbligatoria"),
  targetCount: z.number().int().min(1).max(10).default(3),
  searchType: z.enum(["latest", "specific"]),
  specificTopic: z.string().optional(),
});

type SeoResearchFormValues = z.infer<typeof seoResearchFormSchema>;

export function SeoRulesManager() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isResearchDialogOpen, setIsResearchDialogOpen] = useState(false);
  const [selectedRule, setSelectedRule] = useState<SeoRule | null>(null);
  const [activePlatformTab, setActivePlatformTab] = useState("wordpress");
  const [researchInProgress, setResearchInProgress] = useState(false);
  const [researchResults, setResearchResults] = useState<string[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Form per aggiunta/modifica regola SEO
  const form = useForm<SeoRuleFormValues>({
    resolver: zodResolver(seoRuleFormSchema),
    defaultValues: {
      platform: "wordpress",
      ruleName: "Title SEO rule",
      ruleContent: "",
      category: "title",
      isActive: true,
      importance: "medium",
      source: "",
    },
  });

  // Form per la ricerca automatica di regole SEO
  const researchForm = useForm<SeoResearchFormValues>({
    resolver: zodResolver(seoResearchFormSchema),
    defaultValues: {
      platform: "wordpress",
      targetCount: 3,
      searchType: "latest",
      specificTopic: "",
    },
  });

  // Recupero regole SEO per WordPress
  const { 
    data: wordpressRules, 
    isLoading: isLoadingWordpressRules,
    refetch: refetchWordpressRules
  } = useQuery({
    queryKey: ["/api/seo/rules", "wordpress"],
    select: (data: any) => data as SeoRule[],
  });

  // Recupero regole SEO per Instagram
  const { 
    data: instagramRules, 
    isLoading: isLoadingInstagramRules,
    refetch: refetchInstagramRules
  } = useQuery({
    queryKey: ["/api/seo/rules", "instagram"],
    select: (data: any) => data as SeoRule[],
  });

  // Recupero regole SEO per LinkedIn
  const { 
    data: linkedinRules, 
    isLoading: isLoadingLinkedinRules,
    refetch: refetchLinkedinRules
  } = useQuery({
    queryKey: ["/api/seo/rules", "linkedin"],
    select: (data: any) => data as SeoRule[],
  });

  // Recupero regole SEO per Facebook
  const { 
    data: facebookRules, 
    isLoading: isLoadingFacebookRules,
    refetch: refetchFacebookRules
  } = useQuery({
    queryKey: ["/api/seo/rules", "facebook"],
    select: (data: any) => data as SeoRule[],
  });

  // Mutazione per aggiungere una regola SEO
  const addSeoRuleMutation = useMutation({
    mutationFn: (rule: SeoRuleFormValues) => {
      return apiRequest("POST", "/api/seo/rules", {
        ...rule,
        lastUpdated: new Date(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/seo/rules"] });
      toast({
        title: "Regola SEO aggiunta",
        description: "La regola SEO è stata salvata con successo",
      });
      setIsAddDialogOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Errore",
        description: "Non è stato possibile aggiungere la regola SEO",
        variant: "destructive",
      });
    },
  });

  // Mutazione per modificare una regola SEO
  const updateSeoRuleMutation = useMutation({
    mutationFn: (data: { id: number; rule: Partial<SeoRuleFormValues> }) => {
      return apiRequest("PATCH", `/api/seo/rules/${data.id}`, {
        ...data.rule,
        last_updated: new Date(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/seo/rules"] });
      toast({
        title: "Regola SEO aggiornata",
        description: "La regola SEO è stata aggiornata con successo",
      });
      setIsEditDialogOpen(false);
      setSelectedRule(null);
    },
    onError: (error) => {
      toast({
        title: "Errore",
        description: "Non è stato possibile aggiornare la regola SEO",
        variant: "destructive",
      });
    },
  });

  // Mutazione per eliminare una regola SEO
  const deleteSeoRuleMutation = useMutation({
    mutationFn: (id: number) => {
      return apiRequest("DELETE", `/api/seo/rules/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/seo/rules"] });
      toast({
        title: "Regola SEO eliminata",
        description: "La regola SEO è stata eliminata con successo",
      });
      setIsDeleteDialogOpen(false);
      setSelectedRule(null);
    },
    onError: (error) => {
      toast({
        title: "Errore",
        description: "Non è stato possibile eliminare la regola SEO",
        variant: "destructive",
      });
    },
  });

  // Mutazione per la ricerca automatica di regole SEO
  const researchSeoRulesMutation = useMutation({
    mutationFn: (data: SeoResearchFormValues) => {
      return apiRequest("POST", "/api/seo/research", data);
    },
    onSuccess: (data) => {
      setResearchInProgress(false);
      setResearchResults(data.results || []);
      
      if (data.results && data.results.length > 0) {
        toast({
          title: "Ricerca completata",
          description: `Trovate ${data.results.length} regole SEO per ${data.platform}`,
        });
      } else {
        toast({
          title: "Ricerca completata",
          description: "Non sono state trovate nuove regole SEO",
        });
      }
    },
    onError: (error) => {
      setResearchInProgress(false);
      toast({
        title: "Errore di ricerca",
        description: "Non è stato possibile effettuare la ricerca di regole SEO",
        variant: "destructive",
      });
    },
  });

  // Mutazione per salvare tutte le regole trovate dalla ricerca
  const saveResearchResultsMutation = useMutation({
    mutationFn: (data: { platform: string; rules: string[] }) => {
      return apiRequest("POST", "/api/seo/rules/batch", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/seo/rules"] });
      toast({
        title: "Regole SEO salvate",
        description: "Le regole SEO trovate sono state salvate con successo",
      });
      setIsResearchDialogOpen(false);
      setResearchResults([]);
      researchForm.reset();
    },
    onError: (error) => {
      toast({
        title: "Errore",
        description: "Non è stato possibile salvare le regole SEO",
        variant: "destructive",
      });
    },
  });

  // Gestisce il submit del form di aggiunta regola SEO
  const onAddSubmit = (values: SeoRuleFormValues) => {
    addSeoRuleMutation.mutate(values);
  };

  // Gestisce il submit del form di modifica regola SEO
  const onEditSubmit = (values: SeoRuleFormValues) => {
    if (!selectedRule) return;
    updateSeoRuleMutation.mutate({
      id: selectedRule.id,
      rule: values,
    });
  };

  // Gestisce il submit del form di ricerca regole SEO
  const onResearchSubmit = (values: SeoResearchFormValues) => {
    setResearchInProgress(true);
    setResearchResults([]);
    researchSeoRulesMutation.mutate(values);
  };

  // Gestisce il salvataggio delle regole SEO trovate dalla ricerca
  const handleSaveResearchResults = () => {
    if (researchResults.length === 0) return;
    
    saveResearchResultsMutation.mutate({
      platform: researchForm.getValues("platform"),
      rules: researchResults,
    });
  };

  // Gestisce l'apertura del dialog di modifica
  const handleEditClick = (rule: SeoRule) => {
    setSelectedRule(rule);
    form.reset({
      platform: rule.platform,
      ruleName: rule.ruleName,
      ruleContent: rule.ruleContent,
      category: rule.category || "",
      isActive: rule.isActive || true,
      importance: rule.importance || "medium",
      source: rule.source || "",
    });
    setIsEditDialogOpen(true);
  };

  // Gestisce l'apertura del dialog di eliminazione
  const handleDeleteClick = (rule: SeoRule) => {
    setSelectedRule(rule);
    setIsDeleteDialogOpen(true);
  };

  // Gestisce l'apertura del dialog di ricerca
  const handleResearchClick = () => {
    researchForm.reset({
      platform: activePlatformTab,
      targetCount: 3,
      searchType: "latest",
      specificTopic: "",
    });
    setResearchResults([]);
    setIsResearchDialogOpen(true);
  };

  // Funzione per ottenere le regole SEO in base alla piattaforma
  const getRulesByPlatform = (platform: string) => {
    switch (platform) {
      case "wordpress":
        return { rules: wordpressRules, isLoading: isLoadingWordpressRules };
      case "instagram":
        return { rules: instagramRules, isLoading: isLoadingInstagramRules };
      case "linkedin":
        return { rules: linkedinRules, isLoading: isLoadingLinkedinRules };
      case "facebook":
        return { rules: facebookRules, isLoading: isLoadingFacebookRules };
      default:
        return { rules: [], isLoading: false };
    }
  };

  // Funzione per formattare la data
  const formatDate = (dateString?: string | Date) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("it-IT", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  // Funzione per ottenere il colore del badge in base al tipo di regola
  const getRuleTypeBadgeColor = (ruleType: string) => {
    switch (ruleType) {
      case "title":
        return "bg-blue-500";
      case "content":
        return "bg-green-500";
      case "hashtag":
        return "bg-purple-500";
      case "image":
        return "bg-orange-500";
      case "video":
        return "bg-red-500";
      case "length":
        return "bg-cyan-500";
      default:
        return "bg-slate-500";
    }
  };

  const { rules: currentRules, isLoading: isLoadingCurrentRules } = getRulesByPlatform(activePlatformTab);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Regole SEO Auto-Aggiornanti</h2>
          <p className="text-sm text-muted-foreground">
            Gestisci le regole SEO per varie piattaforme e abilita l'auto-apprendimento
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleResearchClick}>
            <Sparkles className="h-4 w-4 mr-2" />
            Ricerca Automatica
          </Button>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Aggiungi Regola
          </Button>
        </div>
      </div>

      {/* Tabs per le diverse piattaforme */}
      <Tabs defaultValue="wordpress" value={activePlatformTab} onValueChange={setActivePlatformTab}>
        <TabsList>
          <TabsTrigger value="wordpress">WordPress</TabsTrigger>
          <TabsTrigger value="instagram">Instagram</TabsTrigger>
          <TabsTrigger value="linkedin">LinkedIn</TabsTrigger>
          <TabsTrigger value="facebook">Facebook</TabsTrigger>
        </TabsList>

        {["wordpress", "instagram", "linkedin", "facebook"].map((platform) => (
          <TabsContent key={platform} value={platform}>
            <Card>
              <CardHeader>
                <CardTitle>Regole {platform.charAt(0).toUpperCase() + platform.slice(1)}</CardTitle>
                <CardDescription>
                  Regole SEO specifiche per {platform.charAt(0).toUpperCase() + platform.slice(1)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingCurrentRules ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="border rounded-md p-4 space-y-2">
                        <div className="flex justify-between">
                          <Skeleton className="h-5 w-32" />
                          <Skeleton className="h-6 w-16" />
                        </div>
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                      </div>
                    ))}
                  </div>
                ) : !currentRules || currentRules.length === 0 ? (
                  <div className="border border-dashed rounded-md p-8 text-center">
                    <Sparkles className="mx-auto h-8 w-8 text-slate-400 mb-2" />
                    <p className="text-slate-600">Nessuna regola SEO trovata per {platform}</p>
                    <div className="flex justify-center gap-2 mt-4">
                      <Button 
                        variant="outline" 
                        onClick={handleResearchClick}
                      >
                        <Search className="h-4 w-4 mr-2" />
                        Ricerca Automatica
                      </Button>
                      <Button 
                        onClick={() => {
                          form.setValue("platform", platform);
                          setIsAddDialogOpen(true);
                        }}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Aggiungi Manualmente
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {currentRules.map((rule) => (
                      <Card key={rule.id} className="overflow-hidden">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Badge className={getRuleTypeBadgeColor(rule.rule_type)}>
                                {rule.rule_type.charAt(0).toUpperCase() + rule.rule_type.slice(1)}
                              </Badge>
                              {!rule.is_active && (
                                <Badge variant="outline" className="text-slate-500">
                                  Inattiva
                                </Badge>
                              )}
                              <Badge variant="outline" className="text-slate-500">
                                Priorità: {rule.priority}
                              </Badge>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditClick(rule)}
                                disabled={updateSeoRuleMutation.isPending}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-500 hover:text-red-700"
                                onClick={() => handleDeleteClick(rule)}
                                disabled={deleteSeoRuleMutation.isPending}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          <p className="text-slate-800 font-medium mb-1">{rule.rule_value}</p>
                          {rule.description && (
                            <p className="text-sm text-slate-600 mb-2">{rule.description}</p>
                          )}
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 mt-2">
                            <span>Aggiornato: {formatDate(rule.last_updated)}</span>
                            {rule.source && (
                              <span>Fonte: {rule.source}</span>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Dialog Aggiungi Regola SEO */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Aggiungi Regola SEO</DialogTitle>
            <DialogDescription>
              Aggiungi una nuova regola SEO per ottimizzare i contenuti
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onAddSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="platform"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Piattaforma</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleziona la piattaforma" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="wordpress">WordPress</SelectItem>
                        <SelectItem value="instagram">Instagram</SelectItem>
                        <SelectItem value="linkedin">LinkedIn</SelectItem>
                        <SelectItem value="facebook">Facebook</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="rule_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo di Regola</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleziona il tipo di regola" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="title">Titolo</SelectItem>
                        <SelectItem value="content">Contenuto</SelectItem>
                        <SelectItem value="hashtag">Hashtag</SelectItem>
                        <SelectItem value="image">Immagine</SelectItem>
                        <SelectItem value="video">Video</SelectItem>
                        <SelectItem value="length">Lunghezza</SelectItem>
                        <SelectItem value="other">Altro</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="rule_value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Regola</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Esempio: I titoli dovrebbero essere tra 50 e 60 caratteri" 
                        {...field}
                        className="min-h-20"
                      />
                    </FormControl>
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
                      <Textarea 
                        placeholder="Descrizione dettagliata della regola e del suo utilizzo" 
                        {...field}
                        className="min-h-20"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="source"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fonte (opzionale)</FormLabel>
                    <FormControl>
                      <Input placeholder="URL o riferimento alla fonte" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priorità</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        defaultValue={field.value.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Priorità" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
                            <SelectItem key={value} value={value.toString()}>
                              {value} {value === 1 ? "(più bassa)" : value === 10 ? "(più alta)" : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="is_active"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-md border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Attiva</FormLabel>
                        <FormDescription>
                          Applica questa regola ai contenuti
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
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Annulla
                </Button>
                <Button type="submit" disabled={addSeoRuleMutation.isPending}>
                  {addSeoRuleMutation.isPending ? (
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

      {/* Dialog Modifica Regola SEO */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Modifica Regola SEO</DialogTitle>
            <DialogDescription>
              Modifica una regola SEO esistente
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onEditSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="platform"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Piattaforma</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleziona la piattaforma" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="wordpress">WordPress</SelectItem>
                        <SelectItem value="instagram">Instagram</SelectItem>
                        <SelectItem value="linkedin">LinkedIn</SelectItem>
                        <SelectItem value="facebook">Facebook</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="rule_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo di Regola</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleziona il tipo di regola" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="title">Titolo</SelectItem>
                        <SelectItem value="content">Contenuto</SelectItem>
                        <SelectItem value="hashtag">Hashtag</SelectItem>
                        <SelectItem value="image">Immagine</SelectItem>
                        <SelectItem value="video">Video</SelectItem>
                        <SelectItem value="length">Lunghezza</SelectItem>
                        <SelectItem value="other">Altro</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="rule_value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Regola</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Esempio: I titoli dovrebbero essere tra 50 e 60 caratteri" 
                        {...field}
                        className="min-h-20"
                      />
                    </FormControl>
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
                      <Textarea 
                        placeholder="Descrizione dettagliata della regola e del suo utilizzo" 
                        {...field}
                        className="min-h-20"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="source"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fonte (opzionale)</FormLabel>
                    <FormControl>
                      <Input placeholder="URL o riferimento alla fonte" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priorità</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        defaultValue={field.value.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Priorità" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
                            <SelectItem key={value} value={value.toString()}>
                              {value} {value === 1 ? "(più bassa)" : value === 10 ? "(più alta)" : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="is_active"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-md border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Attiva</FormLabel>
                        <FormDescription>
                          Applica questa regola ai contenuti
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
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Annulla
                </Button>
                <Button type="submit" disabled={updateSeoRuleMutation.isPending}>
                  {updateSeoRuleMutation.isPending ? (
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

      {/* Dialog Elimina Regola SEO */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sei sicuro di voler eliminare questa regola SEO?</AlertDialogTitle>
            <AlertDialogDescription>
              Questa azione non può essere annullata. La regola SEO verrà rimossa definitivamente
              e non sarà più applicata ai contenuti.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => selectedRule && deleteSeoRuleMutation.mutate(selectedRule.id)}
              disabled={deleteSeoRuleMutation.isPending}
            >
              {deleteSeoRuleMutation.isPending ? (
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

      {/* Dialog Ricerca Automatica Regole SEO */}
      <Dialog open={isResearchDialogOpen} onOpenChange={setIsResearchDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Ricerca Automatica Regole SEO</DialogTitle>
            <DialogDescription>
              Ricerca automaticamente le regole SEO più recenti dalla piattaforma selezionata
            </DialogDescription>
          </DialogHeader>
          <Form {...researchForm}>
            <form onSubmit={researchForm.handleSubmit(onResearchSubmit)} className="space-y-4">
              <FormField
                control={researchForm.control}
                name="platform"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Piattaforma</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={researchInProgress}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleziona la piattaforma" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="wordpress">WordPress</SelectItem>
                        <SelectItem value="instagram">Instagram</SelectItem>
                        <SelectItem value="linkedin">LinkedIn</SelectItem>
                        <SelectItem value="facebook">Facebook</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Piattaforma per cui cercare le regole SEO
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={researchForm.control}
                name="searchType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo di Ricerca</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={researchInProgress}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleziona il tipo di ricerca" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="latest">Ultime Novità</SelectItem>
                        <SelectItem value="specific">Argomento Specifico</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Scegli se cercare le ultime novità o informazioni su un argomento specifico
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {researchForm.watch("searchType") === "specific" && (
                <FormField
                  control={researchForm.control}
                  name="specificTopic"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Argomento Specifico</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Esempio: hashtag per logistica, dimensioni immagini per LinkedIn" 
                          {...field}
                          disabled={researchInProgress}
                        />
                      </FormControl>
                      <FormDescription>
                        Specifica l'argomento su cui cercare regole SEO
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              <FormField
                control={researchForm.control}
                name="targetCount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Numero di Regole</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      defaultValue={field.value.toString()}
                      disabled={researchInProgress}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleziona il numero di regole" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="1">1 regola</SelectItem>
                        <SelectItem value="3">3 regole</SelectItem>
                        <SelectItem value="5">5 regole</SelectItem>
                        <SelectItem value="10">10 regole</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Numero di regole SEO da ricercare
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {!researchInProgress && researchResults.length > 0 && (
                <div className="border rounded-md p-4 space-y-2">
                  <h3 className="font-medium">Regole SEO Trovate:</h3>
                  <div className="max-h-56 overflow-y-auto space-y-2">
                    {researchResults.map((rule, index) => (
                      <div key={index} className="p-2 border rounded text-sm">
                        {rule}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <DialogFooter className="flex flex-col sm:flex-row gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsResearchDialogOpen(false)}
                  disabled={researchInProgress}
                  className="sm:order-1"
                >
                  Annulla
                </Button>
                {researchResults.length > 0 ? (
                  <Button 
                    type="button"
                    onClick={handleSaveResearchResults}
                    disabled={saveResearchResultsMutation.isPending}
                    className="bg-green-600 hover:bg-green-700 sm:order-2"
                  >
                    {saveResearchResultsMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Salvataggio...
                      </>
                    ) : (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        Salva Regole Trovate
                      </>
                    )}
                  </Button>
                ) : (
                  <Button 
                    type="submit" 
                    disabled={researchInProgress}
                    className="sm:order-2"
                  >
                    {researchInProgress ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Ricerca in corso...
                      </>
                    ) : (
                      <>
                        <Search className="mr-2 h-4 w-4" />
                        Avvia Ricerca
                      </>
                    )}
                  </Button>
                )}
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}