"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Trash2, Circle, Shield } from "lucide-react";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import InviteAdminDialog from "@/components/InviteAdminDialog";
import ChangeRoleDialog from "@/components/ChangeRoleDialog";
import { formatWIBDate, formatDisplayDate, formatLastSeen, formatFullDateWithTime } from "@/lib/formatWIBDate";
import { useOnlineStatus } from "@/hooks/use-online-status";

interface Role {
  id: number;
  name: string;
}

interface AdminUser {
  id: string;
  name: string;
  email: string;
  roleId: number | null;
  roleName: string | null;
  lastOnline: string | null;
  createdAt: string;
  updatedAt: string;
  isOnline?: boolean;
  lastSeen?: string | null;
  currentPage?: string | null;
  currentAction?: string | null;
}

interface AuthManagementContentProps {
  username: string;
  currentUserId: string;
}

export default function AuthManagementContent({ username, currentUserId }: AuthManagementContentProps) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<AdminUser | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [changeRoleDialogOpen, setChangeRoleDialogOpen] = useState(false);
  const [userToChangeRole, setUserToChangeRole] = useState<AdminUser | null>(null);

  // Online status tracking for admin users
  const { onlineUsers, isConnected } = useOnlineStatus();

  const fetchRoles = async () => {
    try {
      const res = await fetch("/api/roles");
      if (res.ok) {
        const data = await res.json();
        setRoles(data);
      }
    } catch (err) {
      console.error("Failed to fetch roles", err);
    }
  };

  const fetchUsers = async (roleId?: string) => {
    setLoading(true);
    try {
      const url = roleId ? `/api/admin-users?roleId=${roleId}` : "/api/admin-users";
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (err) {
      console.error("Failed to fetch admin users", err);
      toast.error("Failed to fetch admin users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
    fetchUsers();
  }, []);

  useEffect(() => {
    if (activeTab === "all") {
      fetchUsers();
    } else {
      fetchUsers(activeTab);
    }
  }, [activeTab]);

  // Update admin users with online status from realtime updates
  useEffect(() => {
    const onlineUserMap = new Map(onlineUsers.map(u => [u.id, { isOnline: true, lastSeen: u.lastSeen, currentPage: u.currentPage, currentAction: u.currentAction }]));
    setUsers(prevUsers =>
      prevUsers.map(user => {
        const onlineInfo = onlineUserMap.get(user.id);
        // User is online if they're in the onlineUsers map, otherwise offline
        return {
          ...user,
          isOnline: !!onlineInfo?.isOnline,
          lastSeen: onlineInfo?.lastSeen || user.lastSeen,
          currentPage: onlineInfo?.currentPage || null,
          currentAction: onlineInfo?.currentAction || null,
        };
      })
    );
  }, [onlineUsers]);

  const handleDelete = async () => {
    if (!userToDelete) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin-users/${userToDelete.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Admin user deleted successfully");
        setDeleteDialogOpen(false);
        setUserToDelete(null);
        fetchUsers(activeTab === "all" ? undefined : activeTab);
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to delete admin user");
      }
    } catch (err) {
      console.error("Failed to delete admin user", err);
      toast.error("Failed to delete admin user");
    } finally {
      setIsDeleting(false);
    }
  };

  const openDeleteDialog = (user: AdminUser) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const openChangeRoleDialog = (user: AdminUser) => {
    setUserToChangeRole(user);
    setChangeRoleDialogOpen(true);
  };

  // Helper function to format route for display
  const formatRouteForDisplay = (route: string | null | undefined): string => {
    if (!route) return ''

    // The route is already formatted from the client side, but we can clean it up if needed
    return route
  }

  // Helper function to get online status badge
  const getOnlineStatusBadge = (isOnline: boolean, lastSeen: string | null, currentPage?: string | null, currentAction?: string | null) => {
    if (isOnline) {
      // Display currentAction if available, otherwise fall back to currentPage
      const displayText = currentAction || formatRouteForDisplay(currentPage) || 'Reading';
      return (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5">
            <Circle className="h-2 w-2 fill-green-500 text-green-500" />
            <span className="text-xs font-medium text-green-600">Online</span>
          </div>
          <div className="text-[10px] text-gray-500 pl-3.5">
            {displayText}
          </div>
        </div>
      );
    }

    const lastSeenText = formatFullDateWithTime(lastSeen);
    return (
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-1.5">
          <Circle className="h-2 w-2 fill-gray-400 text-gray-400" />
          <span className="text-xs font-medium text-gray-500">Offline</span>
        </div>
        <div className="text-[10px] text-gray-400 pl-3.5">
          {lastSeenText}
        </div>
      </div>
    );
  };

  const filteredUsers = users.sort((a, b) => {
    // Online users always come first
    if (a.isOnline && !b.isOnline) return -1;
    if (!a.isOnline && b.isOnline) return 1;
    
    // Within the same online status, sort by name alphabetically
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Auth Management</h1>
          <p className="text-sm text-gray-500 mt-1">Manage CMS admin accounts and role assignments</p>
        </div>
        <InviteAdminDialog onInviteSent={() => fetchUsers(activeTab === "all" ? undefined : activeTab)} />
      </div>

      {/* Tabs and Table Card */}
      <Card className="bg-white/90 backdrop-blur-md border border-gray-200/80 shadow-sm rounded-lg">
        <CardHeader className="border-b border-gray-200/60 px-6 py-4">
          <CardTitle className="text-gray-900 font-semibold tracking-tight">Admin Accounts</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-6 bg-gray-100/80 border border-gray-200/60" variant="default">
              <TabsTrigger value="all" className="data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm">All Admin</TabsTrigger>
              {roles.map((role) => (
                <TabsTrigger key={role.id} value={role.id.toString()} className="data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm">
                  {role.name}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value={activeTab} className="mt-0">
              {loading ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-11 w-full" />
                  ))}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b border-gray-200/80 hover:bg-transparent">
                        <TableHead className="text-gray-700 font-semibold text-sm tracking-tight py-3 px-4">Name</TableHead>
                        <TableHead className="text-gray-700 font-semibold text-sm tracking-tight py-3 px-4">Status</TableHead>
                        <TableHead className="text-gray-700 font-semibold text-sm tracking-tight py-3 px-4">Role</TableHead>
                        <TableHead className="text-gray-700 font-semibold text-sm tracking-tight py-3 px-4 w-24 text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-gray-500 py-12 text-sm">
                            No admin users found
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredUsers.map((user) => (
                          <TableRow 
                            key={user.id}
                            className="border-b border-gray-200/60 hover:bg-gray-50/50 transition-colors"
                          >
                            <TableCell className="py-3 px-4">
                              <div>
                                <div className="text-gray-900 font-medium text-sm">{user.name}</div>
                                <div className="text-xs text-gray-500 mt-0.5">{user.email}</div>
                              </div>
                            </TableCell>
                            <TableCell className="py-3 px-4">
                              {getOnlineStatusBadge(user.isOnline || false, user.lastSeen || null, user.currentPage || null, user.currentAction || null)}
                            </TableCell>
                            <TableCell className="py-3 px-4">
                              {user.roleName ? (
                                <Badge 
                                  variant="secondary" 
                                  className="bg-gray-100/80 border border-gray-200/80 text-gray-700 font-medium text-xs hover:bg-gray-200/80"
                                >
                                  {user.roleName}
                                </Badge>
                              ) : (
                                <span className="text-sm text-gray-400">No role</span>
                              )}
                            </TableCell>
                            <TableCell className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openChangeRoleDialog(user)}
                                  disabled={user.id === currentUserId}
                                  className="h-8 w-8 p-0 text-gray-600 hover:text-[#E5262C] hover:bg-red-50/80 transition-colors"
                                  title="Change Role"
                                >
                                  <Shield className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openDeleteDialog(user)}
                                  disabled={user.id === currentUserId}
                                  className="h-8 w-8 p-0 text-gray-600 hover:text-red-600 hover:bg-red-50/80 transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Admin User"
        description={
          userToDelete?.id === currentUserId
            ? "You cannot delete your own account."
            : `Are you sure you want to delete "${userToDelete?.name}"? This will permanently remove their admin account and all associated data including sessions and permissions.`
        }
        onConfirm={handleDelete}
        isDeleting={isDeleting}
      />
      
      <ChangeRoleDialog
        user={userToChangeRole}
        open={changeRoleDialogOpen}
        onOpenChange={setChangeRoleDialogOpen}
        onRoleChanged={() => fetchUsers(activeTab === "all" ? undefined : activeTab)}
      />
    </div>
  );
}
