'use client';
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Loader2, MessageSquare, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CancelFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (portalUrl: string | null) => void;
}

const CANCELLATION_REASONS = [
  { value: "too_expensive", label: "Too expensive for my needs" },
  { value: "not_using", label: "Not using it enough" },
  { value: "missing_features", label: "Missing features I need" },
  { value: "found_alternative", label: "Found a better alternative" },
  { value: "difficult_to_use", label: "Too difficult to use" },
  { value: "temporary_pause", label: "Just need a temporary break" },
  { value: "other", label: "Other reason" },
];

export default function CancelFeedbackModal({
  isOpen,
  onClose,
  onComplete,
}: CancelFeedbackModalProps) {
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!reason) {
      toast({
        title: "Please select a reason",
        description: "We'd love to know why you're leaving so we can improve.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/cancellation-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          reason,
          details: details.trim() || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit feedback");
      }

      const data = await response.json();
      
      toast({
        title: "Thank you for your feedback",
        description: "We appreciate you taking the time to let us know.",
      });

      onComplete(data.portalUrl);
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast({
        title: "Error",
        description: "Failed to submit feedback. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkip = async () => {
    setSubmitting(true);
    try {
      const response = await fetch("/api/cancellation-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          reason: "skipped",
          details: undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to process");
      }

      const data = await response.json();
      onComplete(data.portalUrl);
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            Before you go...
          </DialogTitle>
          <DialogDescription>
            We&apos;re sorry to see you leave. Your feedback helps us improve ScopeGen for everyone.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800">
              After submitting feedback, you&apos;ll be redirected to manage your subscription.
            </p>
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-medium">Why are you canceling?</Label>
            <RadioGroup value={reason} onValueChange={setReason}>
              {CANCELLATION_REASONS.map((item) => (
                <div key={item.value} className="flex items-center space-x-2">
                  <RadioGroupItem 
                    value={item.value} 
                    id={item.value}
                    data-testid={`radio-reason-${item.value}`}
                  />
                  <Label 
                    htmlFor={item.value} 
                    className="font-normal cursor-pointer"
                  >
                    {item.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="details" className="text-sm font-medium">
              Any additional feedback? (optional)
            </Label>
            <Textarea
              id="details"
              placeholder="Tell us more about your experience..."
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={3}
              data-testid="input-cancel-details"
            />
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="ghost"
            onClick={handleSkip}
            disabled={submitting}
            data-testid="button-skip-feedback"
          >
            Skip & Continue
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || !reason}
            data-testid="button-submit-feedback"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit & Continue"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
