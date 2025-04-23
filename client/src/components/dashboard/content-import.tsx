import { useState } from "react";
import { FileText, Upload, ExternalLink, Search, FileArchive, FileVideo, Image, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Tipi di fonti supportati
type SourceType = "url" | "text" | "video" | "pdf" | "social";

export function ContentImport() {
  const [activeTab, setActiveTab] = useState<SourceType>("url");
  const [url, setUrl] = useState("");
  const [textContent, setTextContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [socialPlatform, setSocialPlatform] = useState("instagram");
  const [socialLink, setSocialLink] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [lastSearchResult, setLastSearchResult] = useState<string | null>(null);
  const { toast } = useToast();

  // Gestisce l'invio di un URL
  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setIsLoading(true);
    try {
      // Chiamata API per analizzare l'URL
      const response = await axios.post("/api/content/import", {
        type: "url",
        content: url,
      });

      toast({
        title: "URL importato con successo",
        description: "Il contenuto è stato importato e analizzato",
      });

      setLastSearchResult(response.data.summary || "Contenuto importato con successo");
    } catch (error) {
      toast({
        title: "Errore durante l'importazione",
        description: "Non è stato possibile importare il contenuto da questo URL",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Gestisce l'invio di testo
  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textContent.trim()) return;

    setIsLoading(true);
    try {
      // Chiamata API per analizzare il testo
      const response = await axios.post("/api/content/import", {
        type: "text",
        content: textContent,
      });

      toast({
        title: "Testo importato con successo",
        description: "Il contenuto è stato importato e analizzato",
      });

      setLastSearchResult(response.data.summary || "Contenuto importato con successo");
    } catch (error) {
      toast({
        title: "Errore durante l'importazione",
        description: "Non è stato possibile analizzare questo testo",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Gestisce l'invio di un file
  const handleFileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", activeTab); // pdf o video

    setIsLoading(true);
    try {
      // Chiamata API per caricare e analizzare il file
      const response = await axios.post("/api/content/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast({
        title: "File importato con successo",
        description: `Il ${activeTab === "pdf" ? "PDF" : "video"} è stato importato e analizzato`,
      });

      setLastSearchResult(response.data.summary || "File importato con successo");
    } catch (error) {
      toast({
        title: "Errore durante l'importazione",
        description: `Non è stato possibile importare questo ${activeTab === "pdf" ? "PDF" : "video"}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Gestisce l'invio di un link social
  const handleSocialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!socialLink.trim()) return;

    setIsLoading(true);
    try {
      // Chiamata API per analizzare il contenuto social
      const response = await axios.post("/api/content/import", {
        type: "social",
        platform: socialPlatform,
        content: socialLink,
      });

      toast({
        title: "Contenuto social importato",
        description: `Il post da ${socialPlatform} è stato importato e analizzato`,
      });

      setLastSearchResult(response.data.summary || "Contenuto social importato con successo");
    } catch (error) {
      toast({
        title: "Errore durante l'importazione",
        description: `Non è stato possibile importare questo contenuto da ${socialPlatform}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const resetForm = () => {
    setUrl("");
    setTextContent("");
    setFile(null);
    setSocialLink("");
    setLastSearchResult(null);
  };

  const changeTab = (tab: SourceType) => {
    setActiveTab(tab);
    resetForm();
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Importa Contenuti</CardTitle>
            <CardDescription>
              Importa contenuti da diverse fonti per la ricerca e l'analisi
            </CardDescription>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon">
                  <Info className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">
                  Importa contenuti da URL, file PDF, video o post social per utilizzarli
                  come fonti per i tuoi contenuti. Il sistema analizzerà automaticamente
                  le informazioni ed estrarrà le regole SEO rilevanti.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={(value) => changeTab(value as SourceType)}>
          <TabsList className="mb-4">
            <TabsTrigger value="url" className="flex items-center gap-1">
              <ExternalLink className="h-4 w-4" />
              URL
            </TabsTrigger>
            <TabsTrigger value="text" className="flex items-center gap-1">
              <FileText className="h-4 w-4" />
              Testo
            </TabsTrigger>
            <TabsTrigger value="pdf" className="flex items-center gap-1">
              <FileArchive className="h-4 w-4" />
              PDF
            </TabsTrigger>
            <TabsTrigger value="video" className="flex items-center gap-1">
              <FileVideo className="h-4 w-4" />
              Video
            </TabsTrigger>
            <TabsTrigger value="social" className="flex items-center gap-1">
              <Image className="h-4 w-4" />
              Social Media
            </TabsTrigger>
          </TabsList>

          <TabsContent value="url">
            <form onSubmit={handleUrlSubmit} className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Inserisci l'URL di un articolo o pagina web"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="flex-1"
                />
                <Button type="submit" disabled={isLoading || !url.trim()}>
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <Upload className="h-4 w-4 animate-spin" />
                      Importando...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Search className="h-4 w-4" />
                      Importa
                    </span>
                  )}
                </Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="text">
            <form onSubmit={handleTextSubmit} className="space-y-4">
              <Textarea
                placeholder="Incolla un testo da analizzare..."
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                className="min-h-32"
              />
              <Button 
                type="submit" 
                disabled={isLoading || !textContent.trim()}
                className="w-full sm:w-auto"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <Upload className="h-4 w-4 animate-spin" />
                    Analizzando...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Search className="h-4 w-4" />
                    Analizza Testo
                  </span>
                )}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="pdf">
            <form onSubmit={handleFileSubmit} className="space-y-4">
              <div className="flex flex-col gap-4">
                <Input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="cursor-pointer"
                />
                {file && (
                  <Alert>
                    <FileArchive className="h-4 w-4" />
                    <AlertTitle>File selezionato</AlertTitle>
                    <AlertDescription>
                      {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                    </AlertDescription>
                  </Alert>
                )}
                <Button 
                  type="submit" 
                  disabled={isLoading || !file}
                  className="w-full sm:w-auto"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <Upload className="h-4 w-4 animate-spin" />
                      Caricando...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Upload className="h-4 w-4" />
                      Carica e Analizza PDF
                    </span>
                  )}
                </Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="video">
            <form onSubmit={handleFileSubmit} className="space-y-4">
              <div className="flex flex-col gap-4">
                <Input
                  type="file"
                  accept="video/*"
                  onChange={handleFileChange}
                  className="cursor-pointer"
                />
                {file && (
                  <Alert>
                    <FileVideo className="h-4 w-4" />
                    <AlertTitle>Video selezionato</AlertTitle>
                    <AlertDescription>
                      {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                    </AlertDescription>
                  </Alert>
                )}
                <Button 
                  type="submit" 
                  disabled={isLoading || !file}
                  className="w-full sm:w-auto"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <Upload className="h-4 w-4 animate-spin" />
                      Caricando...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Upload className="h-4 w-4" />
                      Carica e Analizza Video
                    </span>
                  )}
                </Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="social">
            <form onSubmit={handleSocialSubmit} className="space-y-4">
              <div className="flex flex-col gap-4">
                <div className="flex gap-2">
                  <select
                    className="bg-background border border-input px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                    value={socialPlatform}
                    onChange={(e) => setSocialPlatform(e.target.value)}
                  >
                    <option value="instagram">Instagram</option>
                    <option value="linkedin">LinkedIn</option>
                    <option value="facebook">Facebook</option>
                    <option value="twitter">Twitter</option>
                  </select>
                  <Input
                    placeholder="Inserisci il link al post social"
                    value={socialLink}
                    onChange={(e) => setSocialLink(e.target.value)}
                    className="flex-1"
                  />
                </div>
                <Button 
                  type="submit" 
                  disabled={isLoading || !socialLink.trim()}
                  className="w-full sm:w-auto"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <Upload className="h-4 w-4 animate-spin" />
                      Importando...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Search className="h-4 w-4" />
                      Importa da {socialPlatform}
                    </span>
                  )}
                </Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>

        {lastSearchResult && (
          <div className="mt-4">
            <Alert className="bg-blue-50 border-blue-200">
              <Search className="h-4 w-4 text-blue-500" />
              <AlertTitle>Risultato dell'analisi</AlertTitle>
              <AlertDescription className="whitespace-pre-line">
                {lastSearchResult}
              </AlertDescription>
            </Alert>
          </div>
        )}
      </CardContent>
    </Card>
  );
}