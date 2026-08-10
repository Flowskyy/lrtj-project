"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Trash2, Circle } from "lucide-react";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import InviteAdminDialog from "@/components/InviteAdminDialog";
import { formatWIBDate, formatDisplayDate } from "@/lib/formatWIBDate";
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

  // Online status tracking for admin users
  const { onlineUsers, isConnected } = useOnlineStatus({ heartbeatInterval: 30, cleanupInterval: 60 });

  // Debug logging
  useEffect(() => {
    console.log('Online users updated:', onlineUsers);
    console.log('SSE connected:', isConnected);
  }, [onlineUsers, isConnected]);

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
    if (onlineUsers.length > 0) {
      const onlineUserMap = new Map(onlineUsers.map(u => [u.id, { isOnline: true, lastSeen: u.lastSeen }]));
      setUsers(prevUsers => 
        prevUsers.map(user => {
          const onlineInfo = onlineUserMap.get(user.id);
          return {
            ...user,
            isOnline: onlineInfo?.isOnline || false,
            lastSeen: onlineInfo?.lastSeen || null,
          };
        })
      );
    }
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

  // Helper function to get online status badge
  const getOnlineStatusBadge = (isOnline: boolean, lastSeen: string | null) => {
    if (isOnline) {
      return (
        <div className="flex items-center gap-1.5">
          <Circle className="h-2 w-2 fill-green-500 text-green-500" />
          <span className="text-xs font-medium text-green-600">Online</span>
        </div>
      );
    }
    
    const lastSeenText = lastSeen ? formatDisplayDate(lastSeen) : 'Never';
    return (
      <div className="flex items-center gap-1.5">
        <Circle className="h-2 w-2 fill-gray-400 text-gray-400" />
        <span className="text-xs font-medium text-gray-500">Offline</span>
        <span className="text-[10px] text-gray-400">{lastSeenText}</span>
      </div>
    );
  };

  const filteredUsers = users;

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
      <Card className="bg-white/75 backdrop-blur-xl border border-white/50 shadow-[0_8px_32px_0_rgba(31,38,135,0.1)] rounded-2xl">
        <CardHeader className="border-b border-white/30">
          <CardTitle className="text-gray-900">Admin Accounts</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-4" variant="default">
              <TabsTrigger value="all">All Admin</TabsTrigger>
              {roles.map((role) => (
                <TabsTrigger key={role.id} value={role.id.toString()}>
                  {role.name}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value={activeTab} className="mt-0">
              {loading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-white/30 hover:bg-white/30">
                        <TableHead className="text-gray-700 font-semibold">Name</TableHead>
                        <TableHead className="text-gray-700 font-semibold">Status</TableHead>
                        <TableHead className="text-gray-700 font-semibold">Role</TableHead>
                        <TableHead className="text-gray-700 font-semibold w-24">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-gray-500 py-8">
                            No admin users found
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredUsers.map((user) => (
                          <TableRow 
                            key={user.id}
                            className="border-white/20 hover:bg-white/40 transition-colors"
                          >
                            <TableCell className="font-medium">
                              <div>
                                <div className="text-gray-900">{user.name}</div>
                                <div className="text-xs text-gray-500">{user.email}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              {getOnlineStatusBadge(user.isOnline || false, user.lastSeen || null)}
                            </TableCell>
                            <TableCell>
                              {user.roleName ? (
                                <Badge 
                                  variant="secondary" 
                                  className="bg-white/60 border border-white/40 text-gray-700 hover:bg-white/80"
                                >
                                  {user.roleName}
                                </Badge>
                              ) : (
                                <span className="text-sm text-gray-400">No role</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openDeleteDialog(user)}
                                disabled={user.id === currentUserId}
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50/50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
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
        itemName={userToDelete?.name}
        title="Delete Admin User"
        description={
          userToDelete?.id === currentUserId
            ? "You cannot delete your own account."
            : `Are you sure you want to delete "${userToDelete?.name}"? This action cannot be undone and will also delete their associated accounts and sessions.`
        }
        onConfirm={handleDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
}
