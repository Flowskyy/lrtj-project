"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAction } from "@/contexts/ActionContext";

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
}

interface ChangeRoleDialogProps {
  user: AdminUser | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRoleChanged?: () => void;
}

export default function ChangeRoleDialog({ user, open, onOpenChange, onRoleChanged }: ChangeRoleDialogProps) {
  const [roleId, setRoleId] = useState<string>("");
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingRoles, setFetchingRoles] = useState(true);
  const { setAction, clearAction } = useAction();

  const fetchRoles = async () => {
    setFetchingRoles(true);
    try {
      const res = await fetch("/api/roles");
      if (res.ok) {
        const data = await res.json();
        setRoles(data.roles || []);
      }
    } catch (err) {
      console.error("Failed to fetch roles", err);
      toast.error("Failed to load roles");
    } finally {
      setFetchingRoles(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchRoles();
      // Set current role when dialog opens
      if (user?.roleId) {
        setRoleId(user.roleId.toString());
      } else {
        setRoleId("");
      }
      setAction('editing', 'Admin Role');
    } else {
      clearAction();
    }
  }, [open, user, setAction, clearAction]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !roleId) {
      toast.error("Please select a role");
      return;
    }

    // Check if role is actually being changed
    if (user.roleId?.toString() === roleId) {
      toast.error("Please select a different role");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/admin-users/${user.id}/role`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ roleId: parseInt(roleId) }),
      });

      if (res.ok) {
        toast.success(`Role changed successfully for "${user.name}"`);
        setRoleId("");
        onOpenChange(false);
        onRoleChanged?.();
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to change role");
      }
    } catch (err) {
      console.error("Failed to change role", err);
      toast.error("Failed to change role");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="max-w-md bg-white/90 backdrop-blur-md border border-gray-200/80 shadow-sm rounded-lg p-0 overflow-hidden"
      >
        {/* Modal Header */}
        <div className="px-6 pt-6 pb-1 border-b border-white/30">
          <DialogTitle className="text-xl font-semibold text-gray-900">
            Change Admin Role
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-600 mt-1">
            Change the role assignment for <span className="font-medium text-gray-900">{user?.name}</span>
          </DialogDescription>
        </div>

        {/* Modal Body */}
        <div className="px-4 py-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-role" className="text-sm font-medium text-gray-700">
                Current Role
              </Label>
              <div className="h-11 px-4 flex items-center bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-600">
                {user?.roleName || "No role assigned"}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role" className="text-sm font-medium text-gray-700">
                New Role
              </Label>
              <Select
                value={roleId}
                onValueChange={(value) => setRoleId(value || "")}
                disabled={loading || fetchingRoles}
              >
                <SelectTrigger 
                  id="role"
                  className="h-11 px-4 bg-white/60 border-gray-200/50 focus:border-[#E5262C] focus:ring-[#E5262C]/20"
                >
                  <SelectValue placeholder={fetchingRoles ? "Loading roles..." : "Select a role"}>
                    {roleId ? roles.find(r => r.id.toString() === roleId)?.name : undefined}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-white/95 backdrop-blur-xl border border-white/50">
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id.toString()}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <DialogFooter className="pt-2 flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
                className="flex-1 h-11 bg-white/60 border-gray-200/50 hover:bg-white/80 text-gray-700"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 h-11 bg-[#E5262C] hover:bg-[#c41f24] text-white font-medium shadow-sm"
                disabled={loading || !roleId || user?.roleId?.toString() === roleId}
              >
                {loading ? "Changing..." : "Change Role"}
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
