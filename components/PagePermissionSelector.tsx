"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const ALL_PAGE_KEYS = [
  { key: 'dashboard', label: 'Dashboard', group: 'Main' },
  { key: 'users', label: 'Users', group: 'Main' },
  { key: 'news', label: 'News', group: 'Main' },
  { key: 'notifications', label: 'Notifications', group: 'Main' },
  { key: 'larata-club-earning', label: 'LarataClub History', group: 'Main' },
  { key: 'merchandise', label: 'Merchandise', group: 'Merchandise' },
  { key: 'redeem-merchandise', label: 'Redeem Merchandise', group: 'Merchandise' },
  { key: 'redeem-benefit', label: 'Redeem Benefit', group: 'Daily Benefit' },
  { key: 'master-merchandise-category', label: 'Merchandise Category', group: 'Master' },
  { key: 'master-welcome-point', label: 'Welcome Point', group: 'Master' },
  { key: 'master-banner', label: 'Banner', group: 'Master' },
  { key: 'master-popups', label: 'Popups', group: 'Master' },
  { key: 'master-membership', label: 'Membership', group: 'Master' },
  { key: 'master-roles', label: 'Roles', group: 'Master' },
  { key: 'master-admin-management', label: 'Admin Management', group: 'Admin Control Panel' },
  { key: 'master-invitation', label: 'Invitation', group: 'Admin Control Panel' },
  { key: 'master-activity-log', label: 'Activity Log', group: 'Admin Control Panel' },
];

interface PagePermissionSelectorProps {
  selectedPermissions: string[];
  onPermissionToggle: (pageKey: string) => void;
  onBatchPermissionChange: (newPermissions: string[]) => void;
  disabled?: boolean;
}

export default function PagePermissionSelector({
  selectedPermissions,
  onPermissionToggle,
  onBatchPermissionChange,
  disabled = false
}: PagePermissionSelectorProps) {
  const selectAllInGroup = (group: string) => {
    const groupKeys = ALL_PAGE_KEYS
      .filter(p => p.group === group)
      .map(p => p.key);
    const allSelected = groupKeys.every(key => selectedPermissions.includes(key));
    
    if (allSelected) {
      // Deselect all in group
      const newPermissions = selectedPermissions.filter(p => !groupKeys.includes(p));
      onBatchPermissionChange(newPermissions);
    } else {
      // Select all in group
      const newPermissions = [...new Set([...selectedPermissions, ...groupKeys])];
      onBatchPermissionChange(newPermissions);
    }
  };

  const groupedPages = ALL_PAGE_KEYS.reduce((acc, page) => {
    if (!acc[page.group]) acc[page.group] = [];
    acc[page.group].push(page);
    return acc;
  }, {} as Record<string, typeof ALL_PAGE_KEYS>);

  return (
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
                disabled={disabled}
              >
                {pages.every(p => selectedPermissions.includes(p.key))
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
                    checked={selectedPermissions.includes(page.key)}
                    onCheckedChange={() => onPermissionToggle(page.key)}
                    disabled={disabled}
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
  );
}
