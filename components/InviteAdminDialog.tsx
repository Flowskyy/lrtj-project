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

interface Role {
  id: number;
  name: string;
}

interface InviteAdminDialogProps {
  onInviteSent?: () => void;
}

export default function InviteAdminDialog({ onInviteSent }: InviteAdminDialogProps) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [roleId, setRoleId] = useState("");
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingRoles, setFetchingRoles] = useState(true);

  const fetchRoles = async () => {
    setFetchingRoles(true);
    try {
      const res = await fetch("/api/roles");
      if (res.ok) {
        const data = await res.json();
        setRoles(data);
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
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !roleId) {
      toast.error("Please fill in all fields");
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Invalid email format");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin-invitations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, roleId }),
      });

      if (res.ok) {
        const data = await res.json();
        toast.success(data.message || "Invitation sent successfully");
        setEmail("");
        setRoleId("");
        setOpen(false);
        onInviteSent?.();
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to send invitation");
      }
    } catch (err) {
      console.error("Failed to send invitation", err);
      toast.error("Failed to send invitation");
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
        Invite Admin
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          showCloseButton={false}
          className="max-w-md bg-white/75 backdrop-blur-xl border border-white/50 shadow-[0_8px_32px_0_rgba(31,38,135,0.1)] rounded-2xl p-0 overflow-hidden"
        >
          {/* Modal Header */}
          <div className="px-6 pt-6 pb-4 border-b border-white/30">
            <DialogTitle className="text-xl font-semibold text-gray-900">
              Invite New Admin
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-600 mt-1">
              Send an invitation email to a new admin. They will receive a secure link to complete their registration.
            </DialogDescription>
          </div>

          {/* Modal Body */}
          <div className="px-6 py-5">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  className="h-11 bg-white/60 border-gray-200/50 focus:border-[#E5262C] focus:ring-[#E5262C]/20"
                />
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
                    className="h-11 bg-white/60 border-gray-200/50 focus:border-[#E5262C] focus:ring-[#E5262C]/20"
                  >
                    <SelectValue placeholder={fetchingRoles ? "Loading roles..." : "Select a role"} />
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

              <DialogFooter className="pt-4 flex gap-3">
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
                  {loading ? "Sending..." : "Send Invitation"}
                </Button>
              </DialogFooter>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
