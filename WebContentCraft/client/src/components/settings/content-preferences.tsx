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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const contentPreferencesSchema = z.object({
  defaultArticleLength: z.string(),
  defaultArticleStyle: z.string(),
  generateHtmlArticles: z.boolean(),
  autoPublishToSocialMedia: z.boolean(),
  instagramHashtags: z.string(),
  linkedinHashtags: z.string(),
});

type ContentPreferencesFormValues = z.infer<typeof contentPreferencesSchema>;

export function ContentPreferences() {
  const { toast } = useToast();
  const { contentPrefs, setContentPrefs } = useSettings();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ContentPreferencesFormValues>({
    resolver: zodResolver(contentPreferencesSchema),
    defaultValues: {
      defaultArticleLength: contentPrefs.defaultArticleLength,
      defaultArticleStyle: contentPrefs.defaultArticleStyle,
      generateHtmlArticles: contentPrefs.generateHtmlArticles,
      autoPublishToSocialMedia: contentPrefs.autoPublishToSocialMedia,
      instagramHashtags: contentPrefs.instagramHashtags,
      linkedinHashtags: contentPrefs.linkedinHashtags,
    },
  });

  async function onSubmit(data: ContentPreferencesFormValues) {
    setIsSubmitting(true);
    try {
      const response = await apiRequest("POST", "/api/preferences", data);
      const savedPrefs = await response.json();
      setContentPrefs(savedPrefs);
      
      toast({
        title: "Preferences saved",
        description: "Your content preferences have been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save content preferences.",
        variant: "destructive",
      });
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <h3 className="text-lg font-medium text-slate-800 mb-4">Content Preferences</h3>
        
        <div>
          <h4 className="font-medium text-slate-700 mb-3">Default Article Settings</h4>
          
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="defaultArticleLength"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Default Article Length</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select article length" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Short (500-700 words)">Short (500-700 words)</SelectItem>
                      <SelectItem value="Medium (800-1200 words)">Medium (800-1200 words)</SelectItem>
                      <SelectItem value="Long (1500+ words)">Long (1500+ words)</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="defaultArticleStyle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Writing Style</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select writing style" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Formal">Formal</SelectItem>
                      <SelectItem value="Balanced">Balanced</SelectItem>
                      <SelectItem value="Conversational">Conversational</SelectItem>
                      <SelectItem value="Technical">Technical</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="generateHtmlArticles"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between mb-1">
                    <FormLabel>Generate HTML Articles</FormLabel>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </div>
                  <FormDescription>
                    When enabled, an HTML version of each article will be generated
                  </FormDescription>
                </FormItem>
              )}
            />
          </div>
        </div>
        
        <div>
          <h4 className="font-medium text-slate-700 mb-3">Social Media Settings</h4>
          
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="instagramHashtags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Default Instagram Hashtags (comma separated)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter default hashtags"
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="linkedinHashtags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Default LinkedIn Hashtags (comma separated)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter default hashtags"
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="autoPublishToSocialMedia"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between mb-1">
                    <FormLabel>Auto-publish to Social Media</FormLabel>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </div>
                  <FormDescription>
                    When enabled, social media posts will be automatically published
                  </FormDescription>
                </FormItem>
              )}
            />
          </div>
        </div>
      </form>
    </Form>
  );
}
