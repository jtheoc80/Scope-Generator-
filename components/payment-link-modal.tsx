'use client';
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2, Copy, Check, CreditCard, ExternalLink } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";

interface PaymentLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  proposalId: number;
  clientName: string;
  priceLow: number;
  priceHigh: number;
  existingPaymentLink?: string | null;
  existingDepositPercentage?: number | null;
  onSuccess: () => void;
}

export default function PaymentLinkModal({
  isOpen,
  onClose,
  proposalId,
  clientName,
  priceLow,
  priceHigh,
  existingPaymentLink,
  existingDepositPercentage,
  onSuccess,
}: PaymentLinkModalProps) {
  const { t } = useLanguage();
  const [depositPercentage, setDepositPercentage] = useState<string>(
    existingDepositPercentage?.toString() || "50"
  );
  const [isLoading, setIsLoading] = useState(false);
  const [paymentLink, setPaymentLink] = useState<string | null>(existingPaymentLink || null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const avgPrice = Math.round((priceLow + priceHigh) / 2);
  const depositAmount = Math.round(avgPrice * parseInt(depositPercentage) / 100);

  const handleCreatePaymentLink = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/proposals/${proposalId}/payment-link`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ depositPercentage: parseInt(depositPercentage) }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to create payment link");
      }

      const data = await response.json();
      setPaymentLink(data.paymentLinkUrl);
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLink = async () => {
    if (paymentLink) {
      await navigator.clipboard.writeText(paymentLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary" />
            {t.payment.requestPayment}
          </DialogTitle>
          <DialogDescription>
            {t.payment.createPaymentLinkFor.replace('{clientName}', clientName)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {!paymentLink ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="deposit">{t.payment.depositAmount}</Label>
                <Select
                  value={depositPercentage}
                  onValueChange={setDepositPercentage}
                >
                  <SelectTrigger data-testid="select-deposit-percentage">
                    <SelectValue placeholder={t.payment.selectDepositPercentage} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="25">25% - ${Math.round(avgPrice * 0.25).toLocaleString()}</SelectItem>
                    <SelectItem value="50">50% - ${Math.round(avgPrice * 0.5).toLocaleString()}</SelectItem>
                    <SelectItem value="100">100% - ${avgPrice.toLocaleString()}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="bg-slate-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">{t.payment.projectTotal}</span>
                  <span className="font-medium">${avgPrice.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">{t.payment.deposit} ({depositPercentage}%):</span>
                  <span className="font-bold text-primary">${depositAmount.toLocaleString()}</span>
                </div>
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>
              )}
            </>
          ) : (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                <p className="text-sm text-green-700 font-medium mb-2">
                  {t.payment.paymentLinkCreated}
                </p>
                <p className="text-xs text-green-600">
                  {t.payment.shareLink} ${depositAmount.toLocaleString()} ({depositPercentage}% {t.payment.deposit.toLowerCase()}).
                </p>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={paymentLink}
                  readOnly
                  className="flex-1 px-3 py-2 text-sm bg-slate-100 border rounded-md truncate"
                  data-testid="input-payment-link"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopyLink}
                  data-testid="button-copy-payment-link"
                >
                  {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => window.open(paymentLink, '_blank')}
                  data-testid="button-open-payment-link"
                >
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          {!paymentLink ? (
            <>
              <Button variant="outline" onClick={onClose} data-testid="button-cancel-payment">
                {t.common.cancel}
              </Button>
              <Button
                onClick={handleCreatePaymentLink}
                disabled={isLoading}
                data-testid="button-create-payment-link"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t.payment.creating}
                  </>
                ) : (
                  t.payment.createPaymentLink
                )}
              </Button>
            </>
          ) : (
            <Button onClick={onClose} data-testid="button-done-payment">
              {t.payment.done}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
