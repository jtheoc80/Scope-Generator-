'use client';
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Layout from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
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
  AlertCircle
} from "lucide-react";

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

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      fetchCompanyInfo();
    }
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
    } catch (error) {
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
    } catch (error) {
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
    } catch (error) {
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
    } catch (error) {
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

  if (authLoading || loading) {
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
          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Building2 className="w-8 h-8 text-primary" />
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
                  <Button size="lg" className="gap-2" data-testid="button-create-company">
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
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-heading font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-7 h-7" />
              {companyInfo.company.name}
            </h1>
            <p className="text-muted-foreground mt-1">Manage your team and workspace settings</p>
          </div>
          {isOwnerOrAdmin && (
            <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
              <DialogTrigger asChild>
                <Button className="gap-2" data-testid="button-invite-member">
                  <UserPlus className="w-4 h-4" />
                  Invite Team Member
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

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Team Seats
              </CardTitle>
              <CardDescription>
                Your plan includes {companyInfo.company.seatLimit} seats
                {companyInfo.company.extraSeats > 0 && ` + ${companyInfo.company.extraSeats} extra`}
              </CardDescription>
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
                      className="h-full bg-primary transition-all"
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

          <Card>
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
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        {member.user.profileImageUrl ? (
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

          {invites.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  Pending Invitations ({invites.length})
                </CardTitle>
                <CardDescription>
                  Invites that haven't been accepted yet
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

          <Card>
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
