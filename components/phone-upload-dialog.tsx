"use client";

import { useState, useEffect, useCallback } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Smartphone,
  Copy,
  Check,
  Clock,
  RefreshCw,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface PhoneUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobId: number;
  onPhotosUploaded?: () => void;
}

interface SessionData {
  sessionId: string;
  sessionUrl: string;
  expiresAt: string;
  expiresInMinutes: number;
}

/**
 * PhoneUploadDialog - Displays a QR code for uploading photos from a phone.
 * 
 * Security notes:
 * - Creates a time-limited session (20 minutes)
 * - Raw token is never stored in DB, only hash
 * - Session is tied to the specific job and user
 */
export function PhoneUploadDialog({
  open,
  onOpenChange,
  jobId,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onPhotosUploaded, // Reserved for future realtime updates
}: PhoneUploadDialogProps) {
  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [remainingTime, setRemainingTime] = useState<number | null>(null);

  // Create a new session
  const createSession = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/photo-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ jobId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message || "Failed to create session");
      }

      const data: SessionData = await response.json();
      setSession(data);
      
      // Calculate initial remaining time
      const expiresAt = new Date(data.expiresAt);
      const now = new Date();
      const remainingMs = expiresAt.getTime() - now.getTime();
      setRemainingTime(Math.max(0, Math.floor(remainingMs / 1000)));

      toast({
        title: "Phone upload link created",
        description: "Scan the QR code with your phone or copy the link.",
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create session";
      setError(message);
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  // Create session when dialog opens
  useEffect(() => {
    if (open && !session && !loading) {
      createSession();
    }
  }, [open, session, loading, createSession]);

  // Countdown timer
  useEffect(() => {
    if (!session || remainingTime === null || remainingTime <= 0) return;

    const interval = setInterval(() => {
      setRemainingTime((prev) => {
        if (prev === null || prev <= 0) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [session, remainingTime]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      // Small delay before resetting to allow close animation
      const timeout = setTimeout(() => {
        setSession(null);
        setError(null);
        setCopied(false);
        setRemainingTime(null);
      }, 300);
      return () => clearTimeout(timeout);
    }
  }, [open]);

  // Copy link to clipboard
  const copyLink = async () => {
    if (!session) return;
    
    try {
      await navigator.clipboard.writeText(session.sessionUrl);
      setCopied(true);
      toast({
        title: "Link copied",
        description: "Paste this link in your phone browser.",
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

  // Format remaining time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Check if session is expired
  const isExpired = remainingTime !== null && remainingTime <= 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="w-5 h-5" />
            Upload from Phone
          </DialogTitle>
          <DialogDescription>
            Scan this QR code with your phone to upload photos directly to this job.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center space-y-4 py-4">
          {/* Loading state */}
          {loading && (
            <div className="flex flex-col items-center justify-center h-64 space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Creating upload link...</p>
            </div>
          )}

          {/* Error state */}
          {error && !loading && (
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
              <AlertCircle className="w-12 h-12 text-destructive" />
              <p className="text-sm text-center text-destructive">{error}</p>
              <Button onClick={createSession} variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            </div>
          )}

          {/* Expired state */}
          {session && isExpired && !loading && (
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
              <Clock className="w-12 h-12 text-amber-500" />
              <p className="text-sm text-center text-muted-foreground">
                This link has expired.
              </p>
              <Button onClick={createSession} variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Generate New Code
              </Button>
            </div>
          )}

          {/* QR Code */}
          {session && !isExpired && !loading && !error && (
            <>
              <div className="p-4 bg-white rounded-lg border shadow-sm">
                <QRCodeSVG
                  value={session.sessionUrl}
                  size={200}
                  level="M"
                  includeMargin={false}
                />
              </div>

              {/* Timer */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>
                  Expires in{" "}
                  <span className={remainingTime !== null && remainingTime < 120 ? "text-amber-600 font-medium" : ""}>
                    {remainingTime !== null ? formatTime(remainingTime) : "--:--"}
                  </span>
                </span>
              </div>

              {/* Copy link button */}
              <Button
                variant="outline"
                className="w-full max-w-xs"
                onClick={copyLink}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-2 text-green-600" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Link
                  </>
                )}
              </Button>

              {/* Instructions */}
              <div className="text-xs text-center text-muted-foreground max-w-xs space-y-1">
                <p>Point your phone camera at the QR code, or copy the link and open it in your phone&apos;s browser.</p>
                <p className="text-primary">Photos uploaded on your phone will appear here automatically.</p>
              </div>

              {/* Refresh button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={createSession}
                disabled={loading}
              >
                <RefreshCw className={`w-3 h-3 mr-1 ${loading ? "animate-spin" : ""}`} />
                Generate new code
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default PhoneUploadDialog;
