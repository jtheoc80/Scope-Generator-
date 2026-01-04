'use client';

import { useState, useCallback } from "react";
import { 
  Lock, 
  Check, 
  Loader2, 
  Zap, 
  Crown, 
  Users, 
  Shield, 
  Star,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Premium Paywall Component
 * 
 * Features:
 * - Beautiful, conversion-optimized design
 * - Clear pricing and trial messaging
 * - Loading states and error retry
 * - Test hooks for E2E testing (data-testid attributes)
 * - Subscription and one-time purchase options
 */

interface PaywallProps {
  isOpen: boolean;
  onClose: () => void;
  /** Which feature triggered the paywall (for messaging) */
  feature?: string;
  /** Callback after successful checkout redirect */
  onCheckoutStart?: () => void;
}

type PricingPlan = 'starter' | 'pro' | 'crew';

interface PlanDetails {
  id: PricingPlan;
  name: string;
  price: number;
  period: string;
  description: string;
  features: string[];
  highlight?: string;
  popular?: boolean;
}

const PLANS: PlanDetails[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: 9,
    period: 'one-time',
    description: 'Perfect for trying out or occasional use',
    features: [
      '1 professional proposal',
      'Full PDF export',
      'Client-ready formatting',
      'No expiration',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 29,
    period: 'month',
    description: 'Best for active contractors',
    features: [
      'Up to 15 proposals/month',
      'Less than $2 per proposal',
      'Priority support',
      'Market pricing insights',
      'Cancel anytime',
    ],
    highlight: 'MOST POPULAR',
    popular: true,
  },
  {
    id: 'crew',
    name: 'Crew',
    price: 79,
    period: 'month',
    description: 'For teams and high-volume users',
    features: [
      'Up to 50 proposals/month',
      'Team member seats',
      'Company branding',
      'Analytics dashboard',
      'Priority support',
    ],
  },
];

export default function Paywall({ 
  isOpen, 
  onClose, 
  feature,
  onCheckoutStart,
}: PaywallProps) {
  const [selectedPlan, setSelectedPlan] = useState<PricingPlan>('pro');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheckout = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          productType: selectedPlan,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to start checkout');
      }
      
      if (data.url) {
        onCheckoutStart?.();
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      setError(err instanceof Error ? err.message : 'Failed to start checkout. Please try again.');
      setIsLoading(false);
    }
  }, [selectedPlan, onCheckoutStart]);

  const selectedPlanDetails = PLANS.find(p => p.id === selectedPlan)!;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="sm:max-w-2xl border-none shadow-2xl p-0 overflow-hidden max-h-[90vh] overflow-y-auto"
        data-testid="paywall"
      >
        {/* Header */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 text-center text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-60"></div>
          
          <div className="relative z-10">
            <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm border border-white/20">
              <Crown className="w-8 h-8 text-yellow-400" />
            </div>
            <DialogTitle className="text-2xl font-heading font-bold mb-2">
              Unlock Professional Proposals
            </DialogTitle>
            <DialogDescription className="text-slate-300 text-sm">
              {feature 
                ? `Upgrade to access ${feature} and create winning proposals`
                : 'Choose the plan that fits your business'}
            </DialogDescription>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div 
            className="bg-red-50 border-l-4 border-red-400 p-4 flex items-start gap-3"
            data-testid="paywall-error"
          >
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-red-700">{error}</p>
              <button 
                onClick={() => setError(null)}
                className="text-sm text-red-600 underline mt-1 hover:text-red-800"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Pricing Plans */}
        <div className="p-6 bg-white">
          <div className="grid gap-4 md:grid-cols-3" data-testid="pricing-plans">
            {PLANS.map((plan) => (
              <div 
                key={plan.id}
                data-testid={`plan-${plan.id}`}
                onClick={() => setSelectedPlan(plan.id)}
                className={cn(
                  "relative border rounded-xl p-4 cursor-pointer transition-all",
                  selectedPlan === plan.id
                    ? "border-primary bg-primary/5 shadow-md ring-2 ring-primary/20"
                    : "border-slate-200 hover:border-slate-300",
                  plan.popular && "md:-mt-2 md:mb-2"
                )}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm whitespace-nowrap">
                    {plan.highlight}
                  </div>
                )}
                
                <div className="text-center mb-4">
                  <h3 className="font-bold text-slate-900 text-lg">{plan.name}</h3>
                  <div className="mt-2">
                    <span className="text-3xl font-heading font-bold text-slate-900">
                      ${plan.price}
                    </span>
                    <span className="text-slate-500 text-sm">
                      /{plan.period}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{plan.description}</p>
                </div>
                
                <ul className="space-y-2">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                      <Check className={cn(
                        "w-4 h-4 shrink-0 mt-0.5",
                        selectedPlan === plan.id ? "text-primary" : "text-green-500"
                      )} />
                      {feature}
                    </li>
                  ))}
                </ul>
                
                {/* Selection indicator */}
                <div className={cn(
                  "mt-4 py-2 text-center text-sm font-medium rounded-lg transition-colors",
                  selectedPlan === plan.id
                    ? "bg-primary text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                )}>
                  {selectedPlan === plan.id ? 'Selected' : 'Select'}
                </div>
              </div>
            ))}
          </div>

          {/* Trust Section */}
          <div className="mt-6 flex items-center justify-center gap-6 py-3 border-y border-slate-100">
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Users className="w-4 h-4 text-primary" />
              <span><strong className="text-slate-700">15,000+</strong> proposals</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span><strong className="text-slate-700">4.9</strong> rating</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Shield className="w-4 h-4 text-green-500" />
              <span>Secure checkout</span>
            </div>
          </div>

          {/* CTA Button */}
          <Button 
            data-testid="start-checkout"
            onClick={handleCheckout}
            disabled={isLoading}
            className={cn(
              "w-full mt-6 font-bold py-6 text-lg shadow-lg transition-all",
              selectedPlanDetails.popular
                ? "bg-primary hover:bg-primary/90 text-white shadow-primary/20"
                : "bg-slate-900 hover:bg-slate-800 text-white"
            )}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                {selectedPlan === 'starter' ? (
                  <>
                    <Zap className="w-5 h-5 mr-2" />
                    Get Started for ${selectedPlanDetails.price}
                  </>
                ) : (
                  <>
                    <Crown className="w-5 h-5 mr-2" />
                    Subscribe to {selectedPlanDetails.name} - ${selectedPlanDetails.price}/{selectedPlanDetails.period}
                  </>
                )}
              </>
            )}
          </Button>

          {/* Retry Button (shown after error) */}
          {error && (
            <Button
              variant="outline"
              onClick={handleCheckout}
              disabled={isLoading}
              className="w-full mt-3"
              data-testid="checkout-retry"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          )}
          
          {/* Fine Print */}
          <p className="text-center text-xs text-slate-500 mt-4">
            {selectedPlan === 'starter' 
              ? 'One-time purchase. No subscription required.'
              : 'Cancel anytime. No long-term commitment.'}
            {' '}Secure payment via Stripe.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Simple paywall trigger button that shows the paywall modal
 */
export function PaywallTrigger({ 
  children, 
  feature,
  className,
}: { 
  children: React.ReactNode;
  feature?: string;
  className?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={className}
        data-testid="paywall-trigger"
      >
        {children}
      </button>
      <Paywall 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)}
        feature={feature}
      />
    </>
  );
}
