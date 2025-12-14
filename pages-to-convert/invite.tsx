'use client';
import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import Layout from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { 
  Building2, 
  UserPlus, 
  Loader2, 
  CheckCircle2,
  XCircle,
  LogIn
} from "lucide-react";

interface InviteInfo {
  email: string;
  role: string;
  companyName: string;
  expiresAt: string;
}

export default function Invite() {
  const [, params] = useRoute("/invite/:token");
  const token = params?.token;
  const { user, isLoading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const [inviteInfo, setInviteInfo] = useState<InviteInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    if (token) {
      fetchInviteInfo();
    }
  }, [token]);

  const fetchInviteInfo = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/invite/${token}`);
      if (res.ok) {
        const data = await res.json();
        setInviteInfo(data);
      } else {
        const errorData = await res.json();
        setError(errorData.message || "Invalid or expired invite link");
      }
    } catch (err) {
      setError("Failed to load invite information");
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvite = async () => {
    if (!user) {
      toast({
        title: "Login required",
        description: "Please log in to accept this invitation.",
        variant: "destructive",
      });
      return;
    }

    setAccepting(true);
    try {
      const res = await fetch(`/api/invite/${token}/accept`, {
        method: "POST",
        credentials: "include",
      });

      if (res.ok) {
        setAccepted(true);
        toast({
          title: "Welcome to the team!",
          description: `You've joined ${inviteInfo?.companyName}`,
        });
        setTimeout(() => {
          navigate("/crew");
        }, 2000);
      } else {
        const errorData = await res.json();
        toast({
          title: "Failed to accept invite",
          description: errorData.message,
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to accept invite. Please try again.",
        variant: "destructive",
      });
    } finally {
      setAccepting(false);
    }
  };

  if (loading || authLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12 max-w-md">
          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <XCircle className="w-8 h-8 text-red-500" />
              </div>
              <CardTitle className="text-xl">Invalid Invitation</CardTitle>
              <CardDescription className="text-base mt-2">
                {error}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate("/")} data-testid="button-go-home">
                Go to Homepage
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  if (accepted) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12 max-w-md">
          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>
              <CardTitle className="text-xl">You're In!</CardTitle>
              <CardDescription className="text-base mt-2">
                You've successfully joined {inviteInfo?.companyName}. Redirecting you to the team page...
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12 max-w-md">
        <Card className="text-center">
          <CardHeader>
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Building2 className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-xl">Team Invitation</CardTitle>
            <CardDescription className="text-base mt-2">
              You've been invited to join <strong>{inviteInfo?.companyName}</strong> as a{" "}
              <span className="capitalize">{inviteInfo?.role}</span>.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!user ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Please log in to accept this invitation.
                </p>
                <Button onClick={() => window.location.href = "/api/login"} className="gap-2" data-testid="button-login-to-accept">
                  <LogIn className="w-4 h-4" />
                  Log In to Accept
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-3 bg-slate-50 rounded-lg text-sm text-muted-foreground">
                  Accepting as <strong>{user.firstName || user.username}</strong>
                </div>
                <Button 
                  onClick={handleAcceptInvite} 
                  disabled={accepting} 
                  className="gap-2"
                  data-testid="button-accept-invite"
                >
                  {accepting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <UserPlus className="w-4 h-4" />
                  )}
                  Accept Invitation
                </Button>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              This invitation expires on{" "}
              {inviteInfo?.expiresAt && new Date(inviteInfo.expiresAt).toLocaleDateString()}
            </p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
