'use client';
import { useAuth as useClerkAuth } from "@clerk/nextjs";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

interface User {
  id: string;
  username: string;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
  isPro: boolean;
  subscriptionPlan: string | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  proposalCredits: number;
  creditsExpireAt: string | null;
  companyName: string | null;
  companyAddress: string | null;
  companyPhone: string | null;
  companyLogo: string | null;
  licenseNumber: string | null;
  priceMultiplier: number;
  tradeMultipliers: Record<string, number> | null;
  selectedTrades: string[] | null;
  userStripeEnabled: boolean;
  hasStripeKey: boolean;
  emailNotificationsEnabled: boolean;
  smsNotificationsEnabled: boolean;
  onboardingCompleted?: boolean;
  // 60-day free trial fields
  trialEndsAt: string | null;
  hasActiveAccess: boolean; // true if isPro OR in active trial period
  isInTrial: boolean;
  trialDaysRemaining: number;
  cancelAtPeriodEnd?: boolean;
  currentPeriodEnd?: string | null;
  // Dev/staging Crew override (only set in non-production environments)
  isDevCrewOverride?: boolean;
  devOverrideReason?: 'dev_email_allowlist' | 'dev_force_flag' | null;
}

export function useAuth() {
  const { isLoaded: clerkLoaded, isSignedIn } = useClerkAuth();
  const queryClient = useQueryClient();

  // Always call useQuery unconditionally (React hooks rule)
  // QueryClientProvider must be available via Providers component in root layout
  const { data: user, isLoading: queryLoading, error, refetch } = useQuery<User | null>({
    queryKey: ["/api/auth/user"],
    retry: false,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    enabled: typeof window !== "undefined" && clerkLoaded && !!isSignedIn,
  });

  useEffect(() => {
    if (clerkLoaded && isSignedIn) {
      refetch();
    }
  }, [clerkLoaded, isSignedIn, refetch]);

  if (typeof window === "undefined") {
    return {
      user: null,
      isLoading: true,
      error: null,
      isAuthenticated: false,
      refetch: async () => null,
      refreshUser: async () => null,
    };
  }

  const isLoading = !clerkLoaded || (!!isSignedIn && queryLoading);

  const refreshUser = async () => {
    // Force refetch with skipCache=true and directly update the query cache
    try {
      const res = await fetch('/api/auth/user?skipCache=true');
      if (res.ok) {
        const freshUser = await res.json();
        // Directly set the fresh data in the query cache
        queryClient.setQueryData(["/api/auth/user"], freshUser);
        return freshUser;
      }
    } catch (error) {
      console.error('Failed to force refresh user:', error);
    }
    return null;
  };

  return {
    user: user ?? null,
    isLoading,
    error,
    isAuthenticated: !!user,
    refetch,
    refreshUser,
  };
}