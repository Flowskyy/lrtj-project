"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Pencil, Award } from "lucide-react";
import { formatWIBDate } from "@/lib/formatWIBDate";

interface Membership {
  id: number;
  name: string;
  min_trip: number;
  reward_tap_out: number;
  created_at: string;
  updated_at: string;
  updated_by: string;
}

interface MembershipContentProps {
  // No props needed anymore
}

export default function MembershipContent({ }: MembershipContentProps) {
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedMembership, setSelectedMembership] = useState<Membership | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    min_trip: 0,
    reward_tap_out: 0,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchMemberships = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/membership");
      if (res.ok) {
        const data = await res.json();
        setMemberships(data);
      }
    } catch (err) {
      console.error("Failed to fetch memberships", err);
      toast.error("Failed to fetch memberships");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMemberships();
  }, []);

  const handleEdit = async () => {
    if (!selectedMembership) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/membership/${selectedMembership.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success("Membership updated successfully");
        setEditDialogOpen(false);
        setSelectedMembership(null);
        setFormData({ min_trip: 0, reward_tap_out: 0 });
        fetchMemberships();
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to update membership");
      }
    } catch (err) {
      console.error("Failed to update membership", err);
      toast.error("Failed to update membership");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditDialog = (membership: Membership) => {
    setSelectedMembership(membership);
    setFormData({
      min_trip: membership.min_trip,
      reward_tap_out: membership.reward_tap_out,
    });
    setEditDialogOpen(true);
  };



  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Membership</h1>
          <p className="text-sm text-gray-500 mt-1">Manage membership tiers and rewards</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="bg-white/60 backdrop-blur-md border border-white/40 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] rounded-2xl hover:shadow-lg transition-shadow">
          <CardContent className="p-4 pt-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                  Total Tiers
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {loading ? "..." : memberships.length}
                </p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-white/30 backdrop-blur-sm flex items-center justify-center">
                <Award className="h-5 w-5 text-[#E5262C]" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white/60 backdrop-blur-md border border-white/40 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] rounded-2xl hover:shadow-lg transition-shadow">
          <CardContent className="p-4 pt-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                  Avg Min Trip
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {loading ? "..." : memberships.length > 0
                    ? Math.round(memberships.reduce((acc, m) => acc + m.min_trip, 0) / memberships.length)
                    : "0"}
                </p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-white/30 backdrop-blur-sm flex items-center justify-center">
                <span className="text-lg font-bold text-blue-600">T</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white/60 backdrop-blur-md border border-white/40 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] rounded-2xl hover:shadow-lg transition-shadow">
          <CardContent className="p-4 pt-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                  Avg Reward
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {loading ? "..." : memberships.length > 0
                    ? Math.round(memberships.reduce((acc, m) => acc + m.reward_tap_out, 0) / memberships.length)
                    : "0"}
                </p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-white/30 backdrop-blur-sm flex items-center justify-center">
                <span className="text-lg font-bold text-green-600">R</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table Card */}
      <Card className="bg-white/60 backdrop-blur-md border border-white/40 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] rounded-2xl">
        <CardHeader>
          <CardTitle>Membership Tiers</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead className="w-32">Min Trip</TableHead>
                    <TableHead className="w-32">Reward Tap Out</TableHead>
                    <TableHead className="w-40">Updated At</TableHead>
                    <TableHead className="w-32">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {memberships.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                        No membership tiers found
                      </TableCell>
                    </TableRow>
                  ) : (
                    memberships.map((membership) => (
                      <TableRow key={membership.id}>
                        <TableCell className="font-medium">{membership.name}</TableCell>
                        <TableCell>{membership.min_trip.toLocaleString()}</TableCell>
                        <TableCell>{membership.reward_tap_out.toLocaleString()}</TableCell>
                        <TableCell>{formatWIBDate(membership.updated_at)}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(membership)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
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

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="bg-white/70 backdrop-blur-md border border-white/40 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] rounded-2xl">
          <DialogHeader>
            <DialogTitle>Edit Membership Tier</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Tier Name</label>
              <Input
                value={selectedMembership?.name || ""}
                disabled
                className="mt-1 bg-gray-50"
              />
              <p className="text-xs text-gray-500 mt-1">Name cannot be changed</p>
            </div>
            <div>
              <label className="text-sm font-medium">Min Trip</label>
              <NumberInput
                value={formData.min_trip}
                onChange={(e) => setFormData({ ...formData, min_trip: parseInt(e.target.value) || 0 })}
                placeholder="Enter minimum trips"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Reward Tap Out</label>
              <NumberInput
                value={formData.reward_tap_out}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, reward_tap_out: parseInt(e.target.value) || 0 })}
                placeholder="Enter reward points"
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleEdit} className="bg-[#E5262C] hover:bg-[#c41e22] text-white" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
