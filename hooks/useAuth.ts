'use client';
import { useQuery } from "@tanstack/react-query";

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
}

export function useAuth() {
  const { data: user, isLoading, refetch } = useQuery<User | null>({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    refetch,
  };
}
