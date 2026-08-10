"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Save, X } from "lucide-react";
import Link from "next/link";

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

interface RolesAddContentProps {
  username: string;
  userEmail: string | null;
}

export default function RolesAddContent({ username, userEmail }: RolesAddContentProps) {
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
        router.push("/master/roles");
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
      <div className="flex items-center gap-4">
        <Link href="/master/roles">
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
            <div className="space-y-4">
              <div>
                <Label>Page Permissions</Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Select which pages this role can access
                </p>
              </div>

              {Object.entries(groupedPages).map(([group, pages]) => (
                <Card key={group} className="border">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{group}</CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => selectAllInGroup(group)}
                        disabled={isSubmitting}
                      >
                        {pages.every(p => formData.permissions.includes(p.key))
                          ? "Deselect All"
                          : "Select All"}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {pages.map((page) => (
                        <div key={page.key} className="flex items-center space-x-2">
                          <Checkbox
                            id={page.key}
                            checked={formData.permissions.includes(page.key)}
                            onCheckedChange={() => togglePermission(page.key)}
                            disabled={isSubmitting}
                          />
                          <Label
                            htmlFor={page.key}
                            className="text-sm font-normal cursor-pointer"
                          >
                            {page.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <Link href="/master/roles">
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
