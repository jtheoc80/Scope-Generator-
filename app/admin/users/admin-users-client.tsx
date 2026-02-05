'use client';

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import LayoutWrapper from "@/components/layout-wrapper";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import {
  Shield,
  Users,
  Loader2,
  Search,
  ShieldCheck,
  ShieldX,
  Plus,
  Minus,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  Crown,
} from "lucide-react";

// Available entitlements
const ENTITLEMENTS = [
  { value: 'CREW_ACCESS', label: 'Crew Access', description: 'Access to Crew dashboard' },
  { value: 'CREW_PAYOUT', label: 'Crew Payout', description: 'Access to Crew Payout functionality' },
  { value: 'ADMIN_USERS', label: 'Admin Users', description: 'Access to user administration' },
  { value: 'SEARCH_CONSOLE', label: 'Search Console', description: 'Access to Search Console integration' },
] as const;

interface UserData {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  role: string;
  entitlements: string[] | null;
  subscriptionPlan: string | null;
  isPro: boolean;
  createdAt: string | null;
}

interface AuditLogEntry {
  id: number;
  actorEmail: string | null;
  targetUserEmail: string | null;
  action: string;
  resourceType: string;
  resourceValue: string | null;
  previousValue: string | null;
  newValue: string | null;
  createdAt: string;
  metadata: {
    reason?: string;
    ipAddress?: string;
    [key: string]: string | undefined;
  } | null;
}

export default function AdminUsersClient() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  // State
  const [users, setUsers] = useState<UserData[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [accessChecked, setAccessChecked] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  
  // Pagination
  const [page, setPage] = useState(0);
  const [limit] = useState(20);
  
  // Search & Filter
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  
  // Dialog state
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [showGrantDialog, setShowGrantDialog] = useState(false);
  const [showRevokeDialog, setShowRevokeDialog] = useState(false);
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [showAuditDialog, setShowAuditDialog] = useState(false);
  const [entitlementToGrant, setEntitlementToGrant] = useState<string>("");
  const [entitlementToRevoke, setEntitlementToRevoke] = useState<string>("");
  const [newRole, setNewRole] = useState<string>("");
  const [reason, setReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);

  // Check admin access
  useEffect(() => {
    const checkAccess = async () => {
      if (authLoading) return;
      
      if (!user) {
        router.push("/");
        return;
      }
      
      try {
        const res = await fetch("/api/auth/access", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          if (!data.isAdmin) {
            router.push("/dashboard");
            return;
          }
          setHasAccess(true);
        } else {
          router.push("/dashboard");
        }
      } catch {
        router.push("/dashboard");
      } finally {
        setAccessChecked(true);
      }
    };
    
    checkAccess();
  }, [user, authLoading, router]);

  // Fetch users
  const fetchUsers = useCallback(async () => {
    if (!hasAccess) return;
    
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: (page * limit).toString(),
      });
      
      if (search) params.append('search', search);
      if (roleFilter && roleFilter !== 'all') params.append('role', roleFilter);
      
      const res = await fetch(`/api/admin/users?${params}`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
        setTotal(data.total);
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch users",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [hasAccess, page, limit, search, roleFilter, toast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Search handler
  const handleSearch = () => {
    setPage(0);
    setSearch(searchInput);
  };

  // Grant entitlement
  const handleGrantEntitlement = async () => {
    if (!selectedUser || !entitlementToGrant) return;
    
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${selectedUser.id}/entitlements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ entitlement: entitlementToGrant, reason }),
      });
      
      if (res.ok) {
        toast({
          title: "Entitlement granted",
          description: `${entitlementToGrant} granted to ${selectedUser.email}`,
        });
        setShowGrantDialog(false);
        setEntitlementToGrant("");
        setReason("");
        fetchUsers();
      } else {
        const error = await res.json();
        toast({
          title: "Error",
          description: error.message || "Failed to grant entitlement",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to grant entitlement",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Revoke entitlement
  const handleRevokeEntitlement = async () => {
    if (!selectedUser || !entitlementToRevoke) return;
    
    setActionLoading(true);
    try {
      const params = reason ? `?reason=${encodeURIComponent(reason)}` : '';
      const res = await fetch(
        `/api/admin/users/${selectedUser.id}/entitlements/${entitlementToRevoke}${params}`,
        { method: 'DELETE', credentials: 'include' }
      );
      
      if (res.ok) {
        toast({
          title: "Entitlement revoked",
          description: `${entitlementToRevoke} revoked from ${selectedUser.email}`,
        });
        setShowRevokeDialog(false);
        setEntitlementToRevoke("");
        setReason("");
        fetchUsers();
      } else {
        const error = await res.json();
        toast({
          title: "Error",
          description: error.message || "Failed to revoke entitlement",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to revoke entitlement",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Change role
  const handleChangeRole = async () => {
    if (!selectedUser || !newRole) return;
    
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${selectedUser.id}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ role: newRole, reason }),
      });
      
      if (res.ok) {
        toast({
          title: "Role changed",
          description: `${selectedUser.email} is now ${newRole}`,
        });
        setShowRoleDialog(false);
        setNewRole("");
        setReason("");
        fetchUsers();
      } else {
        const error = await res.json();
        toast({
          title: "Error",
          description: error.message || "Failed to change role",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to change role",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  // View audit logs
  const handleViewAuditLogs = async (u: UserData) => {
    setSelectedUser(u);
    setShowAuditDialog(true);
    
    try {
      const res = await fetch(`/api/admin/users/${u.id}`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(data.auditLogs || []);
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to fetch audit logs",
        variant: "destructive",
      });
    }
  };

  // Loading and access states
  if (authLoading || !accessChecked) {
    return (
      <LayoutWrapper>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </LayoutWrapper>
    );
  }

  if (!hasAccess) {
    return (
      <LayoutWrapper>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="max-w-md">
            <CardHeader className="text-center">
              <AlertTriangle className="w-12 h-12 mx-auto text-yellow-500 mb-4" />
              <CardTitle>Access Denied</CardTitle>
              <CardDescription>
                You do not have permission to access the admin panel.
                Please contact an administrator if you believe this is an error.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button onClick={() => router.push("/dashboard")}>
                Go to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </LayoutWrapper>
    );
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <LayoutWrapper>
      <div className="bg-slate-50 min-h-screen pb-12">
        {/* Header */}
        <div className="bg-white border-b border-slate-200">
          <div className="container mx-auto px-4 py-6 md:py-8">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-red-600 rounded-xl flex items-center justify-center shadow-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-heading font-bold text-slate-900">
                  Admin: User Management
                </h1>
                <p className="text-slate-500 text-sm">Manage user roles and entitlements</p>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-6 md:py-8 space-y-6">
          {/* Search and Filters */}
          <Card className="border-0 shadow-sm">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 flex gap-2">
                  <Input
                    placeholder="Search by email, name..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="max-w-sm"
                  />
                  <Button onClick={handleSearch} variant="outline">
                    <Search className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v); setPage(0); }}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="All roles" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={fetchUsers} variant="outline" size="icon">
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Users Table */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Users ({total})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>User</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Subscription</TableHead>
                          <TableHead>Entitlements</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.map((u) => (
                          <TableRow key={u.id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                                  {u.role === 'admin' ? (
                                    <Crown className="w-4 h-4 text-yellow-500" />
                                  ) : (
                                    <User className="w-4 h-4 text-slate-500" />
                                  )}
                                </div>
                                <div>
                                  <div className="font-medium text-sm">
                                    {u.firstName && u.lastName
                                      ? `${u.firstName} ${u.lastName}`
                                      : u.email || 'Unknown'}
                                  </div>
                                  <div className="text-xs text-slate-500">{u.email}</div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              {u.role === 'admin' ? (
                                <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Admin</Badge>
                              ) : (
                                <Badge variant="secondary">User</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {u.subscriptionPlan === 'crew' ? (
                                <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100">Crew</Badge>
                              ) : u.subscriptionPlan === 'pro' ? (
                                <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Pro</Badge>
                              ) : u.isPro ? (
                                <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Active</Badge>
                              ) : (
                                <Badge variant="outline">Free</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {u.entitlements && u.entitlements.length > 0 ? (
                                  u.entitlements.map((ent) => (
                                    <Badge key={ent} variant="outline" className="text-xs">
                                      {ent}
                                    </Badge>
                                  ))
                                ) : (
                                  <span className="text-xs text-slate-400">None</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-sm text-slate-500">
                              {u.createdAt
                                ? new Date(u.createdAt).toLocaleDateString()
                                : '-'}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0"
                                  onClick={() => {
                                    setSelectedUser(u);
                                    setShowGrantDialog(true);
                                  }}
                                  title="Grant entitlement"
                                >
                                  <Plus className="w-4 h-4 text-green-600" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0"
                                  onClick={() => {
                                    setSelectedUser(u);
                                    setShowRevokeDialog(true);
                                  }}
                                  title="Revoke entitlement"
                                  disabled={!u.entitlements || u.entitlements.length === 0}
                                >
                                  <Minus className="w-4 h-4 text-red-600" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0"
                                  onClick={() => {
                                    setSelectedUser(u);
                                    setNewRole(u.role === 'admin' ? 'user' : 'admin');
                                    setShowRoleDialog(true);
                                  }}
                                  title="Change role"
                                >
                                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0"
                                  onClick={() => handleViewAuditLogs(u)}
                                  title="View audit log"
                                >
                                  <Clock className="w-4 h-4 text-slate-600" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4">
                      <div className="text-sm text-slate-500">
                        Showing {page * limit + 1} - {Math.min((page + 1) * limit, total)} of {total}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage(p => Math.max(0, p - 1))}
                          disabled={page === 0}
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                          disabled={page >= totalPages - 1}
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Grant Entitlement Dialog */}
      <Dialog open={showGrantDialog} onOpenChange={setShowGrantDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-green-600" />
              Grant Entitlement
            </DialogTitle>
            <DialogDescription>
              Grant an entitlement to {selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Entitlement</Label>
              <Select value={entitlementToGrant} onValueChange={setEntitlementToGrant}>
                <SelectTrigger>
                  <SelectValue placeholder="Select entitlement" />
                </SelectTrigger>
                <SelectContent>
                  {ENTITLEMENTS.filter(e => 
                    !selectedUser?.entitlements?.includes(e.value)
                  ).map(e => (
                    <SelectItem key={e.value} value={e.value}>
                      {e.label} - {e.description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Reason (optional)</Label>
              <Textarea
                placeholder="Reason for granting this entitlement..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGrantDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleGrantEntitlement}
              disabled={!entitlementToGrant || actionLoading}
              className="bg-green-600 hover:bg-green-700"
            >
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Grant Entitlement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Revoke Entitlement Dialog */}
      <Dialog open={showRevokeDialog} onOpenChange={setShowRevokeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldX className="w-5 h-5 text-red-600" />
              Revoke Entitlement
            </DialogTitle>
            <DialogDescription>
              Revoke an entitlement from {selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Entitlement</Label>
              <Select value={entitlementToRevoke} onValueChange={setEntitlementToRevoke}>
                <SelectTrigger>
                  <SelectValue placeholder="Select entitlement" />
                </SelectTrigger>
                <SelectContent>
                  {selectedUser?.entitlements?.map(ent => (
                    <SelectItem key={ent} value={ent}>
                      {ENTITLEMENTS.find(e => e.value === ent)?.label || ent}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Reason (optional)</Label>
              <Textarea
                placeholder="Reason for revoking this entitlement..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRevokeDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleRevokeEntitlement}
              disabled={!entitlementToRevoke || actionLoading}
              variant="destructive"
            >
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Revoke Entitlement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Role Dialog */}
      <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-yellow-500" />
              Change User Role
            </DialogTitle>
            <DialogDescription>
              Change role for {selectedUser?.email} from{' '}
              <Badge variant="outline">{selectedUser?.role}</Badge> to{' '}
              <Badge variant="outline">{newRole}</Badge>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {newRole === 'admin' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-yellow-800">Warning: Admin Access</p>
                    <p className="text-sm text-yellow-700">
                      Granting admin access gives this user full control over user management
                      and entitlements. Make sure this is intended.
                    </p>
                  </div>
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label>Reason (optional)</Label>
              <Textarea
                placeholder="Reason for role change..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRoleDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleChangeRole}
              disabled={actionLoading}
              className={newRole === 'admin' ? 'bg-yellow-600 hover:bg-yellow-700' : ''}
            >
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {newRole === 'admin' ? 'Make Admin' : 'Remove Admin'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Audit Log Dialog */}
      <Dialog open={showAuditDialog} onOpenChange={setShowAuditDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Audit Log - {selectedUser?.email}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {auditLogs.length === 0 ? (
              <p className="text-center text-slate-500 py-8">No audit logs found</p>
            ) : (
              auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="border rounded-lg p-3 bg-slate-50"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {log.action.includes('GRANT') ? (
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                      ) : log.action.includes('REVOKE') ? (
                        <XCircle className="w-4 h-4 text-red-600" />
                      ) : (
                        <Shield className="w-4 h-4 text-blue-600" />
                      )}
                      <span className="font-medium text-sm">{log.action}</span>
                    </div>
                    <span className="text-xs text-slate-500">
                      {new Date(log.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="mt-2 text-sm">
                    <p>
                      <span className="text-slate-500">By:</span> {log.actorEmail || 'Unknown'}
                    </p>
                    {log.resourceValue && (
                      <p>
                        <span className="text-slate-500">{log.resourceType}:</span>{' '}
                        <Badge variant="outline" className="text-xs">{log.resourceValue}</Badge>
                      </p>
                    )}
                    {log.metadata?.reason && (
                      <p className="text-slate-600 mt-1">
                        <em>&quot;{String(log.metadata.reason)}&quot;</em>
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </LayoutWrapper>
  );
}
