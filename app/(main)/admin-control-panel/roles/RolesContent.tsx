"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import { Plus, Pencil, Trash2, GripVertical, Shield, Crown } from "lucide-react";
import { formatWIBDate } from "@/lib/formatWIBDate";
import { useUnsavedChanges } from "@/contexts/UnsavedChangesContext";
import Link from "next/link";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { restrictToVerticalAxis, restrictToWindowEdges } from "@dnd-kit/modifiers";

interface Role {
  id: number;
  name: string;
  isSuperAdmin: boolean;
  tier: number;
  createdAt: string;
  updatedAt: string;
  _count: {
    role_permissions: number;
    auth_users: number;
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

function StaticRoleCard({ role, onDelete }: { role: Role; onDelete: (role: Role) => void }) {
  return (
    <div className="relative">
      <Card className={`bg-white/60 backdrop-blur-md border border-white/40 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] rounded-2xl hover:shadow-lg transition-shadow ${role.isSuperAdmin ? 'border-amber-200 bg-amber-50/30' : ''}`}>
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            {/* Static Icon */}
            <div className="flex-shrink-0 pt-1 w-5">
              {role.isSuperAdmin && <Crown className="h-5 w-5 text-amber-500" />}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {role.name}
                </p>
                {role.isSuperAdmin && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
                    <Crown className="h-3 w-3 mr-1" />
                    Super Admin
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Tier: {role.tier}{role.isSuperAdmin && ' (Locked)'}
              </p>
              <div className="mt-2 space-y-1">
                <div className="text-xs text-gray-500">
                  <span className="font-medium">Permissions:</span> {role._count.role_permissions} pages
                </div>
                <div className="text-xs text-gray-500">
                  <span className="font-medium">Users:</span> {role._count.auth_users || 0}
                </div>
                <div className="text-xs text-gray-500">
                  <span className="font-medium">Updated:</span> {formatWIBDate(role.updatedAt)}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <Link href={`/admin-control-panel/roles/edit/${role.id}`}>
                <Button variant="ghost" size="sm">
                  <Pencil className="h-4 w-4" />
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(role)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                disabled={role.isSuperAdmin}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SortableRoleCard({ role, onDelete, canDrag }: { role: Role; onDelete: (role: Role) => void; canDrag: boolean }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: role.id, disabled: !canDrag });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? 'none' : 'transform 150ms cubic-bezier(0.2, 0, 0, 1)',
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative">
      <Card className={`bg-white/60 backdrop-blur-md border border-white/40 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] rounded-2xl hover:shadow-lg transition-shadow`}>
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            {/* Drag Handle */}
            {canDrag ? (
              <div
                {...attributes}
                {...listeners}
                className="cursor-grab active:cursor-grabbing flex-shrink-0 pt-1"
              >
                <GripVertical className="h-5 w-5 text-gray-400 hover:text-gray-600" />
              </div>
            ) : (
              <div className="flex-shrink-0 pt-1 w-5">
                <GripVertical className="h-5 w-5 text-gray-300" />
              </div>
            )}

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {role.name}
                </p>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Tier: {role.tier}
              </p>
              <div className="mt-2 space-y-1">
                <div className="text-xs text-gray-500">
                  <span className="font-medium">Permissions:</span> {role._count.role_permissions} pages
                </div>
                <div className="text-xs text-gray-500">
                  <span className="font-medium">Users:</span> {role._count.auth_users || 0}
                </div>
                <div className="text-xs text-gray-500">
                  <span className="font-medium">Updated:</span> {formatWIBDate(role.updatedAt)}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <Link href={`/admin-control-panel/roles/edit/${role.id}`}>
                <Button variant="ghost" size="sm">
                  <Pencil className="h-4 w-4" />
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(role)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function RoleDragOverlay({ role }: { role: Role }) {
  return (
    <Card className={`bg-white/95 backdrop-blur-xl border border-white/70 shadow-[0_20px_60px_0_rgba(31,38,135,0.3)] rounded-2xl rotate-1 scale-105`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Drag Handle */}
          <div className="cursor-grab active:cursor-grabbing flex-shrink-0 pt-1">
            <GripVertical className="h-5 w-5 text-gray-400" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-gray-900 truncate">
                {role.name}
              </p>
              {role.isSuperAdmin && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
                  <Crown className="h-3 w-3 mr-1" />
                  Super Admin
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Tier: {role.tier}
            </p>
            <div className="mt-2 space-y-1">
              <div className="text-xs text-gray-500">
                <span className="font-medium">Permissions:</span> {role._count.role_permissions} pages
              </div>
              <div className="text-xs text-gray-500">
                <span className="font-medium">Users:</span> {role._count.auth_users || 0}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function RolesContent({ }: RolesContentProps) {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserTier, setCurrentUserTier] = useState<number | null>(null);
  const [isCurrentUserSuperAdmin, setIsCurrentUserSuperAdmin] = useState(false);

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<RoleDetail | null>(null);

  // Reorder state
  const [originalRoles, setOriginalRoles] = useState<Role[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeId, setActiveId] = useState<number | null>(null);

  // DnD sensors with modifiers for boundary constraints
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/roles?page=1&limit=100");
      if (res.ok) {
        const data = await res.json();
        // Sort by tier to display in correct order
        const sortedRoles = (data.roles || []).sort((a: Role, b: Role) => a.tier - b.tier);
        setRoles(sortedRoles);
        setOriginalRoles(sortedRoles);
        setHasUnsavedChanges(false);
      }
    } catch (err) {
      console.error("Failed to fetch roles", err);
      toast.error("Failed to fetch roles");
    } finally {
      setLoading(false);
    }
  };

  // Fetch current user's role tier for authorization
  const fetchCurrentUserRole = async () => {
    try {
      const res = await fetch("/api/auth/session");
      if (res.ok) {
        const session = await res.json();
        if (session?.user?.roleId) {
          const roleRes = await fetch(`/api/roles/${session.user.roleId}`);
          if (roleRes.ok) {
            const role = await roleRes.json();
            setCurrentUserTier(role.tier);
            setIsCurrentUserSuperAdmin(role.isSuperAdmin);
          }
        }
      }
    } catch (err) {
      console.error("Failed to fetch current user role", err);
    }
  };

  useEffect(() => {
    fetchRoles();
    fetchCurrentUserRole();
  }, []);

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id as number);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      const nonSuperAdminRoles = roles.filter(r => !r.isSuperAdmin);
      const oldIndex = nonSuperAdminRoles.findIndex((r) => r.id === active.id);
      const newIndex = nonSuperAdminRoles.findIndex((r) => r.id === over.id);

      const newNonSuperAdminRoles = arrayMove(nonSuperAdminRoles, oldIndex, newIndex);

      // Update tier values: Super Admin stays at tier 1, others start at tier 2
      const reorderedNonSuperAdminRoles = newNonSuperAdminRoles.map((role, index) => ({
        ...role,
        tier: index + 2, // Start at tier 2 since Super Admin is tier 1
      }));

      // Reconstruct full roles array with Super Admin at the beginning
      const superAdminRole = roles.find(r => r.isSuperAdmin);
      const newRoles = superAdminRole
        ? [superAdminRole, ...reorderedNonSuperAdminRoles]
        : reorderedNonSuperAdminRoles;

      setRoles(newRoles);
      setHasUnsavedChanges(true);
    }
  };

  const [isDeleting, setIsDeleting] = useState(false);
  const handleDelete = async () => {
    if (!selectedRole) return;
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/roles/${selectedRole.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Role deleted successfully");
        setDeleteDialogOpen(false);
        setSelectedRole(null);
        setHasUnsavedChanges(false);
        fetchRoles();
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to delete role");
      }
    } catch (err) {
      console.error("Failed to delete role", err);
      toast.error("Failed to delete role");
    } finally {
      setIsDeleting(false);
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

  const handleSaveOrder = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/roles/reorder", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: roles.map((r) => ({ id: r.id, tier: r.tier })),
        }),
      });

      if (res.ok) {
        toast.success("Role order updated");
        setOriginalRoles(roles);
        setHasUnsavedChanges(false);
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to update order");
        setRoles(originalRoles);
      }
    } catch (err) {
      console.error("Failed to reorder roles", err);
      toast.error("Failed to update order");
      setRoles(originalRoles);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelOrder = () => {
    setRoles(originalRoles);
    setHasUnsavedChanges(false);
  };

  // Check if a role can be dragged based on tier authorization
  const canDragRole = (role: Role) => {
    if (role.isSuperAdmin) return false; // Super Admin is always locked
    if (isCurrentUserSuperAdmin) return true; // Super Admin can drag everything except Super Admin
    if (currentUserTier === null) return false;
    return role.tier > currentUserTier; // Can only drag roles at lower tiers (higher tier numbers)
  };

  // Register unsaved changes with global context
  const { registerUnsavedChanges, unregisterUnsavedChanges } = useUnsavedChanges();

  useEffect(() => {
    if (hasUnsavedChanges) {
      registerUnsavedChanges({
        hasUnsavedChanges: true,
        onDiscard: handleCancelOrder,
        description: "You have unsaved changes to the role order. These changes will be lost if you continue.",
      });
    } else {
      unregisterUnsavedChanges();
    }
  }, [hasUnsavedChanges, registerUnsavedChanges, unregisterUnsavedChanges]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Roles</h1>
          <p className="text-sm text-gray-500 mt-1">Manage user roles and page access permissions</p>
        </div>
        <Link href="/admin-control-panel/roles/add">
          <Button className="bg-[#E5262C] hover:bg-[#c41e22] text-white">
            <Plus className="h-4 w-4 mr-2" />
            Add Role
          </Button>
        </Link>
      </div>

      {/* Roles List */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : roles.length === 0 ? (
        <div className="text-center py-12">
          <Shield className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No roles found</p>
          <p className="text-sm text-gray-400 mt-1">Add your first role to get started</p>
        </div>
      ) : (
        <>
          {/* Super Admin - Fixed at top, not in sortable context */}
          {roles.find(r => r.isSuperAdmin) && (
            <StaticRoleCard
              key={roles.find(r => r.isSuperAdmin)!.id}
              role={roles.find(r => r.isSuperAdmin)!}
              onDelete={openDeleteDialog}
            />
          )}

          {/* Other roles - Sortable */}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            modifiers={[restrictToVerticalAxis, restrictToWindowEdges]}
          >
            <SortableContext
              items={roles.filter(r => !r.isSuperAdmin).map((r) => r.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-3">
                {roles.filter(r => !r.isSuperAdmin).map((role) => (
                  <SortableRoleCard
                    key={role.id}
                    role={role}
                    onDelete={openDeleteDialog}
                    canDrag={canDragRole(role)}
                  />
                ))}
              </div>
            </SortableContext>
            <DragOverlay>
              {activeId ? (
                <RoleDragOverlay role={roles.find((r) => r.id === activeId)!} />
              ) : null}
            </DragOverlay>
          </DndContext>
        </>
      )}

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Role"
        itemName={selectedRole?.name}
        description={
          (selectedRole?._count.auth_users ?? 0) > 0
            ? `Cannot delete role "${selectedRole?.name}" because ${selectedRole?._count.auth_users ?? 0} user(s) are assigned to it. Please reassign these users to another role first.`
            : `Are you sure you want to delete the role "${selectedRole?.name}"?`
        }
        onConfirm={handleDelete}
        isDeleting={isDeleting}
        disableConfirm={(selectedRole?._count.auth_users ?? 0) > 0 || selectedRole?.isSuperAdmin}
      />

      {/* Save/Cancel Footer Bar */}
      {hasUnsavedChanges && (
        <div className="bg-white/70 backdrop-blur-md border border-white/40 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] rounded-2xl p-4 mt-6">
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={handleCancelOrder}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              className="bg-[#E5262C] hover:bg-[#c41e22] text-white"
              onClick={handleSaveOrder}
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
