"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Save, X } from "lucide-react";
import Link from "next/link";
import PagePermissionSelector from "@/components/PagePermissionSelector";

interface RolesAddContentProps {
  userEmail: string | null;
}

export default function RolesAddContent({ userEmail }: RolesAddContentProps) {
  const router = useRouter();
  
  // Form states
  const [formData, setFormData] = useState({
    name: '',
    isSuperAdmin: false,
    permissions: [] as string[]
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        router.push("/admin-control-panel/roles");
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
          <h1 className="text-2xl font-bold">Add Role</h1>
          <p className="text-sm text-muted-foreground">Create a new role with specific permissions</p>
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
            <Button onClick={handleAdd} disabled={isSubmitting}>
              <Save className="h-4 w-4 mr-2" />
              {isSubmitting ? "Creating..." : "Create Role"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
