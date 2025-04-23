import { useEffect } from "react";
import { FileText, Instagram, Linkedin, Image } from "lucide-react";
import { useContent } from "@/contexts/content-context";
import { StatsCard } from "@/components/dashboard/stats-card";
import { ResearchParameters } from "@/components/dashboard/research-parameters";
import { RecentContent } from "@/components/dashboard/recent-content";
import { ContentImport } from "@/components/dashboard/content-import";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const { stats, isLoading } = useContent();
  
  return (
    <section className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Dashboard</h2>
        <p className="text-slate-600">Monitor your content creation and publication metrics</p>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {isLoading ? (
          <>
            <Card>
              <CardContent className="p-4">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-16 mb-1" />
                <Skeleton className="h-3 w-28" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-16 mb-1" />
                <Skeleton className="h-3 w-28" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-16 mb-1" />
                <Skeleton className="h-3 w-28" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-16 mb-1" />
                <Skeleton className="h-3 w-28" />
              </CardContent>
            </Card>
          </>
        ) : (
          <>
            <StatsCard
              title="Articles Generated"
              value={stats.articles}
              change={{ value: stats.articlesGrowth, isPositive: true }}
              icon={<FileText className="h-5 w-5" />}
              iconBgColor="bg-primary-50"
              iconColor="text-primary-500"
            />
            
            <StatsCard
              title="Instagram Posts"
              value={stats.instagram}
              change={{ value: stats.instagramGrowth, isPositive: true }}
              icon={<Instagram className="h-5 w-5" />}
              iconBgColor="bg-pink-50"
              iconColor="text-pink-500"
            />
            
            <StatsCard
              title="LinkedIn Posts"
              value={stats.linkedin}
              change={{ value: stats.linkedinGrowth, isPositive: false }}
              icon={<Linkedin className="h-5 w-5" />}
              iconBgColor="bg-blue-50"
              iconColor="text-blue-500"
            />
            
            <StatsCard
              title="Images Used"
              value={stats.images}
              change={{ value: stats.imagesGrowth, isPositive: true }}
              icon={<Image className="h-5 w-5" />}
              iconBgColor="bg-green-50"
              iconColor="text-green-500"
            />
          </>
        )}
      </div>
      
      {/* Content Import */}
      <ContentImport />
      
      {/* Research Parameters */}
      <ResearchParameters />
      
      {/* Recent Content */}
      <RecentContent />
    </section>
  );
}
