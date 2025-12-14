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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface EditPriceModalProps {
  isOpen: boolean;
  onClose: () => void;
  proposalId: number;
  clientName: string;
  currentPriceLow: number;
  currentPriceHigh: number;
  onUpdated: () => void;
}

export default function EditPriceModal({
  isOpen,
  onClose,
  proposalId,
  clientName,
  currentPriceLow,
  currentPriceHigh,
  onUpdated,
}: EditPriceModalProps) {
  const [priceLow, setPriceLow] = useState(currentPriceLow);
  const [priceHigh, setPriceHigh] = useState(currentPriceHigh);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (priceLow > priceHigh) {
      toast({
        title: "Invalid price range",
        description: "Minimum price cannot be higher than maximum price.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/proposals/${proposalId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ priceLow, priceHigh }),
      });

      if (!response.ok) {
        throw new Error("Failed to update price");
      }

      toast({
        title: "Price updated",
        description: "The proposal price has been updated successfully.",
      });
      onUpdated();
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update the price. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-primary" />
            Adjust Pricing
          </DialogTitle>
          <DialogDescription>
            Update the price range for {clientName}'s proposal.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="priceLow">Minimum Price ($)</Label>
              <Input
                id="priceLow"
                type="number"
                value={priceLow}
                onChange={(e) => setPriceLow(Number(e.target.value))}
                min={0}
                step={100}
                data-testid="input-price-low"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="priceHigh">Maximum Price ($)</Label>
              <Input
                id="priceHigh"
                type="number"
                value={priceHigh}
                onChange={(e) => setPriceHigh(Number(e.target.value))}
                min={0}
                step={100}
                data-testid="input-price-high"
              />
            </div>
            <div className="bg-slate-50 rounded-lg p-3 text-center">
              <div className="text-sm text-slate-500">Displayed Price</div>
              <div className="text-2xl font-bold text-primary">
                ${Math.round((priceLow + priceHigh) / 2).toLocaleString()}
              </div>
              <div className="text-xs text-slate-400">
                (Average of min and max)
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} data-testid="button-save-price">
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Price"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
