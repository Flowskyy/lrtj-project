"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { DateTimePicker } from "@/components/ui/datetime-picker";
import { Pencil, Star, Clock, Calendar, User } from "lucide-react";

interface WelcomePoint {
  id: number;
  point: number;
  created_at: string;
  updated_at: string;
  updated_by: string;
  active_from: string | null;
  active_to: string | null;
}

interface WelcomePointContentProps {
  username: string;
}

export default function WelcomePointContent({ username }: WelcomePointContentProps) {
  const [welcomePoint, setWelcomePoint] = useState<WelcomePoint | null>(null);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [timeRangeOption, setTimeRangeOption] = useState<"default" | "custom">("default");
  const [point, setPoint] = useState<number>(0);
  const [activeFrom, setActiveFrom] = useState<string>("");
  const [activeTo, setActiveTo] = useState<string>("");

  const fetchWelcomePoint = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/welcome-point");
      if (res.ok) {
        const data = await res.json();
        setWelcomePoint(data);
        setPoint(data.point);
        setActiveFrom(data.active_from || "");
        setActiveTo(data.active_to || "");
        setTimeRangeOption(data.active_from || data.active_to ? "custom" : "default");
      } else {
        toast.error("Failed to fetch welcome point configuration");
      }
    } catch (err) {
      console.error("Failed to fetch welcome point", err);
      toast.error("Failed to fetch welcome point configuration");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWelcomePoint();
  }, []);

  const handleEdit = async () => {
    if (!point || point < 0) {
      toast.error("Point value must be a positive number");
      return;
    }

    if (timeRangeOption === "custom") {
      if (!activeFrom) {
        toast.error("Active From is required for custom time range");
        return;
      }
    }

    setIsSubmitting(true);

    const payload = {
      point: point,
      active_from: timeRangeOption === "default" ? null : activeFrom,
      active_to: timeRangeOption === "default" ? null : activeTo,
      updated_by: username,
    };

    try {
      const res = await fetch("/api/welcome-point", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success("Welcome point configuration updated successfully");
        setEditDialogOpen(false);
        fetchWelcomePoint();
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to update welcome point configuration");
      }
    } catch (err) {
      console.error("Failed to update welcome point", err);
      toast.error("Failed to update welcome point configuration");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditDialog = () => {
    if (welcomePoint) {
      setPoint(welcomePoint.point);
      setActiveFrom(welcomePoint.active_from || "");
      setActiveTo(welcomePoint.active_to || "");
      setTimeRangeOption(welcomePoint.active_from || welcomePoint.active_to ? "custom" : "default");
      setEditDialogOpen(true);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Jakarta",
    });
  };

  return (
    <div className="flex flex-col space-y-3 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 flex-shrink-0">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Welcome Point</h1>
          <p className="text-xs text-gray-500 mt-0">Manage welcome point configuration</p>
        </div>
        <Button
          onClick={openEditDialog}
          disabled={loading || !welcomePoint}
          className="bg-[#E5262C] hover:bg-[#c41e22] text-white shadow-sm"
        >
          <Pencil className="h-4 w-4 mr-2" />
          Edit Configuration
        </Button>
      </div>

      {/* Premium Single-Record Display */}
      <div>
        {loading ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3">
            <div className="space-y-2">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-14 w-full" />
            </div>
          </div>
        ) : welcomePoint ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
            {/* Hero Section - Large Point Display */}
            <div className="bg-gradient-to-br from-gray-50 to-white p-4 border-b border-gray-100 flex-shrink-0">
              <div className="max-w-2xl">
                <div className="flex items-center gap-2 mb-1">
                  <div className="h-8 w-8 rounded-xl bg-[#E5262C]/10 flex items-center justify-center">
                    <Star className="h-5 w-5 text-[#E5262C]" />
                  </div>
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Current Point Value</span>
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight mb-0">
                  {welcomePoint.point}
                </div>
                <p className="text-gray-500 text-xs">Points awarded to new members</p>
              </div>
            </div>

            {/* Active Window Section */}
            <div className="p-4 border-b border-gray-100 flex-shrink-0">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-6 w-6 rounded-lg bg-blue-50 flex items-center justify-center">
                  <Clock className="h-4 w-4 text-blue-600" />
                </div>
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Active Time Window</span>
              </div>
              {welcomePoint.active_from || welcomePoint.active_to ? (
                <div className="bg-gray-50 rounded-lg p-2.5">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-0">From</p>
                      <p className="text-gray-900 font-medium text-xs">{formatDate(welcomePoint.active_from)}</p>
                    </div>
                    <div className="hidden sm:block text-gray-300">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-0">To</p>
                      <p className="text-gray-900 font-medium text-xs">{formatDate(welcomePoint.active_to)}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500"></div>
                  <span className="text-green-700 font-semibold text-xs">Always Active</span>
                </div>
              )}
            </div>

            {/* Metadata Footer */}
            <div className="bg-gray-50/50 p-4 flex-shrink-0">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-0">Created At</p>
                  <p className="text-xs text-gray-700">{formatDate(welcomePoint.created_at)}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-0">Updated At</p>
                  <p className="text-xs text-gray-700">{formatDate(welcomePoint.updated_at)}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-0">Updated By</p>
                  <p className="text-xs text-gray-700">{welcomePoint.updated_by || "-"}</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 text-center">
            <div className="h-10 w-10 rounded-xl bg-gray-50 flex items-center justify-center mx-auto mb-2">
              <Star className="h-5 w-5 text-gray-300" />
            </div>
            <p className="text-gray-500 text-xs">No welcome point configuration found</p>
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-lg rounded-2xl max-h-[calc(100dvh-100px)] overflow-hidden flex flex-col">
          <DialogHeader className="pb-3 flex-shrink-0">
            <DialogTitle className="text-lg font-semibold">Edit Welcome Point Configuration</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2 overflow-y-auto flex-1 min-h-0">
            {/* Time Range Option */}
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">Active Time Window</label>
              <div className="space-y-1.5">
                <label className="flex items-center space-x-3 p-2.5 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    name="timeRangeOption"
                    value="default"
                    checked={timeRangeOption === "default"}
                    onChange={(e) => setTimeRangeOption(e.target.value as "default" | "custom")}
                    className="w-4 h-4 text-[#E5262C] border-gray-300 focus:ring-[#E5262C]"
                  />
                  <span className="text-sm text-gray-700">Default (Always Active)</span>
                </label>
                <label className="flex items-center space-x-3 p-2.5 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    name="timeRangeOption"
                    value="custom"
                    checked={timeRangeOption === "custom"}
                    onChange={(e) => setTimeRangeOption(e.target.value as "default" | "custom")}
                    className="w-4 h-4 text-[#E5262C] border-gray-300 focus:ring-[#E5262C]"
                  />
                  <span className="text-sm text-gray-700">Custom Time Range</span>
                </label>
              </div>
            </div>

            {/* Custom Date Time Pickers */}
            {timeRangeOption === "custom" && (
              <div className="space-y-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Active From</label>
                  <DateTimePicker
                    value={activeFrom}
                    onChange={setActiveFrom}
                    placeholder="Select start date and time"
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Active To</label>
                  <DateTimePicker
                    value={activeTo}
                    onChange={setActiveTo}
                    placeholder="Select end date and time"
                    className="w-full"
                  />
                </div>
              </div>
            )}

            {/* Point Value */}
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Point Value</label>
              <Input
                type="number"
                min="0"
                value={point}
                onChange={(e) => setPoint(parseInt(e.target.value) || 0)}
                placeholder="Enter point value"
                className="w-full text-base font-semibold"
              />
            </div>
          </div>
          <DialogFooter className="pt-3 flex-shrink-0">
            <Button variant="outline" onClick={() => setEditDialogOpen(false)} disabled={isSubmitting} className="rounded-xl">
              Cancel
            </Button>
            <Button onClick={handleEdit} className="bg-[#E5262C] hover:bg-[#c41e22] text-white rounded-xl" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
