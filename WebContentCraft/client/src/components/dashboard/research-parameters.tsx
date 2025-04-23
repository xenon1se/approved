import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useSettings } from "@/contexts/settings-context";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SaveIcon } from "lucide-react";

const researchParamsSchema = z.object({
  primaryTopic: z.string().min(1, "Primary topic is required"),
  contentFocus: z.string().min(1, "Content focus is required"),
  keywords: z.string().min(1, "Keywords are required"),
  contentDepth: z.string().min(1, "Content depth is required"),
  geoFocus: z.string().min(1, "Geographic focus is required"),
});

type ResearchParamsFormValues = z.infer<typeof researchParamsSchema>;

export function ResearchParameters() {
  const { toast } = useToast();
  const { researchParams, setResearchParams } = useSettings();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ResearchParamsFormValues>({
    resolver: zodResolver(researchParamsSchema),
    defaultValues: {
      primaryTopic: researchParams.primaryTopic,
      contentFocus: researchParams.contentFocus,
      keywords: researchParams.keywords,
      contentDepth: researchParams.contentDepth,
      geoFocus: researchParams.geoFocus,
    },
  });

  async function onSubmit(data: ResearchParamsFormValues) {
    setIsSubmitting(true);
    try {
      const response = await apiRequest("POST", "/api/research-parameters", data);
      const savedParams = await response.json();
      setResearchParams(savedParams);
      queryClient.invalidateQueries({ queryKey: ["/api/research-parameters"] });
      
      toast({
        title: "Parameters saved",
        description: "Your research parameters have been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save research parameters.",
        variant: "destructive",
      });
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="mb-8">
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold mb-4 text-slate-800">Logistics Research Parameters</h3>
        <p className="text-slate-600 mb-4">Customize search parameters for Perplexity API to find relevant logistics content</p>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="primaryTopic"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Primary Topic</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select primary topic" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Logistics Management">Logistics Management</SelectItem>
                        <SelectItem value="Supply Chain">Supply Chain</SelectItem>
                        <SelectItem value="Transport & Distribution">Transport & Distribution</SelectItem>
                        <SelectItem value="Warehousing">Warehousing</SelectItem>
                        <SelectItem value="E-commerce Logistics">E-commerce Logistics</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="contentFocus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Content Focus</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select content focus" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Industry Trends">Industry Trends</SelectItem>
                        <SelectItem value="Technology">Technology</SelectItem>
                        <SelectItem value="Best Practices">Best Practices</SelectItem>
                        <SelectItem value="Case Studies">Case Studies</SelectItem>
                        <SelectItem value="Sustainability">Sustainability</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="keywords"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Keywords (comma separated)</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="contentDepth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Content Depth</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select content depth" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Brief Overview (500 words)">Brief Overview (500 words)</SelectItem>
                        <SelectItem value="Standard Article (800-1000 words)">Standard Article (800-1000 words)</SelectItem>
                        <SelectItem value="In-depth Analysis (1500+ words)">In-depth Analysis (1500+ words)</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="geoFocus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Geographic Focus</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select geographic focus" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Global">Global</SelectItem>
                        <SelectItem value="Europe">Europe</SelectItem>
                        <SelectItem value="North America">North America</SelectItem>
                        <SelectItem value="Asia Pacific">Asia Pacific</SelectItem>
                        <SelectItem value="Latin America">Latin America</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            </div>
            
            <div className="md:col-span-2 flex justify-end">
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="flex items-center gap-2"
              >
                <SaveIcon className="h-4 w-4" />
                Save Parameters
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
