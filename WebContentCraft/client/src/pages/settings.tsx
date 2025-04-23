import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ApiSettings } from "@/components/settings/api-settings";
import { UnifiedApiSettings } from "@/components/settings/unified-api-settings";
import { ContentPreferences } from "@/components/settings/content-preferences";
import { DatabaseManager } from "@/components/settings/database-manager";
import { SeoRulesManager } from "@/components/settings/seo-rules-manager";
import { Card } from "@/components/ui/card";

export default function Settings() {
  const [activeTab, setActiveTab] = useState("api");

  return (
    <section className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Impostazioni</h2>
        <p className="text-slate-600">Configura le tue connessioni API e preferenze di contenuto</p>
      </div>
      
      <Card className="overflow-hidden">
        <Tabs defaultValue="api" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="p-0 bg-white border-b border-slate-200 w-full justify-start rounded-none">
            <TabsTrigger value="api" className="px-6 py-3 data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-primary-600 data-[state=active]:shadow-none rounded-none">
              Gestione API
            </TabsTrigger>
            <TabsTrigger value="content" className="px-6 py-3 data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-primary-600 data-[state=active]:shadow-none rounded-none">
              Preferenze Contenuto
            </TabsTrigger>
            <TabsTrigger value="database" className="px-6 py-3 data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-primary-600 data-[state=active]:shadow-none rounded-none">
              Gestione Database
            </TabsTrigger>
            <TabsTrigger value="seo" className="px-6 py-3 data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-primary-600 data-[state=active]:shadow-none rounded-none">
              Regole SEO
            </TabsTrigger>
          </TabsList>
          <TabsContent value="api" className="p-6 mt-0">
            <UnifiedApiSettings />
          </TabsContent>
          <TabsContent value="content" className="p-6 mt-0">
            <ContentPreferences />
          </TabsContent>
          <TabsContent value="database" className="p-6 mt-0">
            <DatabaseManager />
          </TabsContent>
          <TabsContent value="seo" className="p-6 mt-0">
            <SeoRulesManager />
          </TabsContent>
        </Tabs>
      </Card>
    </section>
  );
}
