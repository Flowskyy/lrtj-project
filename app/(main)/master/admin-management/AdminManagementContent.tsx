"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Trash2, Circle as CircleIcon, Shield } from "lucide-react";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import ChangeRoleDialog from "@/components/ChangeRoleDialog";
import GlassTable, { GlassTableColumn, GlassTableRow } from "@/components/GlassTable";
import { formatWIBDate, formatDisplayDate, formatLastSeen, formatFullDateWithTime } from "@/lib/formatWIBDate";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { useUserListUpdates } from "@/hooks/use-user-list-updates";

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

interface AdminManagementContentProps {
  currentUserId: string;
}

export default function AdminManagementContent({ currentUserId }: AdminManagementContentProps) {
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
  
  // Realtime user list updates
  const { isConnected: userListConnected, onUsersAdded, onUsersDeleted, onUsersUpdated } = useUserListUpdates();

  const fetchRoles = async () => {
    try {
      const res = await fetch("/api/roles");
      if (res.ok) {
        const data = await res.json();
        setRoles(data.roles || []);
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

  // Handle realtime user list updates
  useEffect(() => {
    // Handle new users added
    onUsersAdded((newUsers) => {
      setUsers(prevUsers => {
        // Filter out users that already exist (prevent duplicates)
        const existingIds = new Set(prevUsers.map(u => u.id));
        const trulyNewUsers = newUsers.filter((u: any) => !existingIds.has(u.id));
        
        if (trulyNewUsers.length === 0) return prevUsers;
        
        // If a role filter is active, only add users that match the filter
        if (activeTab !== "all") {
          const filteredNewUsers = trulyNewUsers.filter((u: any) => u.roleId?.toString() === activeTab);
          if (filteredNewUsers.length === 0) return prevUsers;
          
          // Add filtered new users to the state
          return [...filteredNewUsers, ...prevUsers];
        }
        
        // No filter active - add all new users
        return [...trulyNewUsers, ...prevUsers];
      });
      
      // Show toast notification for new user (only if visible)
      const visibleNewUsers = newUsers.filter((u: any) => 
        activeTab === "all" || u.roleId?.toString() === activeTab
      );
      
      if (visibleNewUsers.length === 1) {
        const newUser = visibleNewUsers[0] as any;
        toast.success(`New user ${newUser.email} registered`);
      } else if (visibleNewUsers.length > 1) {
        toast.success(`${visibleNewUsers.length} new users registered`);
      }
    });

    // Handle users deleted
    onUsersDeleted((deletedUserIds) => {
      setUsers(prevUsers => prevUsers.filter(user => !deletedUserIds.includes(user.id)));
      
      if (deletedUserIds.length === 1) {
        toast.info('User deleted');
      }
    });

    // Handle users updated (role changes, etc.)
    onUsersUpdated((updatedUsers) => {
      setUsers(prevUsers => {
        const updatedMap = new Map(updatedUsers.map((u: any) => [u.id, u]));
        
        return prevUsers.map(user => {
          const updated = updatedMap.get(user.id);
          if (updated) {
            return { ...user, ...updated };
          }
          return user;
        });
      });
    });
  }, [onUsersAdded, onUsersDeleted, onUsersUpdated, activeTab]);

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
      let displayText = currentAction || formatRouteForDisplay(currentPage) || 'Online';

      return (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5">
            <CircleIcon className="h-2 w-2 fill-green-500 text-green-500" />
            <span className="text-xs font-medium text-green-600">Online</span>
          </div>
          <div className="text-[10px] text-gray-500 pl-3.5 truncate max-w-[12rem]" title={displayText}>
            {displayText}
          </div>
        </div>
      );
    }

    const lastSeenText = formatFullDateWithTime(lastSeen);
    return (
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-1.5">
          <CircleIcon className="h-2 w-2 fill-gray-400 text-gray-400" />
          <span className="text-xs font-medium text-gray-500">Offline</span>
        </div>
        <div className="text-[10px] text-gray-400 pl-3.5 truncate max-w-[12rem]" title={lastSeenText}>
          {lastSeenText}
        </div>
      </div>
    );
  };

  const filteredUsers = users
    .filter(user => {
      // Apply role filter if a specific tab is selected
      if (activeTab !== "all") {
        return user.roleId?.toString() === activeTab;
      }
      return true;
    })
    .sort((a, b) => {
      // Online users always come first
      if (a.isOnline && !b.isOnline) return -1;
      if (!a.isOnline && b.isOnline) return 1;

      // Within the same online status, sort by email alphabetically
      return a.email.localeCompare(b.email);
    });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Management</h1>
          <p className="text-sm text-gray-500 mt-1">Manage CMS admin accounts and role assignments</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Realtime connection status indicator */}
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <CircleIcon className={`h-2 w-2 ${userListConnected ? 'fill-green-500 text-green-500' : 'fill-gray-400 text-gray-400'}`} />
            <span>{userListConnected ? 'Live' : 'Connecting...'}</span>
          </div>
        </div>
      </div>

      {/* Tabs and Table Card */}
      <Card className="bg-white/90 backdrop-blur-md border border-gray-200/80 shadow-sm rounded-lg">
        <CardHeader className="border-b border-gray-200/60 px-6 py-4">
          <CardTitle className="text-gray-900 font-semibold tracking-tight">Admin Accounts</CardTitle>
        </CardHeader>
        <CardContent className="pb-6 px-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="group/tabs-list inline-flex w-fit items-center justify-center rounded-2xl p-1 text-muted-foreground group-data-horizontal/tabs:h-9 group-data-vertical/tabs:h-fit group-data-vertical/tabs:flex-col data-[variant=line]:rounded-none backdrop-blur-sm mb-1 bg-gray-100/80 border border-gray-200/60" variant="default">
              <TabsTrigger value="all" className="data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm">All Admin</TabsTrigger>
              {roles.map((role) => (
                <TabsTrigger key={role.id} value={role.id.toString()} className="data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm">
                  {role.name}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value={activeTab} className="mt-0">
              <GlassTable
                columns={[
                  { key: "email", header: "Email" },
                  { key: "status", header: "Status", width: "12rem" },
                  { key: "role", header: "Role" },
                  { key: "actions", header: "Actions", width: "6rem", className: "text-right" },
                ]}
                rows={filteredUsers.map((user) => ({
                  id: user.id,
                  cells: [
                    <div key="email">
                      <div className="text-gray-900 font-medium text-sm">{user.email}</div>
                    </div>,
                    getOnlineStatusBadge(user.isOnline || false, user.lastSeen || null, user.currentPage || null, user.currentAction || null),
                    user.roleName ? (
                      <Badge
                        key="role"
                        variant="secondary"
                        className="bg-gray-100/80 border border-gray-200/80 text-gray-700 font-medium text-xs hover:bg-gray-200/80"
                      >
                        {user.roleName}
                      </Badge>
                    ) : (
                      <span key="role" className="text-sm text-gray-400">No role</span>
                    ),
                    <div key="actions" className="flex items-center justify-end gap-1">
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
                    </div>,
                  ],
                }))}
                loading={loading}
                emptyMessage="No admin users found"
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Admin User"
        itemName={userToDelete?.id === currentUserId ? undefined : userToDelete?.name}
        description={
          userToDelete?.id === currentUserId
            ? "You cannot delete your own account."
            : `Are you sure you want to delete "${userToDelete?.name}"? This will also delete associated accounts and sessions.`
        }
        onConfirm={handleDelete}
        isDeleting={isDeleting}
        disableConfirm={userToDelete?.id === currentUserId}
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
