"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Save, X, UserX } from "lucide-react";
import Link from "next/link";
import PagePermissionSelector from "@/components/PagePermissionSelector";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

interface RoleDetail {
  id: number;
  name: string;
  isSuperAdmin: boolean;
  showOnDashboard: boolean;
  createdAt: string;
  updatedAt: string;
  role_permissions: Array<{ id: number; pageKey: string }>;
  _count: {
    role_permissions: number;
    auth_users: number;
  };
}

interface RoleUser {
  id: string;
  name: string;
  email: string;
  roleId: number | null;
}

interface RolesEditContentProps {
  userEmail: string | null;
  roleId: string;
}

export default function RolesEditContent({ userEmail, roleId }: RolesEditContentProps) {
  const router = useRouter();
  
  // Form states
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<RoleDetail | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    isSuperAdmin: false,
    showOnDashboard: true,
    permissions: [] as string[]
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // User list states
  const [users, setUsers] = useState<RoleUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [kickDialogOpen, setKickDialogOpen] = useState(false);
  const [userToKick, setUserToKick] = useState<RoleUser | null>(null);
  const [isKicking, setIsKicking] = useState(false);

  const fetchRole = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/roles/${roleId}`);
      if (res.ok) {
        const roleDetail: RoleDetail = await res.json();
        setRole(roleDetail);
        setFormData({
          name: roleDetail.name,
          isSuperAdmin: roleDetail.isSuperAdmin,
          showOnDashboard: roleDetail.showOnDashboard,
          permissions: roleDetail.role_permissions.map(p => p.pageKey).filter(p => p !== 'daily-benefit')
        });
      } else {
        toast.error("Failed to fetch role details");
        router.push("/admin-control-panel/roles");
      }
    } catch (err) {
      console.error("Failed to fetch role details", err);
      toast.error("Failed to fetch role details");
      router.push("/admin-control-panel/roles");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRole();
    fetchUsers();
  }, [roleId]);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await fetch(`/api/roles/${roleId}/users`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      } else {
        console.error("Failed to fetch users for role");
      }
    } catch (err) {
      console.error("Failed to fetch users for role", err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleEdit = async () => {
    if (!formData.name.trim()) {
      toast.error("Role name is required");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/roles/${roleId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success("Role updated successfully");
        router.push("/admin-control-panel/roles");
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to update role");
      }
    } catch (err) {
      console.error("Failed to update role", err);
      toast.error("Failed to update role");
    } finally {
      setIsSubmitting(false);
    }
  };

  const togglePermission = (pageKey: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(pageKey)
        ? prev.permissions.filter(p => p !== pageKey)
        : [...prev.permissions, pageKey]
    }));
  };

  const handleBatchPermissionChange = (newPermissions: string[]) => {
    setFormData(prev => ({
      ...prev,
      permissions: newPermissions
    }));
  };

  const openKickDialog = (user: RoleUser) => {
    setUserToKick(user);
    setKickDialogOpen(true);
  };

  const handleKick = async () => {
    if (!userToKick) return;

    setIsKicking(true);
    try {
      const res = await fetch(`/api/admin-users/${userToKick.id}/role`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success(`User "${userToKick.name}" removed from role`);
        setKickDialogOpen(false);
        setUserToKick(null);
        fetchUsers();
        // Refresh role details to update user count
        fetchRole();
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to remove user from role");
      }
    } catch (err) {
      console.error("Failed to remove user from role", err);
      toast.error("Failed to remove user from role");
    } finally {
      setIsKicking(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-8 w-8" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin-control-panel/roles">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Edit Role</h1>
          <p className="text-sm text-muted-foreground">Modify role permissions and settings</p>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Role Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Role Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Role Name *</Label>
            <Input
              id="name"
              placeholder="Enter role name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              disabled={isSubmitting}
            />
          </div>

          {/* Super Admin Toggle */}
          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="isSuperAdmin" className="flex flex-col space-y-1">
              <span>Super Admin</span>
              <span className="text-xs text-muted-foreground">
                Super admins have full access to all pages regardless of permissions
              </span>
            </Label>
            <Switch
              id="isSuperAdmin"
              checked={formData.isSuperAdmin}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isSuperAdmin: checked }))}
              disabled={isSubmitting}
            />
          </div>

          {/* Show on Dashboard Toggle */}
          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="showOnDashboard" className="flex flex-col space-y-1">
              <span>Show on Dashboard</span>
              <span className="text-xs text-muted-foreground">
                Show users with this role in the Dashboard's "who's online" widget
              </span>
            </Label>
            <Switch
              id="showOnDashboard"
              checked={formData.showOnDashboard}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, showOnDashboard: checked }))}
              disabled={isSubmitting}
            />
          </div>

          {/* User Count Warning */}
          {role && role._count.auth_users > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800">
                <strong>{role._count.auth_users}</strong> user(s) are currently assigned to this role. 
                Changes will affect their access immediately.
              </p>
            </div>
          )}

          {/* Users with this role */}
          <div className="space-y-4">
            <div>
              <Label>Users with this role</Label>
              <p className="text-xs text-muted-foreground mt-1">
                Manage users currently assigned to this role
              </p>
            </div>

            {loadingUsers ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">
                No users assigned to this role
              </div>
            ) : (
              <div className="border rounded-lg divide-y">
                {users.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-600">
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium text-sm">{user.name}</div>
                        <div className="text-xs text-gray-500">{user.email}</div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openKickDialog(user)}
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                      title="Remove user from role"
                    >
                      <UserX className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Permissions */}
          {!formData.isSuperAdmin && (
            <PagePermissionSelector
              selectedPermissions={formData.permissions}
              onPermissionToggle={togglePermission}
              onBatchPermissionChange={handleBatchPermissionChange}
              disabled={isSubmitting}
            />
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <Link href="/admin-control-panel/roles">
              <Button variant="outline" disabled={isSubmitting}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </Link>
            <Button onClick={handleEdit} disabled={isSubmitting}>
              <Save className="h-4 w-4 mr-2" />
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Kick Confirmation Dialog */}
      {userToKick && (
        <Dialog open={kickDialogOpen} onOpenChange={setKickDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Remove User from Role</DialogTitle>
              <DialogDescription>
                Are you sure you want to remove <strong>{userToKick.name}</strong> from this role?
                This will revoke their access to pages granted by this role and force them to re-login.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setKickDialogOpen(false)}
                disabled={isKicking}
              >
                Cancel
              </Button>
              <Button
                onClick={handleKick}
                disabled={isKicking}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {isKicking ? "Removing..." : "Remove User"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
