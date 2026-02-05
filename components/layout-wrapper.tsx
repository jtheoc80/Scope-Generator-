'use client';

import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import Layout from "@/components/layout";

/**
 * Wrapper component that ensures QueryClientProvider is available
 * before rendering Layout component. This prevents "No QueryClient set" errors
 * during static generation.
 */
export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <Layout>{children}</Layout>
    </QueryClientProvider>
  );
}
