"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, Shield, Plus } from "lucide-react";
import { formatWIBDate } from "@/lib/formatWIBDate";

const ALL_PAGE_KEYS = [
  { key: 'dashboard', label: 'Dashboard', group: 'Main' },
  { key: 'users', label: 'Users', group: 'Main' },
  { key: 'news', label: 'News', group: 'Main' },
  { key: 'notifications', label: 'Notifications', group: 'Main' },
  { key: 'larata-club-earning', label: 'LarataClub History', group: 'Main' },
  { key: 'merchandise', label: 'Merchandise', group: 'Merchandise' },
  { key: 'redeem-merchandise', label: 'Redeem Merchandise', group: 'Merchandise' },
  { key: 'daily-benefit', label: 'Daily Benefit', group: 'Daily Benefit' },
  { key: 'redeem-benefit', label: 'Redeem Benefit', group: 'Daily Benefit' },
  { key: 'master-merchandise-category', label: 'Merchandise Category', group: 'Master' },
  { key: 'master-welcome-point', label: 'Welcome Point', group: 'Master' },
  { key: 'master-banner', label: 'Banner', group: 'Master' },
  { key: 'master-popups', label: 'Popups', group: 'Master' },
  { key: 'master-membership', label: 'Membership', group: 'Master' },
  { key: 'master-roles', label: 'Roles', group: 'Master' },
];

interface Role {
  id: number;
  name: string;
  isSuperAdmin: boolean;
  createdAt: string;
  updatedAt: string;
  _count: {
    role_permissions: number;
  };
}

interface RoleDetail extends Role {
  role_permissions: Array<{ id: number; pageKey: string }>;
  _count: {
    role_permissions: number;
    auth_users: number;
  };
}

interface RolesContentProps {
  username: string;
}

export default function RolesContent({ username }: RolesContentProps) {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<RoleDetail | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    isSuperAdmin: false,
    permissions: [] as string[]
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchRoles = async () => {
    setLoading(true);
    try {
      console.log("Fetching roles...");
      const res = await fetch("/api/roles");
      console.log("Roles response status:", res.status);
      if (res.ok) {
        const data = await res.json();
        console.log("Roles data:", data);
        setRoles(data);
      } else {
        console.error("Failed to fetch roles, status:", res.status);
        toast.error("Failed to fetch roles");
      }
    } catch (err) {
      console.error("Failed to fetch roles", err);
      toast.error("Failed to fetch roles");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const handleAdd = async () => {
    if (!formData.name.trim()) {
      toast.error("Role name is required");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success("Role created successfully");
        setAddDialogOpen(false);
        setFormData({ name: '', isSuperAdmin: false, permissions: [] });
        fetchRoles();
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to create role");
      }
    } catch (err) {
      console.error("Failed to create role", err);
      toast.error("Failed to create role");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedRole || !formData.name.trim()) {
      toast.error("Role name is required");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/roles/${selectedRole.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success("Role updated successfully");
        setEditDialogOpen(false);
        setSelectedRole(null);
        setFormData({ name: '', isSuperAdmin: false, permissions: [] });
        fetchRoles();
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

  const handleDelete = async () => {
    if (!selectedRole) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/roles/${selectedRole.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Role deleted successfully");
        setDeleteDialogOpen(false);
        setSelectedRole(null);
        fetchRoles();
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to delete role");
      }
    } catch (err) {
      console.error("Failed to delete role", err);
      toast.error("Failed to delete role");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditDialog = async (role: Role) => {
    try {
      const res = await fetch(`/api/roles/${role.id}`);
      if (res.ok) {
        const roleDetail: RoleDetail = await res.json();
        setSelectedRole(roleDetail);
        setFormData({
          name: roleDetail.name,
          isSuperAdmin: roleDetail.isSuperAdmin,
          permissions: roleDetail.role_permissions.map(p => p.pageKey)
        });
        setEditDialogOpen(true);
      }
    } catch (err) {
      console.error("Failed to fetch role details", err);
      toast.error("Failed to fetch role details");
    }
  };

  const openDeleteDialog = async (role: Role) => {
    try {
      const res = await fetch(`/api/roles/${role.id}`);
      if (res.ok) {
        const roleDetail: RoleDetail = await res.json();
        setSelectedRole(roleDetail);
        setDeleteDialogOpen(true);
      }
    } catch (err) {
      console.error("Failed to fetch role details", err);
      toast.error("Failed to fetch role details");
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

  const selectAllInGroup = (group: string) => {
    const groupKeys = ALL_PAGE_KEYS.filter(p => p.group === group).map(p => p.key);
    const allSelected = groupKeys.every(key => formData.permissions.includes(key));
    
    setFormData(prev => ({
      ...prev,
      permissions: allSelected
        ? prev.permissions.filter(p => !groupKeys.includes(p))
        : [...new Set([...prev.permissions, ...groupKeys])]
    }));
  };

  const groupedPages = ALL_PAGE_KEYS.reduce((acc, page) => {
    if (!acc[page.group]) acc[page.group] = [];
    acc[page.group].push(page);
    return acc;
  }, {} as Record<string, typeof ALL_PAGE_KEYS>);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Roles</h1>
          <p className="text-sm text-gray-500 mt-1">Manage user roles and page access permissions</p>
        </div>
        <Button
          onClick={() => setAddDialogOpen(true)}
          className="min-h-[44px] bg-[#E5262C] hover:bg-[#c91e24] text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Role
        </Button>
      </div>



      {/* Table Card */}
      <Card className="bg-white/60 backdrop-blur-md border border-white/40 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] rounded-2xl">
        <CardHeader>
          <CardTitle>All Roles</CardTitle>
        </CardHeader>
        <CardContent>
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
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead className="w-32">Type</TableHead>
                    <TableHead className="w-32">Permissions</TableHead>
                    <TableHead className="w-40">Updated At</TableHead>
                    <TableHead className="w-32">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roles.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                        No roles found
                      </TableCell>
                    </TableRow>
                  ) : (
                    roles.map((role) => (
                      <TableRow key={role.id}>
                        <TableCell className="font-medium">{role.name}</TableCell>
                        <TableCell>
                          {role.isSuperAdmin ? (
                            <Badge className="bg-[#E5262C] text-white">Super Admin</Badge>
                          ) : (
                            <Badge variant="outline">Standard</Badge>
                          )}
                        </TableCell>
                        <TableCell>{role._count.role_permissions} pages</TableCell>
                        <TableCell>{formatWIBDate(role.updatedAt)}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditDialog(role)}
                              className="h-8 w-8 p-0"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openDeleteDialog(role)}
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
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
        </CardContent>
      </Card>

      {/* Add Role Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Role</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="name">Role Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Content Manager"
                className="mt-1"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isSuperAdmin"
                checked={formData.isSuperAdmin}
                onCheckedChange={(checked) => {
                  setFormData({ 
                    ...formData, 
                    isSuperAdmin: checked as boolean,
                    permissions: checked ? [] : formData.permissions
                  });
                }}
              />
              <Label htmlFor="isSuperAdmin">Super Admin (has access to all pages)</Label>
            </div>
            {!formData.isSuperAdmin && (
              <div className="space-y-4">
                <Label>Page Permissions</Label>
                {Object.entries(groupedPages).map(([group, pages]) => (
                  <div key={group} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-sm">{group}</h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => selectAllInGroup(group)}
                        className="text-xs h-7"
                      >
                        Select All
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-2 pl-4">
                      {pages.map((page) => (
                        <div key={page.key} className="flex items-center space-x-2">
                          <Checkbox
                            id={`page-${page.key}`}
                            checked={formData.permissions.includes(page.key)}
                            onCheckedChange={() => togglePermission(page.key)}
                          />
                          <Label htmlFor={`page-${page.key}`} className="text-sm">
                            {page.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAdd}
              disabled={isSubmitting}
              className="bg-[#E5262C] hover:bg-[#c91e24] text-white"
            >
              {isSubmitting ? "Creating..." : "Create Role"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Role Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Role</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="edit-name">Role Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Content Manager"
                className="mt-1"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="edit-isSuperAdmin"
                checked={formData.isSuperAdmin}
                onCheckedChange={(checked) => {
                  setFormData({ 
                    ...formData, 
                    isSuperAdmin: checked as boolean,
                    permissions: checked ? [] : formData.permissions
                  });
                }}
              />
              <Label htmlFor="edit-isSuperAdmin">Super Admin (has access to all pages)</Label>
            </div>
            {!formData.isSuperAdmin && (
              <div className="space-y-4">
                <Label>Page Permissions</Label>
                {Object.entries(groupedPages).map(([group, pages]) => (
                  <div key={group} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-sm">{group}</h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => selectAllInGroup(group)}
                        className="text-xs h-7"
                      >
                        Select All
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-2 pl-4">
                      {pages.map((page) => (
                        <div key={page.key} className="flex items-center space-x-2">
                          <Checkbox
                            id={`edit-page-${page.key}`}
                            checked={formData.permissions.includes(page.key)}
                            onCheckedChange={() => togglePermission(page.key)}
                          />
                          <Label htmlFor={`edit-page-${page.key}`} className="text-sm">
                            {page.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {selectedRole && selectedRole._count.auth_users > 0 && (
              <p className="text-sm text-amber-600">
                ⚠️ {selectedRole._count.auth_users} user(s) are assigned to this role
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleEdit}
              disabled={isSubmitting}
              className="bg-[#E5262C] hover:bg-[#c91e24] text-white"
            >
              {isSubmitting ? "Updating..." : "Update Role"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Role</DialogTitle>
          </DialogHeader>
          {selectedRole && (
            <div className="py-4">
              {selectedRole._count.auth_users > 0 ? (
                <p className="text-red-600">
                  Cannot delete role "{selectedRole.name}" because {selectedRole._count.auth_users} user(s) are assigned to it.
                  Please reassign these users to another role first.
                </p>
              ) : (
                <p>
                  Are you sure you want to delete the role "{selectedRole.name}"? This action cannot be undone.
                </p>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              disabled={isSubmitting || (selectedRole?._count.auth_users ?? 0) > 0}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isSubmitting ? "Deleting..." : "Delete Role"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
