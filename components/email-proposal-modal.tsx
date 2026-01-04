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
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Mail, Send, Copy, Check, Link2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface EmailProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
  proposalId: number;
  clientName: string;
  publicToken?: string;
  onSuccess?: () => void;
}

export default function EmailProposalModal({
  isOpen,
  onClose,
  proposalId,
  clientName,
  publicToken,
  onSuccess,
}: EmailProposalModalProps) {
  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipientName, setRecipientName] = useState(clientName);
  const [message, setMessage] = useState(
    `Hi ${clientName},\n\nPlease find attached the proposal for your project. Let me know if you have any questions.\n\nBest regards`
  );
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleSend = async () => {
    if (!recipientEmail) {
      toast({
        title: "Email required",
        description: "Please enter the recipient's email address.",
        variant: "destructive",
      });
      return;
    }

    setSending(true);
    setSendError(false);
    try {
      const res = await fetch(`/api/proposals/${proposalId}/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          recipientEmail,
          recipientName,
          message,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        // Store the share URL if provided for fallback
        if (data.publicUrl) {
          setShareUrl(data.publicUrl);
        }
        setSendError(true);
        toast({
          title: "Couldn't send email",
          description: "Please try again or copy the share link below.",
          variant: "destructive",
        });
        return;
      }

      // Capture the public URL from successful response
      if (data.publicUrl) {
        setShareUrl(data.publicUrl);
      }

      toast({
        title: "Proposal sent!",
        description: `The proposal has been sent to ${recipientEmail}`,
      });
      onSuccess?.();
      onClose();
    } catch (error: any) {
      setSendError(true);
      toast({
        title: "Couldn't send email",
        description: "Please try again or copy the share link below.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const handleCopyLink = async () => {
    const url = shareUrl || (publicToken ? `${window.location.origin}/p/${publicToken}` : null);
    if (!url) {
      toast({
        title: "No share link available",
        description: "Please try sending the email first.",
        variant: "destructive",
      });
      return;
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast({
        title: "Link copied!",
        description: "Share this link with your client.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: "Failed to copy",
        description: "Please copy the link manually.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-primary" />
            Send Proposal via Email
          </DialogTitle>
          <DialogDescription>
            Send this proposal directly to your client&apos;s inbox.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="recipient-email">Recipient Email *</Label>
            <Input
              id="recipient-email"
              type="email"
              placeholder="client@example.com"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              data-testid="input-recipient-email"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="recipient-name">Recipient Name</Label>
            <Input
              id="recipient-name"
              placeholder="John Smith"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              data-testid="input-recipient-name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Personal Message</Label>
            <Textarea
              id="message"
              placeholder="Add a personal message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              data-testid="input-email-message"
            />
          </div>
        </div>

        {sendError && (shareUrl || publicToken) && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-3">
              <Link2 className="w-5 h-5 text-amber-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-800">
                  Email couldn't be sent
                </p>
                <p className="text-sm text-amber-600 mt-1">
                  You can copy the share link and send it manually.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={handleCopyLink}
                  data-testid="button-copy-share-link"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-2" />
                      Copy share link
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={sending}>
            Cancel
          </Button>
          <Button onClick={handleSend} disabled={sending} data-testid="button-send-email">
            {sending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                {sendError ? 'Try Again' : 'Send Proposal'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
