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
        <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite New Admin</DialogTitle>
          <DialogDescription>
            Send an invitation email to a new admin. They will receive a secure link to complete their registration.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select
                value={roleId}
                onValueChange={setRoleId}
                disabled={loading || fetchingRoles}
              >
                <SelectTrigger id="role">
                  <SelectValue placeholder={fetchingRoles ? "Loading roles..." : "Select a role"} />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id.toString()}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-[#E5262C] hover:bg-[#c41f24] text-white"
              disabled={loading || !email || !roleId}
            >
              {loading ? "Sending..." : "Send Invitation"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
    </>
  );
}
