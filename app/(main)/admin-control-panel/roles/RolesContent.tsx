"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Pencil, Trash2, Shield, Plus } from "lucide-react";
import { formatWIBDate } from "@/lib/formatWIBDate";
import Link from "next/link";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";

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
  // No props needed anymore
}

export default function RolesContent({ }: RolesContentProps) {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  // Delete dialog states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<RoleDetail | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/roles");
      if (res.ok) {
        const data = await res.json();
        setRoles(data.roles || []);
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

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Roles</h1>
          <p className="text-sm text-gray-500 mt-1">Manage user roles and page access permissions</p>
        </div>
        <Link href="/admin-control-panel/roles/add">
          <Button className="min-h-[44px] bg-[#E5262C] hover:bg-[#c91e24] text-white">
            <Plus className="h-4 w-4 mr-2" />
            Add Role
          </Button>
        </Link>
      </div>



      {/* Table Card */}
      <Card className="bg-white/60 backdrop-blur-md border border-white/40 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] rounded-2xl">
        <CardHeader>
          <CardTitle>All Roles</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-gray-50 sticky top-0 border-b border-gray-200 z-10">
                  <TableRow>
                    <TableHead className="px-2 py-1.5 text-[11px] font-semibold text-gray-600 uppercase tracking-wider">Name</TableHead>
                    <TableHead className="px-2 py-1.5 text-[11px] font-semibold text-gray-600 uppercase tracking-wider w-32">Permissions</TableHead>
                    <TableHead className="px-2 py-1.5 text-[11px] font-semibold text-gray-600 uppercase tracking-wider w-40">Updated At</TableHead>
                    <TableHead className="px-2 py-1.5 text-[11px] font-semibold text-gray-600 uppercase tracking-wider w-32">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-200">
                  {[...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell className="px-2 py-1.5"><Skeleton className="h-3 w-32" /></TableCell>
                      <TableCell className="px-2 py-1.5"><Skeleton className="h-3 w-20" /></TableCell>
                      <TableCell className="px-2 py-1.5"><Skeleton className="h-3 w-28" /></TableCell>
                      <TableCell className="px-2 py-1.5"><Skeleton className="h-5 w-16" /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-gray-50 sticky top-0 border-b border-gray-200 z-10">
                  <TableRow>
                    <TableHead className="px-2 py-1.5 text-[11px] font-semibold text-gray-600 uppercase tracking-wider">Name</TableHead>
                    <TableHead className="px-2 py-1.5 text-[11px] font-semibold text-gray-600 uppercase tracking-wider w-32">Permissions</TableHead>
                    <TableHead className="px-2 py-1.5 text-[11px] font-semibold text-gray-600 uppercase tracking-wider w-40">Updated At</TableHead>
                    <TableHead className="px-2 py-1.5 text-[11px] font-semibold text-gray-600 uppercase tracking-wider w-32">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-200">
                  {roles.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-gray-500 px-4 py-12 text-xs">
                        No roles found
                      </TableCell>
                    </TableRow>
                  ) : (
                    roles.map((role) => (
                      <TableRow key={role.id} className="hover:bg-gray-50 transition-colors">
                        <TableCell className="px-2 py-1.5 text-[11px] font-medium text-gray-900">{role.name}</TableCell>
                        <TableCell className="px-2 py-1.5 text-[11px] text-gray-600">{role._count.role_permissions} pages</TableCell>
                        <TableCell className="px-2 py-1.5 text-[11px] text-gray-600">{formatWIBDate(role.updatedAt)}</TableCell>
                        <TableCell className="px-2 py-1.5">
                          <div className="flex gap-2">
                            <Link href={`/admin-control-panel/roles/edit/${role.id}`}>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </Link>
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

      {/* Delete Confirmation Dialog */}
      {selectedRole && (
        <DeleteConfirmDialog
          open={deleteDialogOpen}
          onOpenChange={(open) => {
            setDeleteDialogOpen(open);
            if (!open) setSelectedRole(null);
          }}
          title="Delete Role"
          itemName={selectedRole.name}
          description={
            (selectedRole._count.auth_users ?? 0) > 0
              ? `Cannot delete role "${selectedRole.name}" because ${selectedRole._count.auth_users ?? 0} user(s) are assigned to it. Please reassign these users to another role first.`
              : `Are you sure you want to delete the role "${selectedRole.name}"?`
          }
          onConfirm={handleDelete}
          isDeleting={isSubmitting}
          disableConfirm={(selectedRole._count.auth_users ?? 0) > 0}
        />
      )}
    </div>
  );
}
