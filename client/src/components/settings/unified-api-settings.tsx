import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { useSettings } from "@/contexts/settings-context";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ApiKeyInput } from "@/components/ui/api-key-input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, 
  RefreshCw,
  MoreVertical, 
  Instagram, 
  Image,
  Linkedin,
  Facebook,
  Globe,
  BrainCircuit,
  Languages
} from "lucide-react";

const apiSettingsSchema = z.object({
  perplexityApiKey: z.string().min(1, "Perplexity API key is required"),
  deepseekApiKey: z.string().min(1, "DeepSeek API key is required"),
  deeplApiKey: z.string().min(1, "DeepL API key is required"),
  wordpressApiUrl: z.string().url("Must be a valid URL").or(z.literal("")),
  wordpressUsername: z.string(),
  wordpressPassword: z.string(),
  instagramAccessToken: z.string(),
  linkedinClientId: z.string(),
  linkedinClientSecret: z.string(),
  facebookAccessToken: z.string(),
  pexelsApiKey: z.string(),
});

type ApiSettingsFormValues = z.infer<typeof apiSettingsSchema>;

export function UnifiedApiSettings() {
  const { toast } = useToast();
  const { apiSettings, setApiSettings } = useSettings();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("ai");

  const form = useForm<ApiSettingsFormValues>({
    resolver: zodResolver(apiSettingsSchema),
    defaultValues: {
      perplexityApiKey: apiSettings.perplexityApiKey,
      deepseekApiKey: apiSettings.deepseekApiKey,
      deeplApiKey: apiSettings.deeplApiKey,
      wordpressApiUrl: apiSettings.wordpressApiUrl,
      wordpressUsername: apiSettings.wordpressUsername,
      wordpressPassword: apiSettings.wordpressPassword,
      instagramAccessToken: apiSettings.instagramAccessToken,
      linkedinClientId: apiSettings.linkedinClientId,
      linkedinClientSecret: apiSettings.linkedinClientSecret,
      facebookAccessToken: apiSettings.facebookAccessToken,
      pexelsApiKey: apiSettings.pexelsApiKey,
    },
  });

  async function onSubmit(data: ApiSettingsFormValues) {
    setIsSubmitting(true);
    try {
      // Update API settings
      const apiResponse = await apiRequest("POST", "/api/settings", data);
      const savedApiSettings = await apiResponse.json();
      setApiSettings(savedApiSettings);
      
      toast({
        title: "Impostazioni salvate",
        description: "Le tue API sono state aggiornate con successo.",
      });
    } catch (error) {
      toast({
        title: "Errore",
        description: "Impossibile salvare le impostazioni API.",
        variant: "destructive",
      });
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function testConnections() {
    toast({
      title: "Test connessioni",
      description: "Test di tutte le connessioni API in corso...",
    });
    // Implementazione per testare ogni connessione API
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-slate-800">Gestione API</h3>
          <Button
            type="button"
            variant="ghost"
            onClick={testConnections}
            className="text-primary-600 hover:text-primary-800 text-sm font-medium"
          >
            Testa tutte le connessioni
          </Button>
        </div>
        
        <Tabs defaultValue="ai" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-4 w-full">
            <TabsTrigger value="ai" className="flex-1">
              AI e Ricerca
            </TabsTrigger>
            <TabsTrigger value="social" className="flex-1">
              Social Media
            </TabsTrigger>
            <TabsTrigger value="cms" className="flex-1">
              CMS e Media
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="ai" className="space-y-6">
            {/* Perplexity API */}
            <div className="border rounded-lg p-4 border-slate-200">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-indigo-100 text-indigo-600 p-2 rounded-md">
                    <Search className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-medium text-slate-800">Perplexity API</h4>
                    <p className="text-sm text-slate-500">Ricerca web e verifica fonti affidabili</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <Badge className="mr-2 bg-green-100 text-green-800 hover:bg-green-100">Connesso</Badge>
                </div>
              </div>
              
              <FormField
                control={form.control}
                name="perplexityApiKey"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>API Key</FormLabel>
                    <FormControl>
                      <ApiKeyInput 
                        id="perplexity-api-key" 
                        value={field.value} 
                        onChange={field.onChange}
                        placeholder="Inserisci la tua Perplexity API Key" 
                      />
                    </FormControl>
                    <FormDescription>
                      Utilizzato per ricercare contenuti logistici e verificare l'affidabilità delle fonti
                    </FormDescription>
                  </FormItem>
                )}
              />
            </div>

            {/* DeepSeek API */}
            <div className="border rounded-lg p-4 border-slate-200">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 text-blue-600 p-2 rounded-md">
                    <BrainCircuit className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-medium text-slate-800">DeepSeek API</h4>
                    <p className="text-sm text-slate-500">Ricerca avanzata e analisi dei social media</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <Badge className="mr-2 bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Da configurare</Badge>
                </div>
              </div>
              
              <FormField
                control={form.control}
                name="deepseekApiKey"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>API Key</FormLabel>
                    <FormControl>
                      <ApiKeyInput 
                        id="deepseek-api-key" 
                        value={field.value} 
                        onChange={field.onChange}
                        placeholder="Inserisci la tua DeepSeek API Key" 
                      />
                    </FormControl>
                    <FormDescription>
                      Utilizzato per ricerche su web, Instagram, LinkedIn e Facebook sul tema scelto
                    </FormDescription>
                  </FormItem>
                )}
              />
            </div>

            {/* DeepL API */}
            <div className="border rounded-lg p-4 border-slate-200">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-green-100 text-green-600 p-2 rounded-md">
                    <Languages className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-medium text-slate-800">DeepL API</h4>
                    <p className="text-sm text-slate-500">Traduzione automatica di alta qualità</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <Badge className="mr-2 bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Da configurare</Badge>
                </div>
              </div>
              
              <FormField
                control={form.control}
                name="deeplApiKey"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>API Key</FormLabel>
                    <FormControl>
                      <ApiKeyInput 
                        id="deepl-api-key" 
                        value={field.value} 
                        onChange={field.onChange}
                        placeholder="Inserisci la tua DeepL API Key" 
                      />
                    </FormControl>
                    <FormDescription>
                      Utilizzato per tradurre articoli e post in italiano
                    </FormDescription>
                  </FormItem>
                )}
              />
            </div>
          </TabsContent>
          
          <TabsContent value="social" className="space-y-6">
            {/* Instagram API */}
            <div className="border rounded-lg p-4 border-slate-200">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-pink-100 text-pink-600 p-2 rounded-md">
                    <Instagram className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-medium text-slate-800">Instagram API</h4>
                    <p className="text-sm text-slate-500">Creazione post per social media</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <Badge className="mr-2 bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Riconnessione necessaria</Badge>
                </div>
              </div>
              
              <FormField
                control={form.control}
                name="instagramAccessToken"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Access Token</FormLabel>
                    <FormControl>
                      <ApiKeyInput
                        id="instagram-access-token"
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Inserisci il tuo token di accesso Instagram"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <div className="pt-2">
                <Button 
                  type="button" 
                  variant="ghost"
                  className="text-primary-600 hover:text-primary-800 text-sm font-medium flex items-center gap-1"
                >
                  <RefreshCw className="h-4 w-4" />
                  Riconnetti account Instagram
                </Button>
              </div>
            </div>
            
            {/* LinkedIn API */}
            <div className="border rounded-lg p-4 border-slate-200">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 text-blue-600 p-2 rounded-md">
                    <Linkedin className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-medium text-slate-800">LinkedIn API</h4>
                    <p className="text-sm text-slate-500">Post su rete professionale</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <Badge className="mr-2 bg-green-100 text-green-800 hover:bg-green-100">Connesso</Badge>
                </div>
              </div>
              
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="linkedinClientId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Client ID</FormLabel>
                      <FormControl>
                        <Input
                          id="linkedin-client-id"
                          placeholder="Inserisci il tuo LinkedIn client ID"
                          {...field}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="linkedinClientSecret"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Client Secret</FormLabel>
                      <FormControl>
                        <ApiKeyInput
                          id="linkedin-client-secret"
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Inserisci il tuo LinkedIn client secret"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Facebook API */}
            <div className="border rounded-lg p-4 border-slate-200">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 text-blue-600 p-2 rounded-md">
                    <Facebook className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-medium text-slate-800">Facebook API</h4>
                    <p className="text-sm text-slate-500">Pubblicazione su Facebook</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <Badge className="mr-2 bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Da configurare</Badge>
                </div>
              </div>
              
              <FormField
                control={form.control}
                name="facebookAccessToken"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Access Token</FormLabel>
                    <FormControl>
                      <ApiKeyInput
                        id="facebook-access-token"
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Inserisci il tuo token di accesso Facebook"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <div className="pt-2">
                <Button 
                  type="button" 
                  variant="ghost"
                  className="text-primary-600 hover:text-primary-800 text-sm font-medium flex items-center gap-1"
                >
                  <RefreshCw className="h-4 w-4" />
                  Connetti account Facebook
                </Button>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="cms" className="space-y-6">
            {/* WordPress API */}
            <div className="border rounded-lg p-4 border-slate-200">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 text-blue-600 p-2 rounded-md">
                    <Globe className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-medium text-slate-800">WordPress API</h4>
                    <p className="text-sm text-slate-500">Pubblicazione articoli blog</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <Badge className="mr-2 bg-green-100 text-green-800 hover:bg-green-100">Connesso</Badge>
                </div>
              </div>
              
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="wordpressApiUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL Sito</FormLabel>
                      <FormControl>
                        <Input
                          id="wordpress-site-url"
                          placeholder="Inserisci l'URL del tuo sito WordPress"
                          {...field}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="wordpressUsername"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input
                          id="wordpress-username"
                          placeholder="Inserisci il tuo username WordPress"
                          {...field}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="wordpressPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password dell'applicazione</FormLabel>
                      <FormControl>
                        <ApiKeyInput
                          id="wordpress-app-password"
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Inserisci la tua password dell'applicazione WordPress"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>
            
            {/* Pexels API */}
            <div className="border rounded-lg p-4 border-slate-200">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-green-100 text-green-600 p-2 rounded-md">
                    <Image className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-medium text-slate-800">Pexels API</h4>
                    <p className="text-sm text-slate-500">Ricerca e selezione immagini</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <Badge className="mr-2 bg-green-100 text-green-800 hover:bg-green-100">Connesso</Badge>
                </div>
              </div>
              
              <FormField
                control={form.control}
                name="pexelsApiKey"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>API Key</FormLabel>
                    <FormControl>
                      <ApiKeyInput
                        id="pexels-api-key"
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Inserisci la tua Pexels API key"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </TabsContent>
        </Tabs>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end -mx-6 -mb-6 mt-10 rounded-b-lg">
          <Button type="submit" disabled={isSubmitting}>
            Salva tutte le impostazioni
          </Button>
        </div>
      </form>
    </Form>
  );
}