"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import GlassTable, { GlassTableColumn, GlassTableRow } from "@/components/GlassTable";
import InviteAdminDialog from "@/components/InviteAdminDialog";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import { formatWIBDate } from "@/lib/formatWIBDate";
import { useInvitationUpdates } from "@/hooks/use-invitation-updates";
import { CheckCircle, XCircle, Clock, Link as LinkIcon, Trash2 } from "lucide-react";

// ─── Invite Link Types ───────────────────────────────────────────────────────
interface Invitation {
  id: number;
  email: string;
  roleId: number;
  roleName: string | null;
  inviteTokenHash: string;
  status: string;
  inviteExpiresAt: string | null;
  createdAt: string | null;
  completedAt: string | null;
  openedAt: string | null;
  emailSentAt: string | null;
  createdBy: string | null;
  validityState: string;
  isOpened: boolean;
  isEmailSent: boolean;
  activityStep: string | null;
  lastActivityAt: string | null;
}

// ─── Pending User Types ──────────────────────────────────────────────────────
interface PendingUser {
  id: string;
  name: string;
  email: string;
  image: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

interface Role {
  id: number;
  name: string;
}

// ─── Badge helpers ───────────────────────────────────────────────────────────
function ValidityBadge({ state }: { state: string }) {
  const styles: Record<string, string> = {
    active: "bg-green-50 text-green-700 border border-green-100",
    used: "bg-blue-50 text-blue-700 border border-blue-100",
    expired: "bg-red-50 text-red-700 border border-red-100",
    opened_not_completed: "bg-yellow-50 text-yellow-700 border border-yellow-100",
  };
  return (
    <Badge variant="secondary" className={`${styles[state] || styles.active} text-[10px] px-1.5 py-0.5`}>
      {state === "used" ? "Completed" : state === "opened_not_completed" ? "Opened" : state.charAt(0).toUpperCase() + state.slice(1)}
    </Badge>
  );
}

// ─── Activity helpers ────────────────────────────────────────────────────────
const ACTIVITY_LABELS: Record<string, string> = {
  viewing: "Viewing invite page",
  entering_otp: "Entering OTP code",
  setting_password: "Setting password",
  submitting: "Submitting details",
};

function ActivityCell({ step, lastActivityAt }: { step: string | null; lastActivityAt: string | null }) {
  if (!step) {
    return <span className="text-sm text-gray-400">Link not opened yet</span>;
  }

  // Coarse 60s freshness window (heartbeat fires every ~10s while page is open)
  const isActive =
    lastActivityAt && Date.now() - new Date(lastActivityAt).getTime() < 60_000;

  return (
    <div className="flex items-center gap-2">
      <span className={`h-2 w-2 rounded-full ${isActive ? "bg-green-500" : "bg-gray-300"}`} />
      <span className={`text-sm ${isActive ? "text-gray-800 font-medium" : "text-gray-400"}`}>
        {isActive ? ACTIVITY_LABELS[step] || step : "Idle"}
      </span>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function InvitationContent({ currentUserId }: { currentUserId: string }) {
  const [activeTab, setActiveTab] = useState("invitations");
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loadingInvitations, setLoadingInvitations] = useState(true);
  const [loadingPending, setLoadingPending] = useState(true);

  // Approve dialog state
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [userToApprove, setUserToApprove] = useState<PendingUser | null>(null);
  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [approving, setApproving] = useState(false);

  // Reject (delete) dialog state
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [userToReject, setUserToReject] = useState<PendingUser | null>(null);
  const [rejecting, setRejecting] = useState(false);

  // Delete invitation dialog state
  const [inviteToDelete, setInviteToDelete] = useState<Invitation | null>(null);
  const [deletingInvite, setDeletingInvite] = useState(false);

  // ─── Data Fetching ──────────────────────────────────────────────────────
  const fetchInvitations = useCallback(async (showLoading = true) => {
    if (showLoading) setLoadingInvitations(true);
    try {
      const res = await fetch("/api/admin-invitations");
      if (res.ok) {
        const data = await res.json();
        setInvitations(data.invitations || []);
      }
    } catch (err) {
      console.error("Failed to fetch invitations", err);
      toast.error("Failed to load invitations");
    } finally {
      if (showLoading) setLoadingInvitations(false);
    }
  }, []);

  const fetchPendingUsers = useCallback(async () => {
    setLoadingPending(true);
    try {
      const res = await fetch("/api/admin-users?pending=true");
      if (res.ok) {
        const data = await res.json();
        setPendingUsers(data || []);
      }
    } catch (err) {
      console.error("Failed to fetch pending users", err);
      toast.error("Failed to load pending users");
    } finally {
      setLoadingPending(false);
    }
  }, []);

  const fetchRoles = useCallback(async () => {
    try {
      const res = await fetch("/api/roles");
      if (res.ok) {
        const data = await res.json();
        setRoles(data.roles || []);
      }
    } catch (err) {
      console.error("Failed to fetch roles", err);
    }
  }, []);

  useEffect(() => {
    fetchInvitations();
    fetchPendingUsers();
    fetchRoles();
  }, [fetchInvitations, fetchPendingUsers, fetchRoles]);

  // Live updates via SSE (same mechanism as Admin Management).
  // The stream pushes full lists, so replacing state preserves the active tab.
  const { onInvitationsUpdated, onPendingUsersUpdated } = useInvitationUpdates();

  useEffect(() => {
    onInvitationsUpdated((invitations) => setInvitations(invitations));
    onPendingUsersUpdated((users) => setPendingUsers(users));
  }, [onInvitationsUpdated, onPendingUsersUpdated]);

  // Refresh invitations when a new invite is sent (via InviteAdminDialog callback)
  useEffect(() => {
    if (activeTab === "invitations") {
      fetchInvitations();
    }
  }, [activeTab, fetchInvitations]);

  // ─── Approve Handlers ───────────────────────────────────────────────────
  const openApproveDialog = (user: PendingUser) => {
    setUserToApprove(user);
    setSelectedRoleId("");
    setApproveDialogOpen(true);
  };

  const handleApprove = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userToApprove || !selectedRoleId) {
      toast.error("Please select a role");
      return;
    }

    setApproving(true);
    try {
      const res = await fetch(`/api/admin-users/${userToApprove.id}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roleId: parseInt(selectedRoleId) }),
      });

      if (res.ok) {
        const roleName = roles.find(r => r.id.toString() === selectedRoleId)?.name || "Role";
        toast.success(`${userToApprove.email} approved as ${roleName}`);
        setApproveDialogOpen(false);
        setUserToApprove(null);
        setSelectedRoleId("");
        fetchPendingUsers();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to approve user");
      }
    } catch (err) {
      console.error("Failed to approve user", err);
      toast.error("Failed to approve user");
    } finally {
      setApproving(false);
    }
  };

  // ─── Reject Handlers ────────────────────────────────────────────────────
  const openRejectDialog = (user: PendingUser) => {
    setUserToReject(user);
    setRejectDialogOpen(true);
  };

  const handleReject = async () => {
    if (!userToReject) return;
    setRejecting(true);
    try {
      const res = await fetch(`/api/admin-users/${userToReject.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success(`${userToReject.email} rejected and removed`);
        setRejectDialogOpen(false);
        setUserToReject(null);
        fetchPendingUsers();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to reject user");
      }
    } catch (err) {
      console.error("Failed to reject user", err);
      toast.error("Failed to reject user");
    } finally {
      setRejecting(false);
    }
  };

  const handleDeleteInvitation = async () => {
    if (!inviteToDelete) return;
    setDeletingInvite(true);
    try {
      const res = await fetch(`/api/admin-invitations/${inviteToDelete.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success(`Invitation for ${inviteToDelete.email} deleted`);
        setInviteToDelete(null);
        fetchInvitations();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to delete invitation");
      }
    } catch (err) {
      console.error("Failed to delete invitation", err);
      toast.error("Failed to delete invitation");
    } finally {
      setDeletingInvite(false);
    }
  };

  // ─── Table Data ─────────────────────────────────────────────────────────
  const invitationRows = invitations.map(inv => ({
    id: inv.id,
    cells: [
      <div key="email" className="text-gray-900 font-medium text-sm">{inv.email}</div>,
      <ActivityCell key="activity" step={inv.activityStep} lastActivityAt={inv.lastActivityAt} />,
      <ValidityBadge key="status" state={inv.validityState} />,
      <Badge key="role" variant="secondary" className="bg-gray-100/80 border border-gray-200/80 text-gray-700 font-medium text-xs">
        {inv.roleName || "Unknown"}
      </Badge>,
      <div key="created" className="text-sm text-gray-600">{formatWIBDate(inv.createdAt)}</div>,
      <div key="actions" className="flex items-center justify-end gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setInviteToDelete(inv)}
          className="h-8 px-3 text-gray-600 hover:text-red-600 hover:bg-red-50/80 transition-colors text-xs font-medium gap-1.5"
          title="Delete invitation (invalidates the link)"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Cancel
        </Button>
      </div>,
    ],
  }));

  const pendingUserRows = pendingUsers.map(user => ({
    id: user.id,
    cells: [
      <div key="email" className="text-gray-900 font-medium text-sm">{user.email}</div>,
      <div key="name" className="text-sm text-gray-600">{user.name || "-"}</div>,
      <div key="created" className="text-sm text-gray-600">{formatWIBDate(user.createdAt)}</div>,
      <div key="actions" className="flex items-center justify-end gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => openApproveDialog(user)}
          className="h-8 px-3 text-green-600 hover:text-green-700 hover:bg-green-50/80 transition-colors text-xs font-medium gap-1.5"
          title="Approve & Assign Role"
        >
          <CheckCircle className="h-3.5 w-3.5" />
          Accept
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => openRejectDialog(user)}
          className="h-8 px-3 text-gray-600 hover:text-red-600 hover:bg-red-50/80 transition-colors text-xs font-medium gap-1.5"
          title="Reject"
        >
          <XCircle className="h-3.5 w-3.5" />
          Reject
        </Button>
      </div>,
    ],
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invitations</h1>
          <p className="text-sm text-gray-500 mt-1">Manage admin invitations and pending SSO approvals</p>
        </div>
        <InviteAdminDialog onInviteSent={() => fetchInvitations()} />
      </div>

      {/* Tabs */}
      <Card className="bg-white/90 backdrop-blur-md border border-gray-200/80 shadow-sm rounded-lg">
        <CardHeader className="border-b border-gray-200/60 px-6 py-4">
          <CardTitle className="text-gray-900 font-semibold tracking-tight">Invitations & Approvals</CardTitle>
        </CardHeader>
        <CardContent className="pb-6 px-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="group/tabs-list inline-flex w-fit items-center justify-center rounded-2xl p-1 text-muted-foreground group-data-horizontal/tabs:h-9 group-data-vertical/tabs:h-fit group-data-vertical/tabs:flex-col data-[variant=line]:rounded-none backdrop-blur-sm mb-1 bg-gray-100/80 border border-gray-200/60" variant="default">
              <TabsTrigger value="invitations" className="data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm">
                <LinkIcon className="h-3.5 w-3.5 mr-1.5" />
                Invite Links
                {invitations.length > 0 && (
                  <Badge variant="secondary" className="ml-2 bg-gray-200/80 text-gray-600 text-[10px] px-1.5 py-0.5 font-medium">
                    {invitations.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="pending" className="data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm">
                <Clock className="h-3.5 w-3.5 mr-1.5" />
                Pending Approvals
                {pendingUsers.length > 0 && (
                  <Badge variant="secondary" className="ml-2 bg-yellow-100 text-yellow-700 border border-yellow-200 text-[10px] px-1.5 py-0.5 font-medium">
                    {pendingUsers.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {/* ─── Invite Links Tab ─────────────────────────────────────── */}
            <TabsContent value="invitations" className="mt-4">
              <GlassTable
                columns={[
                  { key: "email", header: "Recipient Email" },
                  { key: "activity", header: "Activity" },
                  { key: "status", header: "Status", width: "8rem" },
                  { key: "role", header: "Role", width: "7rem" },
                  { key: "created", header: "Created", width: "11rem" },
                  { key: "actions", header: "Actions", width: "6rem", className: "text-right" },
                ]}
                rows={invitationRows}
                loading={loadingInvitations}
                emptyMessage="No ongoing invitations. Click 'Invite Admin' to create one."
              />
            </TabsContent>

            {/* ─── Pending Approvals Tab ────────────────────────────────── */}
            <TabsContent value="pending" className="mt-4">
              <GlassTable
                columns={[
                  { key: "email", header: "Email" },
                  { key: "name", header: "Name" },
                  { key: "created", header: "First Sign-In Attempt", width: "13rem" },
                  { key: "actions", header: "Actions", width: "11rem", className: "text-right" },
                ]}
                rows={pendingUserRows}
                loading={loadingPending}
                emptyMessage="No users pending approval."
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* ─── Approve Dialog ─────────────────────────────────────────────── */}
      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent
          showCloseButton={false}
          className="max-w-md bg-white/90 backdrop-blur-md border border-gray-200/80 shadow-sm rounded-lg p-0 overflow-hidden"
        >
          <div className="px-6 pt-6 pb-1 border-b border-white/30">
            <DialogTitle className="text-xl font-semibold text-gray-900">
              Approve User
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-600 mt-1">
              Assign a role to <span className="font-medium text-gray-900">{userToApprove?.email}</span> so they can access the CMS.
            </DialogDescription>
          </div>
          <div className="px-4 py-4">
            <form onSubmit={handleApprove} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Name</label>
                <div className="h-11 px-4 flex items-center bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-600">
                  {userToApprove?.name || "(none)"}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Assign Role</label>
                <Select
                  value={selectedRoleId}
                  onValueChange={(v) => setSelectedRoleId(v || "")}
                  disabled={approving}
                >
                  <SelectTrigger className="h-11 px-4 bg-white/60 border-gray-200/50 focus:border-[#E5262C] focus:ring-[#E5262C]/20">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent className="bg-white/95 backdrop-blur-xl border border-white/50">
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.id.toString()}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter className="pt-2 flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setApproveDialogOpen(false)}
                  disabled={approving}
                  className="flex-1 h-11 bg-white/60 border-gray-200/50 hover:bg-white/80 text-gray-700"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 h-11 bg-[#E5262C] hover:bg-[#c41f24] text-white font-medium shadow-sm"
                  disabled={approving || !selectedRoleId}
                >
                  {approving ? "Approving..." : "Approve"}
                </Button>
              </DialogFooter>
            </form>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── Reject Confirm Dialog ──────────────────────────────────────── */}
      <DeleteConfirmDialog
        open={rejectDialogOpen}
        onOpenChange={setRejectDialogOpen}
        title="Reject User"
        itemName={userToReject?.email}
        description={`Are you sure you want to reject ${userToReject?.email}? This will delete their account and they will lose access immediately.`}
        onConfirm={handleReject}
        isDeleting={rejecting}
      />

      {/* ─── Delete Invitation Confirm Dialog ───────────────────────────── */}
      <DeleteConfirmDialog
        open={!!inviteToDelete}
        onOpenChange={(open) => { if (!open) setInviteToDelete(null); }}
        title="Delete Invitation"
        itemName={inviteToDelete?.email}
        description={`Delete the invitation for ${inviteToDelete?.email}? The invite link will stop working immediately and this record will be removed permanently.`}
        onConfirm={handleDeleteInvitation}
        isDeleting={deletingInvite}
      />
    </div>
  );
}