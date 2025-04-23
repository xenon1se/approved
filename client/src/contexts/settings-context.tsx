import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { ApiSettings, ContentPreferences, ResearchParameters } from "@shared/schema";

type SettingsContextType = {
  apiSettings: ApiSettings;
  setApiSettings: (settings: ApiSettings) => void;
  contentPrefs: ContentPreferences;
  setContentPrefs: (preferences: ContentPreferences) => void;
  researchParams: ResearchParameters;
  setResearchParams: (parameters: ResearchParameters) => void;
  isLoading: boolean;
};

const defaultApiSettings: ApiSettings = {
  id: 0,
  perplexityApiKey: "",
  deepseekApiKey: "",
  deeplApiKey: "",
  wordpressApiUrl: "",
  wordpressUsername: "",
  wordpressPassword: "",
  instagramAccessToken: "",
  linkedinClientId: "",
  linkedinClientSecret: "",
  facebookAccessToken: "",
  pexelsApiKey: "",
};

const defaultContentPreferences: ContentPreferences = {
  id: 0,
  defaultArticleLength: "Medium (800-1200 words)",
  defaultArticleStyle: "Balanced",
  generateHtmlArticles: true,
  autoPublishToWordPress: true,
  autoPublishToSocialMedia: false,
  instagramHashtags: "#logistics, #supplychain, #transportation, #warehousing, #ecommerce, #shipping",
  linkedinHashtags: "#logistics, #supplychain, #businessstrategy",
};

const defaultResearchParameters: ResearchParameters = {
  id: 0,
  primaryTopic: "Logistics Management",
  contentFocus: "Industry Trends",
  keywords: "logistics automation, last mile delivery, inventory management, AI in logistics",
  contentDepth: "Standard Article (800-1000 words)",
  geoFocus: "Europe",
};

const SettingsContext = createContext<SettingsContextType>({
  apiSettings: defaultApiSettings,
  setApiSettings: () => {},
  contentPrefs: defaultContentPreferences,
  setContentPrefs: () => {},
  researchParams: defaultResearchParameters,
  setResearchParams: () => {},
  isLoading: true,
});

export function SettingsProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [apiSettings, setApiSettings] = useState<ApiSettings>(defaultApiSettings);
  const [contentPrefs, setContentPrefs] = useState<ContentPreferences>(defaultContentPreferences);
  const [researchParams, setResearchParams] = useState<ResearchParameters>(defaultResearchParameters);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch API settings
  const { 
    data: apiSettingsData, 
    isLoading: isApiSettingsLoading,
    isError: isApiSettingsError
  } = useQuery({
    queryKey: ["/api/settings"]
  });

  // Fetch content preferences
  const { 
    data: contentPrefsData, 
    isLoading: isContentPrefsLoading,
    isError: isContentPrefsError
  } = useQuery({
    queryKey: ["/api/preferences"]
  });

  // Fetch research parameters
  const { 
    data: researchParamsData, 
    isLoading: isResearchParamsLoading,
    isError: isResearchParamsError
  } = useQuery({
    queryKey: ["/api/research-parameters"]
  });
  
  // Handle errors
  useEffect(() => {
    if (isApiSettingsError) {
      toast({
        title: "Error",
        description: "Failed to load API settings.",
        variant: "destructive",
      });
    }
    
    if (isContentPrefsError) {
      toast({
        title: "Error",
        description: "Failed to load content preferences.",
        variant: "destructive",
      });
    }
    
    if (isResearchParamsError) {
      toast({
        title: "Error",
        description: "Failed to load research parameters.",
        variant: "destructive",
      });
    }
  }, [isApiSettingsError, isContentPrefsError, isResearchParamsError, toast]);

  useEffect(() => {
    if (apiSettingsData) {
      setApiSettings(apiSettingsData);
    }
  }, [apiSettingsData]);

  useEffect(() => {
    if (contentPrefsData) {
      setContentPrefs(contentPrefsData);
    }
  }, [contentPrefsData]);

  useEffect(() => {
    if (researchParamsData) {
      setResearchParams(researchParamsData);
    }
  }, [researchParamsData]);

  useEffect(() => {
    setIsLoading(isApiSettingsLoading || isContentPrefsLoading || isResearchParamsLoading);
  }, [isApiSettingsLoading, isContentPrefsLoading, isResearchParamsLoading]);

  return (
    <SettingsContext.Provider
      value={{
        apiSettings,
        setApiSettings,
        contentPrefs,
        setContentPrefs,
        researchParams,
        setResearchParams,
        isLoading,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
