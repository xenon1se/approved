import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { Sidebar } from "@/components/layout/sidebar";
import { MainContent } from "@/components/layout/main-content";
import Dashboard from "@/pages/dashboard";
import ContentGeneration from "@/pages/content-generation";
import Settings from "@/pages/settings";
import { useEffect, useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";

function Router() {
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <Sidebar />
      <MainContent>
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/content-generation" component={ContentGeneration} />
          <Route path="/settings" component={Settings} />
          <Route component={NotFound} />
        </Switch>
      </MainContent>
    </div>
  );
}

function App() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
