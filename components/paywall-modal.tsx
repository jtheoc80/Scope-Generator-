'use client';
import { useState } from "react";
import { Lock, Check, Loader2, Zap, Package, Shield, Star, Users } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type PricingOption = 'single' | 'pack';

export default function PaywallModal({ isOpen, onClose }: PaywallModalProps) {
  const [selectedOption, setSelectedOption] = useState<PricingOption>('pack');
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const handleCheckout = async () => {
    setCheckoutLoading(true);
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          productType: selectedOption 
        }),
      });
      
      const data = await response.json();
      
      if (data.url) {
        window.location.href = data.url;
      } else if (data.message) {
        alert(data.message);
      } else {
        console.error('No checkout URL returned');
        alert('Failed to start checkout. Please try again.');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Failed to start checkout. Please try again.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg border-none shadow-2xl p-0 overflow-hidden" data-testid="paywall-modal">
        <div className="bg-slate-900 p-6 text-center text-white relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-secondary to-transparent opacity-50"></div>
          <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
            <Lock className="w-8 h-8 text-secondary" />
          </div>
          <DialogTitle className="text-2xl font-heading font-bold mb-2">Unlock Full Proposal</DialogTitle>
          <p className="text-slate-300 text-sm">
            Get the complete, unblurred PDF and editable text to send to your client immediately.
          </p>
        </div>

        <div className="p-6 bg-white">
          <div className="grid gap-4">
            <div 
              data-testid="option-single"
              onClick={() => setSelectedOption('single')}
              className={`border rounded-xl p-5 flex items-start gap-4 hover:border-primary transition-all cursor-pointer group ${
                selectedOption === 'single' ? 'border-primary bg-primary/5 shadow-md' : 'border-slate-200'
              }`}
            >
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 ${
                selectedOption === 'single' ? 'bg-primary text-white' : 'bg-slate-100 text-slate-600 group-hover:bg-primary/10'
              }`}>
                <Zap className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-bold text-slate-900 text-lg">Single Pro Proposal</h4>
                  <span className="font-heading font-bold text-2xl text-primary whitespace-nowrap">
                    $12
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Perfect for one-off jobs. Unlock this proposal instantly.
                </p>
              </div>
            </div>

            <div 
              data-testid="option-pack"
              onClick={() => setSelectedOption('pack')}
              className={`border-2 rounded-xl p-5 flex items-start gap-4 relative cursor-pointer ${
                selectedOption === 'pack' ? 'border-secondary bg-orange-50/50 shadow-lg' : 'border-secondary/40 bg-orange-50/20'
              }`}
            >
              <div className="absolute -top-3 left-4 bg-secondary text-secondary-foreground text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                BEST VALUE - SAVE 67%
              </div>
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 ${
                selectedOption === 'pack' ? 'bg-secondary text-white' : 'bg-orange-100 text-secondary'
              }`}>
                <Package className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-bold text-slate-900 text-lg">Contractor Pack</h4>
                  <div className="text-right whitespace-nowrap">
                    <span className="font-heading font-bold text-2xl text-secondary">$39</span>
                    <span className="text-sm text-muted-foreground ml-1 line-through">$120</span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  <span className="font-semibold text-secondary">10 proposal credits</span> • Valid for 6 months
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Just $3.90 per proposal - ideal for busy contractors
                </p>
              </div>
            </div>
          </div>

          {/* Before/After Visual Comparison */}
          <div className="mt-6 rounded-lg border border-slate-200 overflow-hidden">
            <div className="grid grid-cols-2">
              <div className="p-4 bg-slate-50 border-r border-slate-200 text-center">
                <div className="text-xs text-slate-500 uppercase font-semibold mb-2">Before</div>
                <div className="bg-white rounded p-3 shadow-inner relative">
                  <div className="h-2 w-full bg-slate-200 rounded mb-2"></div>
                  <div className="h-2 w-3/4 bg-slate-200 rounded mb-2"></div>
                  <div className="h-6 w-full bg-slate-200 rounded blur-sm"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs text-slate-400 font-medium">Blurred</span>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-green-50/50 text-center">
                <div className="text-xs text-green-600 uppercase font-semibold mb-2">After</div>
                <div className="bg-white rounded p-3 shadow-inner">
                  <div className="h-2 w-full bg-primary/30 rounded mb-2"></div>
                  <div className="h-2 w-3/4 bg-primary/30 rounded mb-2"></div>
                  <div className="h-6 w-full bg-green-200 rounded flex items-center justify-center">
                    <span className="text-[10px] text-green-700 font-bold">$4,500 - $6,200</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <ul className="mt-6 space-y-2">
            {[
              "Remove all watermarks & blurs",
              "Export to professional PDF",
              "Save to your dashboard",
              "Email directly to client"
            ].map((item, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-slate-600">
                <Check className="w-4 h-4 text-green-500 shrink-0" /> {item}
              </li>
            ))}
          </ul>

          {/* Trust Badges */}
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
              <span>Secure</span>
            </div>
          </div>

          <Button 
            data-testid="button-unlock"
            onClick={handleCheckout}
            disabled={checkoutLoading}
            className="w-full mt-6 bg-primary hover:bg-primary/90 text-white font-bold py-6 text-lg shadow-lg shadow-primary/20"
          >
            {checkoutLoading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Processing...
              </>
            ) : selectedOption === 'pack' ? (
              'Get 10 Credits for $39'
            ) : (
              'Unlock for $12'
            )}
          </Button>
          
          <p className="text-center text-xs text-muted-foreground mt-4">
            Secure payment via Stripe. One-time purchase, no subscription.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
