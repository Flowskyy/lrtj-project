"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import GlassTable, { GlassTableColumn, GlassTableRow } from "@/components/GlassTable";
import InviteAdminDialog from "@/components/InviteAdminDialog";
import AddAdminDialog from "@/components/AddAdminDialog";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import { formatWIBDate } from "@/lib/formatWIBDate";
import { useInvitationUpdates } from "@/hooks/use-invitation-updates";
import { Link as LinkIcon, Trash2 } from "lucide-react";
import Pagination from "@/components/Pagination";

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
    return <span className="text-gray-400">Link not opened yet</span>;
  }

  // Coarse 60s freshness window (heartbeat fires every ~10s while page is open)
  const isActive =
    lastActivityAt && Date.now() - new Date(lastActivityAt).getTime() < 60_000;

  return (
    <div className="flex items-center gap-2">
      <span className={`h-2 w-2 rounded-full ${isActive ? "bg-green-500" : "bg-gray-300"}`} />
      <span className={`${isActive ? "text-gray-800 font-medium" : "text-gray-400"}`}>
        {isActive ? ACTIVITY_LABELS[step] || step : "Idle"}
      </span>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function InvitationContent({ currentUserId }: { currentUserId: string }) {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loadingInvitations, setLoadingInvitations] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Delete invitation dialog state
  const [inviteToDelete, setInviteToDelete] = useState<Invitation | null>(null);
  const [deletingInvite, setDeletingInvite] = useState(false);

  // ─── Data Fetching ──────────────────────────────────────────────────────
  const fetchInvitations = useCallback(async (showLoading = true) => {
    if (showLoading) setLoadingInvitations(true);
    try {
      const res = await fetch(`/api/admin-invitations?page=${page}&limit=50`);
      if (res.ok) {
        const data = await res.json();
        setInvitations(data.invitations || []);
        setTotalPages(data.pagination?.totalPages || 1);
      }
    } catch (err) {
      console.error("Failed to fetch invitations", err);
      toast.error("Failed to load invitations");
    } finally {
      if (showLoading) setLoadingInvitations(false);
    }
  }, [page]);

  useEffect(() => {
    fetchInvitations();
  }, [fetchInvitations]);

  useEffect(() => {
    fetchInvitations();
  }, [page]);

  // Live updates via SSE (same mechanism as Admin Management).
  // The stream pushes full lists, so replacing state preserves the active tab.
  const { onInvitationsUpdated } = useInvitationUpdates();

  useEffect(() => {
    onInvitationsUpdated((invitations) => setInvitations(invitations));
  }, [onInvitationsUpdated]);

  // Refresh invitations when a new invite is sent (via InviteAdminDialog callback)
  useEffect(() => {
    fetchInvitations();
  }, [fetchInvitations]);

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
      <div key="email" className="text-gray-900 font-medium">{inv.email}</div>,
      <ActivityCell key="activity" step={inv.activityStep} lastActivityAt={inv.lastActivityAt} />,
      <ValidityBadge key="status" state={inv.validityState} />,
      <Badge key="role" variant="secondary" className="bg-gray-100/80 border border-gray-200/80 text-gray-700 font-medium text-xs">
        {inv.roleName || "Unknown"}
      </Badge>,
      <div key="created" className="text-gray-600">{formatWIBDate(inv.createdAt)}</div>,
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

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invitations</h1>
          <p className="text-sm text-gray-500 mt-1">Manage admin invitations for local account users</p>
        </div>
        <div className="flex gap-2">
          <AddAdminDialog onAdminAdded={() => {}} />
          <InviteAdminDialog onInviteSent={() => fetchInvitations()} />
        </div>
      </div>

      {/* Invitations Table */}
      <Card className="bg-white/90 backdrop-blur-md border border-gray-200/80 shadow-sm rounded-lg">
        <CardHeader className="border-b border-gray-200/60 px-6 py-4">
          <CardTitle className="text-gray-900 font-semibold tracking-tight">Invite Links</CardTitle>
        </CardHeader>
        <CardContent className="pb-6 px-6">
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

          {/* Pagination */}
          <div className="mt-4">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
              totalCount={invitations.length}
              pageSize={50}
            />
          </div>
        </CardContent>
      </Card>

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