import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import "./index.css";
import { SettingsProvider } from "./contexts/settings-context";
import { ContentProvider } from "./contexts/content-context";
import { queryClient } from "./lib/queryClient";

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <SettingsProvider>
      <ContentProvider>
        <App />
      </ContentProvider>
    </SettingsProvider>
  </QueryClientProvider>
);
