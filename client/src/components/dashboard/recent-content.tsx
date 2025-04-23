import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Eye, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { ContentItem } from "@shared/schema";

function formatDate(dateString: string | Date | undefined) {
  if (!dateString) return "";
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "published":
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Published</Badge>;
    case "scheduled":
      return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">Scheduled</Badge>;
    case "draft":
    default:
      return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">Draft</Badge>;
  }
}

export function RecentContent() {
  const { data: contentItems, isLoading, error } = useQuery({
    queryKey: ["/api/content"],
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4 text-slate-800">Recent Content</h3>
          <div className="animate-pulse">
            <div className="h-6 bg-slate-200 rounded w-full mb-4"></div>
            <div className="h-32 bg-slate-200 rounded w-full"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4 text-slate-800">Recent Content</h3>
          <p className="text-red-500">Error loading content. Please try again.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold mb-4 text-slate-800">Recent Content</h3>
        
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Title</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Type</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Date</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {contentItems && contentItems.length > 0 ? (
                contentItems.map((item: ContentItem) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm text-slate-800">{item.title}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{item.type}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{formatDate(item.publishedAt || item.createdAt)}</td>
                    <td className="px-4 py-3 text-sm">
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      <Button variant="ghost" size="icon" className="text-slate-500 hover:text-primary-600 mr-2">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-slate-500 hover:text-primary-600">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>Edit</DropdownMenuItem>
                          <DropdownMenuItem>Publish</DropdownMenuItem>
                          <DropdownMenuItem>Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-4 text-center text-sm text-slate-500">
                    No content items found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
