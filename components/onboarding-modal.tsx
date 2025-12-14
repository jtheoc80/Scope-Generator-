'use client';
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

interface OnboardingModalProps {
  open: boolean;
  userName?: string;
}

const TRADES = [
  { value: "bathroom", label: "Bathroom Remodeling" },
  { value: "kitchen", label: "Kitchen Renovation" },
  { value: "plumbing", label: "Plumbing" },
  { value: "electrical", label: "Electrical" },
  { value: "roofing", label: "Roofing" },
  { value: "hvac", label: "HVAC" },
  { value: "painting", label: "Painting" },
  { value: "flooring", label: "Flooring" },
  { value: "general", label: "General Contracting" },
  { value: "other", label: "Other" },
];

const BUSINESS_SIZES = [
  { value: "solo", label: "Just me (Solo)" },
  { value: "small_team", label: "2-5 employees" },
  { value: "medium", label: "6-20 employees" },
  { value: "large", label: "20+ employees" },
];

const REFERRAL_SOURCES = [
  { value: "google", label: "Google Search" },
  { value: "social", label: "Social Media" },
  { value: "referral", label: "Friend/Colleague Referral" },
  { value: "ad", label: "Online Ad" },
  { value: "other", label: "Other" },
];

export function OnboardingModal({ open, userName }: OnboardingModalProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    phone: "",
    companyName: "",
    businessSize: "",
    referralSource: "",
    primaryTrade: "",
    yearsInBusiness: "",
  });

  const onboardingMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to complete onboarding");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onboardingMutation.mutate(formData);
  };

  const isFormValid = formData.companyName && formData.primaryTrade;

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-lg" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-2xl font-heading">
            Welcome{userName ? `, ${userName}` : ""}!
          </DialogTitle>
          <DialogDescription>
            Let&apos;s set up your account so you can start creating professional proposals.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="companyName">Company Name *</Label>
              <Input
                id="companyName"
                data-testid="input-company-name"
                placeholder="Your Business Name"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                data-testid="input-phone"
                type="tel"
                placeholder="(555) 123-4567"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="yearsInBusiness">Years in Business</Label>
              <Input
                id="yearsInBusiness"
                data-testid="input-years"
                type="number"
                min="0"
                max="100"
                placeholder="5"
                value={formData.yearsInBusiness}
                onChange={(e) => setFormData({ ...formData, yearsInBusiness: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="primaryTrade">Primary Trade *</Label>
            <Select
              value={formData.primaryTrade}
              onValueChange={(value) => setFormData({ ...formData, primaryTrade: value })}
            >
              <SelectTrigger data-testid="select-trade">
                <SelectValue placeholder="Select your main trade" />
              </SelectTrigger>
              <SelectContent>
                {TRADES.map((trade) => (
                  <SelectItem key={trade.value} value={trade.value}>
                    {trade.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="businessSize">Team Size</Label>
            <Select
              value={formData.businessSize}
              onValueChange={(value) => setFormData({ ...formData, businessSize: value })}
            >
              <SelectTrigger data-testid="select-business-size">
                <SelectValue placeholder="How big is your team?" />
              </SelectTrigger>
              <SelectContent>
                {BUSINESS_SIZES.map((size) => (
                  <SelectItem key={size.value} value={size.value}>
                    {size.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="referralSource">How did you hear about us?</Label>
            <Select
              value={formData.referralSource}
              onValueChange={(value) => setFormData({ ...formData, referralSource: value })}
            >
              <SelectTrigger data-testid="select-referral">
                <SelectValue placeholder="Select an option" />
              </SelectTrigger>
              <SelectContent>
                {REFERRAL_SOURCES.map((source) => (
                  <SelectItem key={source.value} value={source.value}>
                    {source.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            type="submit"
            data-testid="button-complete-onboarding"
            className="w-full bg-secondary text-slate-900 hover:bg-secondary/90"
            disabled={!isFormValid || onboardingMutation.isPending}
          >
            {onboardingMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Get Started"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
