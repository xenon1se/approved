import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { ContentItem } from "@shared/schema";

type ContentContextType = {
  contentItems: ContentItem[];
  setContentItems: (items: ContentItem[]) => void;
  stats: {
    articles: number;
    articlesGrowth: string;
    instagram: number;
    instagramGrowth: string;
    linkedin: number;
    linkedinGrowth: string;
    images: number;
    imagesGrowth: string;
  };
  isLoading: boolean;
};

const defaultStats = {
  articles: 0,
  articlesGrowth: "0%",
  instagram: 0,
  instagramGrowth: "0%",
  linkedin: 0,
  linkedinGrowth: "0%",
  images: 0,
  imagesGrowth: "0%",
};

const ContentContext = createContext<ContentContextType>({
  contentItems: [],
  setContentItems: () => {},
  stats: defaultStats,
  isLoading: true,
});

export function ContentProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [stats, setStats] = useState(defaultStats);
  const [isLoading, setIsLoading] = useState(true);

  const { data, isLoading: isContentLoading } = useQuery({
    queryKey: ["/api/content"],
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to load content items.",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (data) {
      setContentItems(data);
      
      // Calculate statistics
      const wordpressArticles = data.filter((item: ContentItem) => 
        item.type === "WordPress Article" || item.type === "HTML Article"
      ).length;
      
      const instagramPosts = data.filter((item: ContentItem) => 
        item.type === "Instagram Post"
      ).length;
      
      const linkedinPosts = data.filter((item: ContentItem) => 
        item.type === "LinkedIn Post"
      ).length;
      
      const totalImages = data.reduce((sum: number, item: ContentItem) => 
        sum + (item.images ? (Array.isArray(item.images) ? item.images.length : 0) : 0)
      , 0);
      
      setStats({
        articles: wordpressArticles,
        articlesGrowth: "23%",
        instagram: instagramPosts,
        instagramGrowth: "15%",
        linkedin: linkedinPosts,
        linkedinGrowth: "-5%",
        images: totalImages,
        imagesGrowth: "18%",
      });
    }
  }, [data]);

  useEffect(() => {
    setIsLoading(isContentLoading);
  }, [isContentLoading]);

  return (
    <ContentContext.Provider
      value={{
        contentItems,
        setContentItems,
        stats,
        isLoading,
      }}
    >
      {children}
    </ContentContext.Provider>
  );
}

export function useContent() {
  return useContext(ContentContext);
}
