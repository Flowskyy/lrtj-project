"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

interface AddAdminDialogProps {
  onAdminAdded?: () => void;
}

export default function AddAdminDialog({ onAdminAdded }: AddAdminDialogProps) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [roleId, setRoleId] = useState("");
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
      setAction('creating', 'Microsoft Admin');
    } else {
      clearAction();
    }
  }, [open, setAction, clearAction]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !roleId) {
      toast.error("Please fill in all fields");
      return;
    }

    // Client-side domain validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Invalid email format");
      return;
    }

    if (!email.endsWith('@lrtjakarta.co.id')) {
      toast.error("Email must end with @lrtjakarta.co.id for Microsoft SSO users");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin-users/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, roleId }),
      });

      if (res.ok) {
        const data = await res.json();
        toast.success(data.message || "Admin added successfully");
        setEmail("");
        setRoleId("");
        setOpen(false);
        onAdminAdded?.();
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to add admin");
      }
    } catch (err) {
      console.error("Failed to add admin", err);
      toast.error("Failed to add admin");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button 
        variant="default" 
        className="bg-[#E5262C] hover:bg-[#c41f24] text-white"
        onClick={() => setOpen(true)}
      >
        Add Admin
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          showCloseButton={false}
          className="max-w-md bg-white/90 backdrop-blur-md border border-gray-200/80 shadow-sm rounded-lg p-0 overflow-hidden"
        >
          {/* Modal Header */}
          <div className="px-6 pt-6 pb-1 border-b border-white/30">
            <DialogTitle className="text-xl font-semibold text-gray-900">
              Add Microsoft Admin
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-600 mt-1">
              Pre-provision a Microsoft SSO user account. They will authenticate via Microsoft using their @lrtjakarta.co.id email.
            </DialogDescription>
          </div>

          {/* Modal Body */}
          <div className="px-4 py-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="user@lrtjakarta.co.id"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  className="h-11 px-4 bg-white/60 border-gray-200/50 focus:border-[#E5262C] focus:ring-[#E5262C]/20"
                />
                <p className="text-xs text-gray-500">Must be a @lrtjakarta.co.id email for Microsoft SSO</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="role" className="text-sm font-medium text-gray-700">
                  Role
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
                  onClick={() => setOpen(false)}
                  disabled={loading}
                  className="flex-1 h-11 bg-white/60 border-gray-200/50 hover:bg-white/80 text-gray-700"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 h-11 bg-[#E5262C] hover:bg-[#c41f24] text-white font-medium shadow-sm"
                  disabled={loading || !email || !roleId}
                >
                  {loading ? "Adding..." : "Add Admin"}
                </Button>
              </DialogFooter>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}