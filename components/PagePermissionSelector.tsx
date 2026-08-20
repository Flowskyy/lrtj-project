"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface PageKey {
  key: string;
  label: string;
  group: string;
  disabled?: boolean;
}

// Permission list derived from DashboardLayoutClient NAV_ITEMS structure
// Groups match sidebar exactly: Merchandise, Master, Security
// Flat items (Users, News, Notifications, LarataClub History) are grouped as "Main Navigation"
// Dashboard is excluded as it's accessible to all roles by default
const ALL_PAGE_KEYS: PageKey[] = [
  // Main Navigation (flat items from sidebar, excluding Dashboard)
  { key: 'users', label: 'Users', group: 'Main Navigation' },
  { key: 'news', label: 'News', group: 'Main Navigation' },
  { key: 'notifications', label: 'Notifications', group: 'Main Navigation' },
  { key: 'larata-club-earning', label: 'LarataClub History', group: 'Main Navigation' },
  
  // Merchandise group (matches sidebar Merchandise submenu)
  { key: 'merchandise', label: 'Merchandise', group: 'Merchandise' },
  { key: 'redeem-merchandise', label: 'Redeem Merchandise', group: 'Merchandise' },
  
  // Master group (matches sidebar Master submenu)
  { key: 'master-merchandise-category', label: 'Merchandise Category', group: 'Master' },
  { key: 'master-welcome-point', label: 'Welcome Point', group: 'Master' },
  { key: 'master-banner', label: 'Banner', group: 'Master' },
  { key: 'master-popups', label: 'Popups', group: 'Master' },
  { key: 'master-membership', label: 'Membership', group: 'Master' },
  
  // Security group (matches sidebar Security submenu - was "Admin Control Panel")
  { key: 'master-roles', label: 'Roles', group: 'Security' },
  { key: 'master-admin-management', label: 'Admin Management', group: 'Security' },
  { key: 'master-invitation', label: 'Invitation', group: 'Security' },
  { key: 'master-activity-log', label: 'Activity Log', group: 'Security' },
  
  // Redeem Benefit (standalone, not in sidebar - keep as disabled)
  { key: 'redeem-benefit', label: 'Redeem Benefit', group: 'Unavailable', disabled: true },
  
  // Daily Benefit (standalone, not in sidebar - keep as disabled)
  { key: 'daily-benefit', label: 'Daily Benefit', group: 'Unavailable', disabled: true },
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
      .filter(p => p.group === group && !p.disabled)
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
  }, {} as Record<string, PageKey[]>);

  // Sort groups to match sidebar order exactly
  const groupOrder = ['Main Navigation', 'Merchandise', 'Master', 'Security', 'Unavailable'];
  const sortedGroups = Object.keys(groupedPages).sort((a, b) => {
    const indexA = groupOrder.indexOf(a);
    const indexB = groupOrder.indexOf(b);
    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;
    return a.localeCompare(b);
  }) as string[];

  return (
    <div className="space-y-4">
      <div>
        <Label>Page Permissions</Label>
        <p className="text-xs text-muted-foreground mt-1">
          Select which pages this role can access
        </p>
      </div>

      {sortedGroups.map((group) => (
        <Card key={group} className="border">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">{group}</CardTitle>
              {!groupedPages[group].every(p => p.disabled) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => selectAllInGroup(group)}
                  disabled={disabled}
                >
                  {groupedPages[group].filter(p => !p.disabled).every(p => selectedPermissions.includes(p.key))
                    ? "Deselect All"
                    : "Select All"}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {groupedPages[group].map((page) => (
                <div 
                  key={page.key} 
                  className={`flex items-center space-x-2 ${page.disabled ? 'opacity-50' : ''}`}
                >
                  <Checkbox
                    id={page.key}
                    checked={selectedPermissions.includes(page.key)}
                    onCheckedChange={() => !page.disabled && onPermissionToggle(page.key)}
                    disabled={disabled || page.disabled}
                  />
                  <div className="flex items-center space-x-2">
                    <Label
                      htmlFor={page.key}
                      className={`text-sm font-normal ${page.disabled ? 'cursor-not-allowed text-muted-foreground' : 'cursor-pointer'}`}
                    >
                      {page.label}
                    </Label>
                    {page.disabled && (
                      <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded">
                        Unavailable
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
