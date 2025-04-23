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
import { Switch } from "@/components/ui/switch";
import { ApiKeyInput } from "@/components/ui/api-key-input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Search, 
  RefreshCw,
  MoreVertical, 
  Instagram, 
  Image,
  Linkedin
} from "lucide-react";

const apiSettingsSchema = z.object({
  perplexityApiKey: z.string().min(1, "Perplexity API key is required"),
  wordpressApiUrl: z.string().url("Must be a valid URL").or(z.literal("")),
  wordpressUsername: z.string(),
  wordpressPassword: z.string(),
  instagramAccessToken: z.string(),
  linkedinClientId: z.string(),
  linkedinClientSecret: z.string(),
  pexelsApiKey: z.string(),
  autoPublishToWordPress: z.boolean().default(true),
});

type ApiSettingsFormValues = z.infer<typeof apiSettingsSchema>;

export function ApiSettings() {
  const { toast } = useToast();
  const { apiSettings, setApiSettings, contentPrefs, setContentPrefs } = useSettings();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ApiSettingsFormValues>({
    resolver: zodResolver(apiSettingsSchema),
    defaultValues: {
      perplexityApiKey: apiSettings.perplexityApiKey,
      wordpressApiUrl: apiSettings.wordpressApiUrl,
      wordpressUsername: apiSettings.wordpressUsername,
      wordpressPassword: apiSettings.wordpressPassword,
      instagramAccessToken: apiSettings.instagramAccessToken,
      linkedinClientId: apiSettings.linkedinClientId,
      linkedinClientSecret: apiSettings.linkedinClientSecret,
      pexelsApiKey: apiSettings.pexelsApiKey,
      autoPublishToWordPress: contentPrefs.autoPublishToWordPress,
    },
  });

  async function onSubmit(data: ApiSettingsFormValues) {
    setIsSubmitting(true);
    try {
      // Update API settings
      const apiSettingsData = {
        perplexityApiKey: data.perplexityApiKey,
        wordpressApiUrl: data.wordpressApiUrl,
        wordpressUsername: data.wordpressUsername,
        wordpressPassword: data.wordpressPassword,
        instagramAccessToken: data.instagramAccessToken,
        linkedinClientId: data.linkedinClientId,
        linkedinClientSecret: data.linkedinClientSecret,
        pexelsApiKey: data.pexelsApiKey,
      };

      const apiResponse = await apiRequest("POST", "/api/settings", apiSettingsData);
      const savedApiSettings = await apiResponse.json();
      setApiSettings(savedApiSettings);

      // Update content preferences for autoPublishToWordPress
      const contentPrefsResponse = await apiRequest("POST", "/api/preferences", {
        ...contentPrefs,
        autoPublishToWordPress: data.autoPublishToWordPress,
      });
      const savedContentPrefs = await contentPrefsResponse.json();
      setContentPrefs(savedContentPrefs);
      
      toast({
        title: "Settings saved",
        description: "Your API settings have been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save API settings.",
        variant: "destructive",
      });
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function testConnections() {
    toast({
      title: "Testing connections",
      description: "Testing all API connections...",
    });
    // This would be implemented to test each API connection
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-slate-800">API Connections</h3>
          <Button
            type="button"
            variant="ghost"
            onClick={testConnections}
            className="text-primary-600 hover:text-primary-800 text-sm font-medium"
          >
            Test All Connections
          </Button>
        </div>
        
        {/* Perplexity API */}
        <div className="border rounded-lg p-4 border-slate-200">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-100 text-indigo-600 p-2 rounded-md">
                <Search className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-medium text-slate-800">Perplexity API</h4>
                <p className="text-sm text-slate-500">Web research for logistics content</p>
              </div>
            </div>
            <div className="flex items-center">
              <Badge className="mr-2 bg-green-100 text-green-800 hover:bg-green-100">Connected</Badge>
              <Button variant="ghost" size="icon" className="text-slate-400 hover:text-slate-600">
                <MoreVertical className="h-4 w-4" />
              </Button>
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
                    placeholder="Enter your Perplexity API Key" 
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>
        
        {/* WordPress API */}
        <div className="border rounded-lg p-4 border-slate-200">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 text-blue-600 p-2 rounded-md">
                <span className="ri-wordpress-line text-xl"></span>
              </div>
              <div>
                <h4 className="font-medium text-slate-800">WordPress API</h4>
                <p className="text-sm text-slate-500">Blog post publishing</p>
              </div>
            </div>
            <div className="flex items-center">
              <Badge className="mr-2 bg-green-100 text-green-800 hover:bg-green-100">Connected</Badge>
              <Button variant="ghost" size="icon" className="text-slate-400 hover:text-slate-600">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="wordpressApiUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Site URL</FormLabel>
                  <FormControl>
                    <Input
                      id="wordpress-site-url"
                      placeholder="Enter your WordPress site URL"
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
                      placeholder="Enter your WordPress username"
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
                  <FormLabel>Application Password</FormLabel>
                  <FormControl>
                    <ApiKeyInput
                      id="wordpress-app-password"
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Enter your WordPress application password"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="autoPublishToWordPress"
              render={({ field }) => (
                <FormItem className="pt-2">
                  <div className="flex items-center justify-between">
                    <FormLabel>Auto-publish to WordPress</FormLabel>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </div>
                  <FormDescription>
                    When enabled, articles will be automatically published to your WordPress blog
                  </FormDescription>
                </FormItem>
              )}
            />
          </div>
        </div>
        
        {/* Instagram API */}
        <div className="border rounded-lg p-4 border-slate-200">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-pink-100 text-pink-600 p-2 rounded-md">
                <Instagram className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-medium text-slate-800">Instagram API</h4>
                <p className="text-sm text-slate-500">Social media post creation</p>
              </div>
            </div>
            <div className="flex items-center">
              <Badge className="mr-2 bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Reconnect Needed</Badge>
              <Button variant="ghost" size="icon" className="text-slate-400 hover:text-slate-600">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="space-y-4">
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
                      placeholder="Enter your Instagram access token"
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
                Reconnect Instagram Account
              </Button>
            </div>
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
                <p className="text-sm text-slate-500">Professional network posting</p>
              </div>
            </div>
            <div className="flex items-center">
              <Badge className="mr-2 bg-green-100 text-green-800 hover:bg-green-100">Connected</Badge>
              <Button variant="ghost" size="icon" className="text-slate-400 hover:text-slate-600">
                <MoreVertical className="h-4 w-4" />
              </Button>
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
                      placeholder="Enter your LinkedIn client ID"
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
                      placeholder="Enter your LinkedIn client secret"
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
                <p className="text-sm text-slate-500">Image search and selection</p>
              </div>
            </div>
            <div className="flex items-center">
              <Badge className="mr-2 bg-green-100 text-green-800 hover:bg-green-100">Connected</Badge>
              <Button variant="ghost" size="icon" className="text-slate-400 hover:text-slate-600">
                <MoreVertical className="h-4 w-4" />
              </Button>
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
                    placeholder="Enter your Pexels API key"
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end -mx-6 -mb-6 mt-10 rounded-b-lg">
          <Button type="submit" disabled={isSubmitting}>
            Save All Settings
          </Button>
        </div>
      </form>
    </Form>
  );
}
