'use client';

import { useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';

declare global {
  interface Window {
    clarity: ((...args: unknown[]) => void) & { q?: unknown[] };
    gtag: (...args: unknown[]) => void;
  }
}

/**
 * AnalyticsIdentify - Links authenticated user identity & billing status
 * to session recording and analytics platforms (Clarity, GA4).
 *
 * This enables filtering recordings/analytics by:
 *   - Free trial users vs paid users
 *   - Subscription plan (pro, crew, starter)
 *   - Trial days remaining
 *   - Onboarding completion status
 *
 * Place inside <Providers> so it has access to the auth context.
 */
export function AnalyticsIdentify() {
  const { user, isLoading } = useAuth();
  const lastIdentifiedUserId = useRef<string | null>(null);

  useEffect(() => {
    if (isLoading || !user) return;

    // Avoid re-identifying the same user on every render
    if (lastIdentifiedUserId.current === user.id) return;
    lastIdentifiedUserId.current = user.id;

    // Build common properties
    const billingStatus = user.isPro
      ? 'paid'
      : user.isInTrial
        ? 'free_trial'
        : 'free';

    const plan = user.subscriptionPlan || (user.isInTrial ? 'trial' : 'none');

    // ── Microsoft Clarity ─────────────────────────────────
    if (typeof window.clarity === 'function') {
      // Identify the user so recordings can be searched by user ID
      window.clarity('identify', user.id);

      // Tag the session with billing & trial properties
      window.clarity('set', 'billing_status', billingStatus);
      window.clarity('set', 'plan', plan);
      window.clarity('set', 'is_free_trial', String(user.isInTrial));
      window.clarity('set', 'trial_days_remaining', String(user.trialDaysRemaining));
      window.clarity('set', 'onboarding_completed', String(user.onboardingCompleted ?? false));

      if (user.isInTrial && user.trialEndsAt) {
        window.clarity('set', 'trial_ends_at', user.trialEndsAt);
      }
    }

    // ── Google Analytics 4 ────────────────────────────────
    if (typeof window.gtag === 'function') {
      // Set persistent user properties for GA4 audience building & reporting
      window.gtag('set', 'user_properties', {
        billing_status: billingStatus,
        plan: plan,
        is_free_trial: user.isInTrial,
        trial_days_remaining: user.trialDaysRemaining,
        onboarding_completed: user.onboardingCompleted ?? false,
      });

      // Also set the GA4 user_id for cross-device tracking
      window.gtag('set', { user_id: user.id });
    }
  }, [user, isLoading]);

  // This component renders nothing — it only produces side effects
  return null;
}
