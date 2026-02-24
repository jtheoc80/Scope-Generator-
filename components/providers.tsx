'use client';

import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { LanguageProvider } from "@/hooks/useLanguage";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { AnalyticsIdentify } from "@/components/AnalyticsIdentify";

// Ensure QueryClientProvider always has a client, even during SSR/SSG
// This prevents "No QueryClient set" errors during static generation
export function Providers({ children }: { children: React.ReactNode }) {
  // Use the shared queryClient instance
  // This ensures QueryClientProvider is always available during static generation
  const client: QueryClient = queryClient;

  return (
    <QueryClientProvider client={client}>
      <LanguageProvider>
        <TooltipProvider>
          <Toaster />
          <AnalyticsIdentify />
          {children}
        </TooltipProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}
