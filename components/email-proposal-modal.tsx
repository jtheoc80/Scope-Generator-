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
import { Loader2, Mail, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface EmailProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
  proposalId: number;
  clientName: string;
  onSuccess?: () => void;
}

export default function EmailProposalModal({
  isOpen,
  onClose,
  proposalId,
  clientName,
  onSuccess,
}: EmailProposalModalProps) {
  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipientName, setRecipientName] = useState(clientName);
  const [message, setMessage] = useState(
    `Hi ${clientName},\n\nPlease find attached the proposal for your project. Let me know if you have any questions.\n\nBest regards`
  );
  const [sending, setSending] = useState(false);
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

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to send email");
      }

      toast({
        title: "Proposal sent!",
        description: `The proposal has been sent to ${recipientEmail}`,
      });
      onSuccess?.();
      onClose();
    } catch (error: any) {
      toast({
        title: "Error sending email",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
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
            Send this proposal directly to your client's inbox.
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
                Send Proposal
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
