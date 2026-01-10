'use client';
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Layout from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { useToast } from "@/hooks/use-toast";
import { 
  Users, 
  UserPlus, 
  Building2, 
  Crown, 
  Shield, 
  User, 
  Loader2, 
  Copy, 
  Check,
  Trash2,
  Mail,
  AlertCircle,
  FileText,
  TrendingUp,
  DollarSign,
  ArrowRight,
  Settings,
  Sparkles,
  CheckCircle,
  Infinity,
  XCircle,
  Lock,
} from "lucide-react";

// Access check result from server
interface CrewAccessResult {
  hasCrewAccess: boolean;
  hasCrewPayoutAccess: boolean;
  accessDeniedReason?: string;
  missingRequirement?: string;
  subscriptionPlan: string | null;
  entitlements: string[];
}

interface Company {
  id: number;
  name: string;
  ownerId: string;
  seatLimit: number;
  extraSeats: number;
  address?: string;
  phone?: string;
  logo?: string;
  licenseNumber?: string;
}

interface CompanyInfo {
  company: Company;
  role: string;
  memberCount: number;
  totalSeats: number;
}

interface Member {
  id: number;
  role: string;
  createdAt: string;
  user: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    profileImageUrl?: string;
  };
}

interface Invite {
  id: number;
  email: string;
  role: string;
  token: string;
  expiresAt: string;
  createdAt: string;
}

export default function Crew() {
  const { user, isLoading: authLoading } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const { toast } = useToast();

  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [inviting, setInviting] = useState(false);
  
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  // Server-side access check state
  const [accessChecked, setAccessChecked] = useState(false);
  const [accessResult, setAccessResult] = useState<CrewAccessResult | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  // Server-side access check - replaces client-only subscriptionPlan check
  useEffect(() => {
    const checkAccess = async () => {
      if (authLoading || !user) return;
      
      try {
        const res = await fetch("/api/crew/access", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          setAccessResult(data);
        } else {
          // If API fails, deny access
          setAccessResult({
            hasCrewAccess: false,
            hasCrewPayoutAccess: false,
            accessDeniedReason: 'NOT_AUTHENTICATED',
            subscriptionPlan: null,
            entitlements: [],
          });
        }
      } catch (error) {
        console.error("Error checking crew access:", error);
        setAccessResult({
          hasCrewAccess: false,
          hasCrewPayoutAccess: false,
          accessDeniedReason: 'NOT_AUTHENTICATED',
          subscriptionPlan: null,
          entitlements: [],
        });
      } finally {
        setAccessChecked(true);
      }
    };
    
    checkAccess();
  }, [user, authLoading]);

  useEffect(() => {
    if (user) {
      fetchCompanyInfo();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchCompanyInfo = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/company", { credentials: "include" });
      const data = await res.json();
      setCompanyInfo(data);
      
      if (data) {
        await Promise.all([fetchMembers(), fetchInvites()]);
      }
    } catch (error) {
      console.error("Error fetching company:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
    try {
      const res = await fetch("/api/company/members", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setMembers(data);
      }
    } catch (error) {
      console.error("Error fetching members:", error);
    }
  };

  const fetchInvites = async () => {
    try {
      const res = await fetch("/api/company/invites", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setInvites(data);
      }
    } catch (error) {
      console.error("Error fetching invites:", error);
    }
  };

  const handleCreateCompany = async () => {
    if (!companyName.trim()) {
      toast({
        title: "Company name required",
        description: "Please enter a name for your company.",
        variant: "destructive",
      });
      return;
    }

    setCreating(true);
    try {
      const res = await fetch("/api/company", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: companyName.trim() }),
      });

      if (res.ok) {
        const data = await res.json();
        setCompanyInfo(data);
        setShowCreateDialog(false);
        setCompanyName("");
        toast({
          title: "Company created",
          description: "Your workspace has been set up successfully.",
        });
        await Promise.all([fetchMembers(), fetchInvites()]);
      } else {
        const error = await res.json();
        toast({
          title: "Failed to create company",
          description: error.message,
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to create company. Please try again.",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim() || !inviteEmail.includes("@")) {
      toast({
        title: "Valid email required",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    setInviting(true);
    try {
      const res = await fetch("/api/company/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
      });

      if (res.ok) {
        const data = await res.json();
        setShowInviteDialog(false);
        setInviteEmail("");
        setInviteRole("member");
        toast({
          title: "Invitation sent",
          description: `Invite link created for ${inviteEmail}`,
        });
        await fetchInvites();
        
        if (data.inviteLink) {
          navigator.clipboard.writeText(data.inviteLink);
          toast({
            title: "Link copied",
            description: "Invite link has been copied to your clipboard.",
          });
        }
      } else {
        const error = await res.json();
        toast({
          title: "Failed to send invite",
          description: error.message,
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to send invite. Please try again.",
        variant: "destructive",
      });
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveMember = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to remove ${userName} from the team?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/company/members/${userId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (res.ok) {
        toast({
          title: "Member removed",
          description: `${userName} has been removed from the team.`,
        });
        await fetchMembers();
        await fetchCompanyInfo();
      } else {
        const error = await res.json();
        toast({
          title: "Failed to remove member",
          description: error.message,
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to remove member. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteInvite = async (inviteId: number) => {
    try {
      const res = await fetch(`/api/company/invites/${inviteId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (res.ok) {
        toast({
          title: "Invite deleted",
          description: "The invitation has been revoked.",
        });
        await fetchInvites();
      } else {
        const error = await res.json();
        toast({
          title: "Failed to delete invite",
          description: error.message,
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete invite. Please try again.",
        variant: "destructive",
      });
    }
  };

  const copyInviteLink = async (token: string) => {
    const link = `${window.location.origin}/invite/${token}`;
    await navigator.clipboard.writeText(link);
    setCopiedLink(token);
    setTimeout(() => setCopiedLink(null), 2000);
    toast({
      title: "Link copied",
      description: "Invite link has been copied to your clipboard.",
    });
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "owner":
        return <Crown className="w-4 h-4 text-yellow-500" />;
      case "admin":
        return <Shield className="w-4 h-4 text-blue-500" />;
      default:
        return <User className="w-4 h-4 text-slate-500" />;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "owner":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Owner</Badge>;
      case "admin":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Admin</Badge>;
      default:
        return <Badge variant="secondary">Member</Badge>;
    }
  };

  const isOwnerOrAdmin = companyInfo?.role === "owner" || companyInfo?.role === "admin";
  const isOwner = companyInfo?.role === "owner";

  if (authLoading || !accessChecked) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  // Server-side access denied - show "No Access" UI
  if (!accessResult?.hasCrewAccess) {
    return (
      <Layout>
        <div className="bg-slate-50 min-h-screen flex items-center justify-center py-12">
          <Card className="max-w-lg mx-4 border-0 shadow-lg">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <Lock className="w-8 h-8 text-red-600" />
              </div>
              <CardTitle className="text-2xl">Access Denied</CardTitle>
              <CardDescription className="text-base mt-2">
                You don&apos;t have access to the Crew dashboard.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Access denial reason */}
              <div className="bg-slate-100 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <XCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-slate-900">
                      {accessResult?.accessDeniedReason === 'NOT_CREW_SUBSCRIBER' && 
                        "Crew subscription required"}
                      {accessResult?.accessDeniedReason === 'MISSING_ENTITLEMENT' && 
                        "Missing required entitlement"}
                      {accessResult?.accessDeniedReason === 'NOT_AUTHENTICATED' && 
                        "Authentication required"}
                      {!accessResult?.accessDeniedReason && 
                        "Access not authorized"}
                    </p>
                    {accessResult?.missingRequirement && (
                      <p className="text-sm text-slate-600 mt-1">
                        Requires: {accessResult.missingRequirement}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Next steps */}
              <div className="space-y-4">
                <h3 className="font-semibold text-slate-900">Next Steps</h3>
                
                {/* Option 1: Subscribe to Crew */}
                <div className="border rounded-lg p-4 hover:border-primary transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Users className="w-4 h-4 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-slate-900">Subscribe to Crew</p>
                      <p className="text-sm text-slate-500 mt-1">
                        Get team collaboration features, unlimited proposals, and more.
                      </p>
                      <Link href="/#pricing">
                        <Button className="mt-3" size="sm">
                          View Plans <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Option 2: Pro users */}
                {user?.subscriptionPlan === 'pro' && (
                  <div className="border rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Shield className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-slate-900">You have Pro</p>
                        <p className="text-sm text-slate-500 mt-1">
                          Upgrade to Crew for team features, or continue using Pro.
                        </p>
                        <Link href="/pro">
                          <Button variant="outline" className="mt-3" size="sm">
                            Go to Pro Dashboard
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                )}

                {/* Option 3: Contact admin */}
                <div className="border rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Mail className="w-4 h-4 text-slate-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-slate-900">Need Access?</p>
                      <p className="text-sm text-slate-500 mt-1">
                        If you believe you should have access, contact your team administrator
                        or reach out to support.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Back to dashboard */}
              <div className="pt-2 border-t">
                <Link href="/dashboard">
                  <Button variant="ghost" className="w-full">
                    Back to Dashboard
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!user) {
    return null;
  }

  if (!companyInfo) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12 max-w-2xl">
          <Card className="text-center border-0 shadow-sm">
            <CardHeader>
              <div className="mx-auto w-16 h-16 bg-slate-900 rounded-xl flex items-center justify-center mb-4">
                <Users className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl">Set Up Your Team Workspace</CardTitle>
              <CardDescription className="text-base mt-2">
                Create a company workspace to invite team members and collaborate on proposals together.
                The Crew plan includes 3 seats with options to add more.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogTrigger asChild>
                  <Button size="lg" className="gap-2 bg-slate-900 hover:bg-slate-800" data-testid="button-create-company">
                    <Building2 className="w-5 h-5" />
                    Create Company Workspace
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Your Company</DialogTitle>
                    <DialogDescription>
                      Enter your company name to get started. You can update company details later.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="company-name">Company Name</Label>
                      <Input
                        id="company-name"
                        placeholder="e.g., Smith Remodeling LLC"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        data-testid="input-company-name"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateCompany} disabled={creating} data-testid="button-confirm-create">
                      {creating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                      Create Company
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="bg-slate-50 min-h-screen pb-12">
        {/* Header */}
        <div className="bg-white border-b border-slate-200">
          <div className="container mx-auto px-4 py-6 md:py-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 bg-slate-900 rounded-xl flex items-center justify-center shadow-lg">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-heading font-bold text-slate-900">
                    {t.crew?.title || "Crew Dashboard"}
                  </h1>
                  <p className="text-slate-500 text-sm">{companyInfo.company.name}</p>
                </div>
              </div>
              <Link href="/settings">
                <Button variant="outline" className="gap-2">
                  <Settings className="w-4 h-4" />
                  {t.pro?.settings || "Settings"}
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-6 md:py-8 space-y-6">
          {/* Unlimited Proposals Card */}
          <Card className="border-0 shadow-sm overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-slate-900 to-slate-800 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  <CardTitle className="text-lg text-white">{t.crew?.proposalsThisMonth || "Proposals"}</CardTitle>
                </div>
                <Badge className="bg-green-500 text-white hover:bg-green-500 gap-1">
                  <Infinity className="w-3 h-3" />
                  {t.crew?.unlimited || "Unlimited"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <p className="text-slate-600">
                {t.crew?.unlimitedDesc || "Your Crew plan includes unlimited proposals for your entire team. Create as many as you need!"}
              </p>
            </CardContent>
          </Card>

          {/* Crew Features / Quick Actions */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Sparkles className="w-5 h-5 text-slate-700" />
                {t.crew?.crewFeatures || "Crew Features"}
              </CardTitle>
              <CardDescription>{t.pro?.quickAccess || "Quick access to your professional tools"}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Create Proposal */}
                <Link href="/app" className="block group">
                  <div className="h-full p-6 rounded-xl border-2 border-slate-200 bg-white hover:border-primary hover:shadow-md transition-all">
                    <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                      <FileText className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="font-bold text-slate-900 mb-1">{t.pro?.createProposal || "Create Proposal"}</h3>
                    <p className="text-sm text-slate-500 mb-4">{t.pro?.createProposalDesc || "Generate a professional proposal in 60 seconds"}</p>
                    <div className="flex items-center text-primary font-medium text-sm group-hover:gap-2 transition-all">
                      {t.pro?.createNow || "Create Now"} <ArrowRight className="w-4 h-4 ml-1" />
                    </div>
                  </div>
                </Link>

                {/* Market Pricing */}
                <Link href="/market-pricing" className="block group">
                  <div className="h-full p-6 rounded-xl border-2 border-slate-200 bg-white hover:border-emerald-500 hover:shadow-md transition-all">
                    <div className="h-12 w-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-emerald-200 transition-colors">
                      <DollarSign className="w-6 h-6 text-emerald-600" />
                    </div>
                    <h3 className="font-bold text-slate-900 mb-1">{t.pro?.marketPricing || "Market Pricing"}</h3>
                    <p className="text-sm text-slate-500 mb-4">{t.pro?.marketPricingDesc || "Unlimited lookups for material & labor rates"}</p>
                    <div className="flex items-center text-emerald-600 font-medium text-sm group-hover:gap-2 transition-all">
                      {t.pro?.lookUp || "Look Up"} <ArrowRight className="w-4 h-4 ml-1" />
                    </div>
                  </div>
                </Link>

                {/* Pricing Insights */}
                <Link href="/pricing-insights" className="block group">
                  <div className="h-full p-6 rounded-xl border-2 border-slate-200 bg-white hover:border-purple-500 hover:shadow-md transition-all">
                    <div className="h-12 w-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-purple-200 transition-colors">
                      <TrendingUp className="w-6 h-6 text-purple-600" />
                    </div>
                    <h3 className="font-bold text-slate-900 mb-1">{t.pro?.pricingInsights || "Pricing Insights"}</h3>
                    <p className="text-sm text-slate-500 mb-4">{t.pro?.pricingInsightsDesc || "Analyze your win rates & proposal performance"}</p>
                    <div className="flex items-center text-purple-600 font-medium text-sm group-hover:gap-2 transition-all">
                      {t.pro?.viewInsights || "View Insights"} <ArrowRight className="w-4 h-4 ml-1" />
                    </div>
                  </div>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* What's Included */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <CheckCircle className="w-5 h-5 text-green-500" />
                {t.crew?.whatsIncluded || "What's Included in Crew"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-100">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-slate-700">{t.crew?.unlimitedProposals || "Unlimited proposals"}</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-100">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-slate-700">{t.crew?.teamSeats || "3 team member seats"}</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-100">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-slate-700">{t.pro?.unlimitedMarketPricing || "Unlimited Market Pricing lookups"}</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-100">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-slate-700">{t.crew?.sharedBranding || "Shared company branding"}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Team Management Section */}
          <div className="pt-4">
            <h2 className="text-xl font-heading font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              {t.crew?.teamManagement || "Team Management"}
            </h2>
          </div>

          {/* Team Seats */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    {t.crew?.teamSeatsTitle || "Team Seats"}
                  </CardTitle>
                  <CardDescription>
                    Your plan includes {companyInfo.company.seatLimit} seats
                    {companyInfo.company.extraSeats > 0 && ` + ${companyInfo.company.extraSeats} extra`}
                  </CardDescription>
                </div>
                {isOwnerOrAdmin && (
                  <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
                    <DialogTrigger asChild>
                      <Button className="gap-2" data-testid="button-invite-member">
                        <UserPlus className="w-4 h-4" />
                        Invite Member
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Invite Team Member</DialogTitle>
                        <DialogDescription>
                          Send an invitation to add a new member to your team.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="invite-email">Email Address</Label>
                          <Input
                            id="invite-email"
                            type="email"
                            placeholder="teammate@company.com"
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                            data-testid="input-invite-email"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="invite-role">Role</Label>
                          <Select value={inviteRole} onValueChange={setInviteRole}>
                            <SelectTrigger data-testid="select-invite-role">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="member">Member - Can create and send proposals</SelectItem>
                              <SelectItem value="admin">Admin - Can also invite and manage members</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setShowInviteDialog(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleInvite} disabled={inviting} data-testid="button-send-invite">
                          {inviting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                          Send Invite
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Seats used</span>
                    <span className="font-medium">{companyInfo.memberCount} / {companyInfo.totalSeats}</span>
                  </div>
                  <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-slate-900 transition-all"
                      style={{ width: `${(companyInfo.memberCount / companyInfo.totalSeats) * 100}%` }}
                    />
                  </div>
                </div>
                {companyInfo.memberCount >= companyInfo.totalSeats && (
                  <div className="flex items-center gap-2 text-amber-600 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    <span>All seats used</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Team Members */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Team Members ({members.length})
              </CardTitle>
              <CardDescription>
                People with access to this workspace
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {members.map((member) => (
                  <div 
                    key={member.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-slate-50/50"
                    data-testid={`member-row-${member.user.id}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center">
                        {member.user.profileImageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img 
                            src={member.user.profileImageUrl} 
                            alt={`${member.user.firstName || 'Team member'} profile photo`}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          getRoleIcon(member.role)
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-slate-900">
                          {member.user.firstName && member.user.lastName 
                            ? `${member.user.firstName} ${member.user.lastName}`
                            : member.user.email}
                        </div>
                        <div className="text-sm text-muted-foreground">{member.user.email}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {getRoleBadge(member.role)}
                      {isOwner && member.role !== "owner" && member.user.id !== user?.id && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleRemoveMember(
                            member.user.id, 
                            member.user.firstName || member.user.email
                          )}
                          data-testid={`button-remove-member-${member.user.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Pending Invitations */}
          {invites.length > 0 && (
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  Pending Invitations ({invites.length})
                </CardTitle>
                <CardDescription>
                  Invites that haven&apos;t been accepted yet
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {invites.map((invite) => (
                    <div 
                      key={invite.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-dashed bg-slate-50/30"
                      data-testid={`invite-row-${invite.id}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                          <Mail className="w-4 h-4 text-slate-400" />
                        </div>
                        <div>
                          <div className="font-medium text-slate-700">{invite.email}</div>
                          <div className="text-sm text-muted-foreground">
                            Expires {new Date(invite.expiresAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getRoleBadge(invite.role)}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => copyInviteLink(invite.token)}
                          data-testid={`button-copy-invite-${invite.id}`}
                        >
                          {copiedLink === invite.token ? (
                            <Check className="w-4 h-4 text-green-500" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                        {isOwnerOrAdmin && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleDeleteInvite(invite.id)}
                            data-testid={`button-delete-invite-${invite.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Your Role */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle>Your Role</CardTitle>
              <CardDescription>
                Your permissions in this workspace
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                {getRoleIcon(companyInfo.role)}
                <div>
                  <div className="font-medium capitalize">{companyInfo.role}</div>
                  <div className="text-sm text-muted-foreground">
                    {companyInfo.role === "owner" && "Full control over workspace, billing, and team management"}
                    {companyInfo.role === "admin" && "Can invite members and manage the team"}
                    {companyInfo.role === "member" && "Can create and send proposals"}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
