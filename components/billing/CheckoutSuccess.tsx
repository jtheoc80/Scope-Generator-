'use client';

import { useEffect, useState, useCallback } from 'react';
import { 
  CheckCircle2, 
  Loader2, 
  AlertCircle,
  Crown,
  Zap,
  RefreshCw,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { trackGoogleAdsConversion } from '@/lib/analytics';

/**
 * Checkout Success Component
 * 
 * Displays success state after Stripe checkout redirect.
 * Features:
 * - Verifies session with backend
 * - Shows loading while verifying
 * - Displays purchase confirmation
 * - Updates billing status deterministically
 * - Provides clear next steps
 */

interface CheckoutSuccessProps {
  sessionId: string;
  onComplete?: () => void;
  onDismiss?: () => void;
}

interface VerificationResult {
  verified: boolean;
  purchaseType: 'subscription' | 'credits';
  creditsAdded?: number;
  planActivated?: string;
  alreadyProcessed: boolean;
  billingStatus?: {
    hasActiveSubscription: boolean;
    canAccessPremiumFeatures: boolean;
    plan: string;
    status: string;
    availableCredits: number;
  };
  proposalCredits?: number;
  isPro?: boolean;
  subscriptionPlan?: string;
}

type VerificationState = 'verifying' | 'success' | 'error' | 'already_processed';

export default function CheckoutSuccess({
  sessionId,
  onComplete,
  onDismiss,
}: CheckoutSuccessProps) {
  const [state, setState] = useState<VerificationState>('verifying');
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const verifySession = useCallback(async () => {
    setState('verifying');
    setError(null);

    try {
      const response = await fetch('/api/stripe/verify-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ sessionId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to verify session');
      }

      const data: VerificationResult = await response.json();
      setResult(data);

      if (data.alreadyProcessed) {
        setState('already_processed');
      } else {
        setState('success');
        // Track Google Ads conversion for new purchases
        trackGoogleAdsConversion(sessionId, data.billingStatus?.availableCredits);
      }

      // Notify parent after short delay to let user see success
      setTimeout(() => {
        onComplete?.();
      }, 3000);
    } catch (err) {
      console.error('Session verification error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setState('error');
    }
  }, [sessionId, onComplete]);

  useEffect(() => {
    verifySession();
  }, [verifySession]);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    verifySession();
  };

  // Verifying state
  if (state === 'verifying') {
    return (
      <div 
        className="bg-white rounded-2xl shadow-lg p-8 text-center max-w-md mx-auto"
        data-testid="checkout-success"
        data-state="verifying"
      >
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">
          Verifying your purchase...
        </h2>
        <p className="text-slate-600 text-sm">
          Please wait while we confirm your payment.
        </p>
      </div>
    );
  }

  // Error state
  if (state === 'error') {
    return (
      <div 
        className="bg-white rounded-2xl shadow-lg p-8 text-center max-w-md mx-auto"
        data-testid="checkout-success"
        data-state="error"
      >
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">
          Verification Issue
        </h2>
        <p className="text-slate-600 text-sm mb-4">
          {error || 'We had trouble confirming your purchase. Your payment was likely successful.'}
        </p>
        <p className="text-slate-500 text-xs mb-4">
          If you were charged, your access will be activated shortly. You can also try refreshing the page.
        </p>
        <div className="flex gap-3 justify-center">
          <Button 
            variant="outline" 
            onClick={handleRetry}
            disabled={retryCount >= 3}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
          <Button onClick={onDismiss}>
            Continue
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    );
  }

  // Success state
  const isSubscription = result?.purchaseType === 'subscription';
  const isPro = result?.isPro || result?.billingStatus?.hasActiveSubscription;

  return (
    <div 
      className="bg-white rounded-2xl shadow-lg p-8 text-center max-w-md mx-auto"
      data-testid="checkout-success"
      data-state={state}
      data-purchase-type={result?.purchaseType}
    >
      {/* Success Icon */}
      <div className={cn(
        "w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6",
        isSubscription ? "bg-gradient-to-br from-yellow-100 to-amber-100" : "bg-green-100"
      )}>
        {isSubscription ? (
          <Crown className="w-10 h-10 text-yellow-600" />
        ) : (
          <CheckCircle2 className="w-10 h-10 text-green-600" />
        )}
      </div>

      {/* Title */}
      <h2 className="text-2xl font-bold text-slate-900 mb-2">
        {state === 'already_processed' 
          ? 'Purchase Already Confirmed'
          : isSubscription 
            ? `Welcome to ${result?.planActivated ? capitalize(result.planActivated) : 'Pro'}!`
            : 'Purchase Successful!'
        }
      </h2>

      {/* Description */}
      <p className="text-slate-600 mb-6">
        {isSubscription ? (
          <>
            Your subscription is now active. Enjoy full access to all premium features.
          </>
        ) : result?.creditsAdded ? (
          <>
            <span className="font-semibold text-green-600">{result.creditsAdded} credit{result.creditsAdded !== 1 ? 's' : ''}</span>
            {' '}added to your account.
          </>
        ) : (
          'Your purchase has been confirmed.'
        )}
      </p>

      {/* Status Summary */}
      <div className="bg-slate-50 rounded-lg p-4 mb-6">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Your Account</h3>
        <div className="space-y-2 text-sm">
          {isPro && (
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Status</span>
              <span className="font-medium text-green-600 flex items-center gap-1">
                <Crown className="w-4 h-4" />
                {result?.billingStatus?.plan ? capitalize(result.billingStatus.plan) : 'Pro'} Active
              </span>
            </div>
          )}
          {(result?.proposalCredits || result?.billingStatus?.availableCredits) ? (
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Available Credits</span>
              <span className="font-medium text-slate-900 flex items-center gap-1">
                <Zap className="w-4 h-4 text-amber-500" />
                {result?.proposalCredits || result?.billingStatus?.availableCredits || 0}
              </span>
            </div>
          ) : null}
        </div>
      </div>

      {/* CTA */}
      <Button 
        onClick={onDismiss} 
        className="w-full"
        data-testid="checkout-success-continue"
      >
        Start Creating Proposals
        <ArrowRight className="w-4 h-4 ml-2" />
      </Button>

      {/* Fine print for already processed */}
      {state === 'already_processed' && (
        <p className="text-xs text-slate-500 mt-4">
          This purchase was already applied to your account.
        </p>
      )}
    </div>
  );
}

/**
 * Inline success banner for dashboard
 */
export function CheckoutSuccessBanner({
  sessionId,
  onDismiss,
}: {
  sessionId: string;
  onDismiss: () => void;
}) {
  const [verified, setVerified] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);

  useEffect(() => {
    const verify = async () => {
      try {
        const response = await fetch('/api/stripe/verify-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ sessionId }),
        });

        if (response.ok) {
          const data = await response.json();
          setResult(data);
          setVerified(true);
          // Track Google Ads conversion for new purchases
          if (!data.alreadyProcessed) {
            trackGoogleAdsConversion(sessionId, data.billingStatus?.availableCredits);
          }
        }
      } catch (err) {
        console.error('Verification error:', err);
        setVerified(true); // Still show success UI
      }
    };

    verify();
  }, [sessionId]);

  if (!verified) {
    return (
      <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 flex items-center gap-3">
        <Loader2 className="w-5 h-5 text-primary animate-spin" />
        <span className="text-sm text-primary font-medium">Confirming your purchase...</span>
      </div>
    );
  }

  return (
    <div 
      className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-between"
      data-testid="checkout-success-banner"
    >
      <div className="flex items-center gap-3">
        <CheckCircle2 className="w-5 h-5 text-green-600" />
        <div>
          <p className="text-sm font-medium text-green-800">
            Payment successful!
          </p>
          {result?.creditsAdded && result.creditsAdded > 0 && (
            <p className="text-xs text-green-600">
              {result.creditsAdded} credit{result.creditsAdded !== 1 ? 's' : ''} added to your account.
            </p>
          )}
          {result?.planActivated && (
            <p className="text-xs text-green-600">
              Your {capitalize(result.planActivated)} subscription is now active.
            </p>
          )}
        </div>
      </div>
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={onDismiss}
        className="text-green-700 hover:text-green-900"
      >
        Dismiss
      </Button>
    </div>
  );
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
