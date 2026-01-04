'use client';

import { useEffect, useState, useCallback } from 'react';
import { 
  Crown, 
  CreditCard, 
  Clock, 
  AlertTriangle, 
  CheckCircle2,
  RefreshCw,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

/**
 * Billing Status Types (matching API response)
 */
export interface BillingStatusData {
  hasActiveSubscription: boolean;
  canAccessPremiumFeatures: boolean;
  plan: 'free' | 'starter' | 'pro' | 'crew';
  status: 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid' | 'incomplete' | 'incomplete_expired' | 'paused' | 'none';
  currentPeriodEnd: string | null;
  isTrialing: boolean;
  trialEndsAt: string | null;
  availableCredits: number;
  creditsExpireAt: string | null;
  cancelAtPeriodEnd: boolean;
  stripeCustomerId: string | null;
  fetchedAt?: string;
  testMode?: boolean;
}

/**
 * Billing Status Component
 * 
 * Displays canonical billing status from the API.
 * Features:
 * - Real-time status from /api/billing/status
 * - Clear status indicators (active, trialing, past_due, etc.)
 * - Test hooks for E2E testing
 * - Manual refresh capability
 * - Link to manage subscription
 */

interface BillingStatusProps {
  /** Compact display mode */
  compact?: boolean;
  /** Show manage subscription link */
  showManageLink?: boolean;
  /** Callback when user clicks manage subscription */
  onManageClick?: () => void;
  /** CSS class name */
  className?: string;
  /** Auto-refresh interval in ms (0 to disable) */
  refreshInterval?: number;
}

export default function BillingStatus({
  compact = false,
  showManageLink = true,
  onManageClick,
  className,
  refreshInterval = 0,
}: BillingStatusProps) {
  const [status, setStatus] = useState<BillingStatusData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchStatus = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const response = await fetch('/api/billing/status', {
        method: 'GET',
        credentials: 'include',
        // Force no cache
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Please sign in to view billing status');
        }
        throw new Error('Failed to fetch billing status');
      }

      const data = await response.json();
      setStatus(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Auto-refresh interval
  useEffect(() => {
    if (refreshInterval > 0) {
      const interval = setInterval(() => fetchStatus(), refreshInterval);
      return () => clearInterval(interval);
    }
  }, [refreshInterval, fetchStatus]);

  const handleManageSubscription = useCallback(async () => {
    if (onManageClick) {
      onManageClick();
      return;
    }

    // Default: open Stripe portal
    try {
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
        credentials: 'include',
      });
      
      const data = await response.json();
      
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error('Failed to open billing portal:', err);
    }
  }, [onManageClick]);

  // Render loading state
  if (isLoading) {
    return (
      <div 
        className={cn("flex items-center gap-2 p-3 rounded-lg bg-slate-50", className)}
        data-testid="billing-status"
        data-status="loading"
      >
        <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
        <span className="text-sm text-slate-500">Loading billing status...</span>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div 
        className={cn("flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200", className)}
        data-testid="billing-status"
        data-status="error"
      >
        <AlertTriangle className="w-4 h-4 text-red-500" />
        <span className="text-sm text-red-700">{error}</span>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => fetchStatus()}
          className="ml-auto"
        >
          <RefreshCw className="w-3 h-3" />
        </Button>
      </div>
    );
  }

  if (!status) {
    return null;
  }

  // Determine display state
  const statusConfig = getStatusConfig(status);

  // Compact mode
  if (compact) {
    return (
      <div 
        className={cn("flex items-center gap-2", className)}
        data-testid="billing-status"
        data-status={status.status}
        data-plan={status.plan}
        data-has-access={status.canAccessPremiumFeatures}
      >
        <Badge 
          variant={statusConfig.badgeVariant as any}
          className={cn("flex items-center gap-1", statusConfig.badgeClass)}
        >
          {statusConfig.icon}
          {statusConfig.label}
        </Badge>
        {status.availableCredits > 0 && (
          <Badge variant="outline" className="text-xs">
            {status.availableCredits} credits
          </Badge>
        )}
      </div>
    );
  }

  // Full mode
  return (
    <div 
      className={cn(
        "rounded-lg border p-4",
        statusConfig.containerClass,
        className
      )}
      data-testid="billing-status"
      data-status={status.status}
      data-plan={status.plan}
      data-has-access={status.canAccessPremiumFeatures}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center",
            statusConfig.iconBgClass
          )}>
            {statusConfig.icon}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-slate-900">{statusConfig.title}</h3>
              <Badge 
                variant={statusConfig.badgeVariant as any}
                className={statusConfig.badgeClass}
              >
                {statusConfig.label}
              </Badge>
            </div>
            <p className="text-sm text-slate-600 mt-0.5">{statusConfig.description}</p>
            
            {/* Period end info */}
            {status.currentPeriodEnd && status.hasActiveSubscription && (
              <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {status.cancelAtPeriodEnd 
                  ? `Access until ${formatDate(status.currentPeriodEnd)}`
                  : `Renews ${formatDate(status.currentPeriodEnd)}`}
              </p>
            )}
            
            {/* Trial end info */}
            {status.isTrialing && status.trialEndsAt && (
              <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Trial ends {formatDate(status.trialEndsAt)}
              </p>
            )}
            
            {/* Credits info */}
            {status.availableCredits > 0 && (
              <p className="text-xs text-slate-500 mt-2">
                {status.availableCredits} proposal credit{status.availableCredits !== 1 ? 's' : ''} available
                {status.creditsExpireAt && ` (expires ${formatDate(status.creditsExpireAt)})`}
              </p>
            )}

            {/* Test mode indicator */}
            {status.testMode && (
              <Badge variant="outline" className="mt-2 text-xs bg-yellow-50 text-yellow-700 border-yellow-200">
                Test Mode
              </Badge>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Refresh button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fetchStatus(true)}
            disabled={isRefreshing}
            className="text-slate-400 hover:text-slate-600"
          >
            <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
          </Button>
          
          {/* Manage subscription link */}
          {showManageLink && status.stripeCustomerId && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleManageSubscription}
              data-testid="manage-subscription"
            >
              Manage
              <ExternalLink className="w-3 h-3 ml-1" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Get display configuration based on billing status
 */
function getStatusConfig(status: BillingStatusData) {
  if (status.status === 'active') {
    return {
      icon: <Crown className="w-5 h-5 text-primary" />,
      title: `${capitalize(status.plan)} Plan`,
      label: 'Active',
      description: 'You have full access to all features.',
      badgeVariant: 'default',
      badgeClass: 'bg-green-500 hover:bg-green-600',
      containerClass: 'bg-green-50 border-green-200',
      iconBgClass: 'bg-green-100',
    };
  }

  if (status.status === 'trialing') {
    return {
      icon: <Clock className="w-5 h-5 text-blue-500" />,
      title: 'Trial Period',
      label: 'Trialing',
      description: 'Explore all features during your trial.',
      badgeVariant: 'secondary',
      badgeClass: 'bg-blue-500 text-white hover:bg-blue-600',
      containerClass: 'bg-blue-50 border-blue-200',
      iconBgClass: 'bg-blue-100',
    };
  }

  if (status.status === 'past_due') {
    return {
      icon: <AlertTriangle className="w-5 h-5 text-amber-500" />,
      title: 'Payment Required',
      label: 'Past Due',
      description: 'Please update your payment method to continue access.',
      badgeVariant: 'destructive',
      badgeClass: 'bg-amber-500 hover:bg-amber-600',
      containerClass: 'bg-amber-50 border-amber-200',
      iconBgClass: 'bg-amber-100',
    };
  }

  if (status.status === 'canceled') {
    return {
      icon: <CreditCard className="w-5 h-5 text-slate-400" />,
      title: 'Subscription Canceled',
      label: 'Canceled',
      description: status.currentPeriodEnd 
        ? 'You have access until the end of your billing period.'
        : 'Your subscription has ended.',
      badgeVariant: 'outline',
      badgeClass: 'text-slate-600',
      containerClass: 'bg-slate-50 border-slate-200',
      iconBgClass: 'bg-slate-100',
    };
  }

  // Default / free / no subscription
  if (status.availableCredits > 0) {
    return {
      icon: <CheckCircle2 className="w-5 h-5 text-green-500" />,
      title: 'Pay As You Go',
      label: `${status.availableCredits} Credits`,
      description: 'Use your credits to create proposals.',
      badgeVariant: 'secondary',
      badgeClass: 'bg-slate-600 hover:bg-slate-700',
      containerClass: 'bg-slate-50 border-slate-200',
      iconBgClass: 'bg-slate-100',
    };
  }

  return {
    icon: <CreditCard className="w-5 h-5 text-slate-400" />,
    title: 'Free Plan',
    label: 'Free',
    description: 'Upgrade to access premium features.',
    badgeVariant: 'outline',
    badgeClass: 'text-slate-500',
    containerClass: 'bg-slate-50 border-slate-200',
    iconBgClass: 'bg-slate-100',
  };
}

/**
 * Format date for display
 */
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
  });
}

/**
 * Capitalize first letter
 */
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Hook to fetch billing status
 */
export function useBillingStatus(refreshInterval = 0) {
  const [status, setStatus] = useState<BillingStatusData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/billing/status', {
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch billing status');
      }

      const data = await response.json();
      setStatus(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  useEffect(() => {
    if (refreshInterval > 0) {
      const interval = setInterval(refetch, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [refreshInterval, refetch]);

  return {
    status,
    isLoading,
    error,
    refetch,
    hasAccess: status?.canAccessPremiumFeatures ?? false,
    isActive: status?.hasActiveSubscription ?? false,
  };
}
