import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSettings } from "@/contexts/settings-context";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Wand2 } from "lucide-react";

const contentFormSchema = z.object({
  topic: z.string().min(3, "Topic must be at least 3 characters"),
  outputFormats: z.array(z.string()).min(1, "Select at least one output format"),
  articleLength: z.string(),
  imageCount: z.string(),
  additionalKeywords: z.string().optional(),
});

type ContentFormValues = z.infer<typeof contentFormSchema>;

export function ContentForm() {
  const { toast } = useToast();
  const { contentPrefs } = useSettings();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ContentFormValues>({
    resolver: zodResolver(contentFormSchema),
    defaultValues: {
      topic: "",
      outputFormats: ["wordpress", "html", "instagram", "linkedin"],
      articleLength: "Medium (800-1200 words)",
      imageCount: "2",
      additionalKeywords: "",
    },
  });

  const outputFormatOptions = [
    { id: "wordpress", label: "WordPress Article" },
    { id: "html", label: "HTML Article" },
    { id: "instagram", label: "Instagram Post" },
    { id: "linkedin", label: "LinkedIn Post" },
  ];

  async function onSubmit(data: ContentFormValues) {
    setIsSubmitting(true);
    try {
      const response = await apiRequest("POST", "/api/generate-content", data);
      const result = await response.json();
      
      // Refresh the content list
      queryClient.invalidateQueries({ queryKey: ["/api/content"] });
      
      toast({
        title: "Content generated successfully",
        description: `Created ${result.results.length} content items`,
      });
      
      // Reset the form
      form.reset({
        topic: "",
        outputFormats: ["wordpress", "html", "instagram", "linkedin"],
        articleLength: "Medium (800-1200 words)",
        imageCount: "2",
        additionalKeywords: "",
      });
    } catch (error) {
      toast({
        title: "Error generating content",
        description: "There was a problem generating your content. Please try again.",
        variant: "destructive",
      });
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="border-b border-slate-200 pb-4 mb-6">
          <h3 className="text-lg font-semibold text-slate-800">New Content</h3>
          <p className="text-slate-600 text-sm">Create a new article about logistics with auto-generated social media posts</p>
        </div>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="topic"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Article Topic</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g. The Impact of AI on Last Mile Delivery" 
                      {...field} 
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="outputFormats"
                render={() => (
                  <FormItem>
                    <FormLabel>Output Formats</FormLabel>
                    <div className="space-y-2">
                      {outputFormatOptions.map((option) => (
                        <FormField
                          key={option.id}
                          control={form.control}
                          name="outputFormats"
                          render={({ field }) => {
                            return (
                              <div className="flex items-center">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(option.id)}
                                    onCheckedChange={(checked) => {
                                      const currentValue = [...field.value];
                                      if (checked) {
                                        if (!currentValue.includes(option.id)) {
                                          field.onChange([...currentValue, option.id]);
                                        }
                                      } else {
                                        field.onChange(currentValue.filter((value) => value !== option.id));
                                      }
                                    }}
                                  />
                                </FormControl>
                                <label
                                  htmlFor={option.id}
                                  className="ml-2 text-sm text-slate-700"
                                >
                                  {option.label}
                                </label>
                              </div>
                            );
                          }}
                        />
                      ))}
                    </div>
                  </FormItem>
                )}
              />
              
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="articleLength"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Article Length</FormLabel>
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
                  name="imageCount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Number of Images</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select number of images" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="1">1</SelectItem>
                          <SelectItem value="2">2</SelectItem>
                          <SelectItem value="3">3</SelectItem>
                          <SelectItem value="4">4</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              </div>
            </div>
            
            <FormField
              control={form.control}
              name="additionalKeywords"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Keywords (comma separated)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g. route optimization, delivery efficiency, technology" 
                      {...field} 
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <div className="pt-4 flex justify-end">
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="flex items-center gap-2"
              >
                <Wand2 className="h-4 w-4" />
                Generate Content
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
