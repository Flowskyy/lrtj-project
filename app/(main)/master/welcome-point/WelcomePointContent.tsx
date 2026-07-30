"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { DateTimePicker } from "@/components/ui/datetime-picker";
import { Pencil, Star, Clock, Calendar, User, Activity } from "lucide-react";

interface WelcomePoint {
  id: number;
  point: number;
  default_point: number;
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

  // Countdown state
  const [countdown, setCountdown] = useState<string>("");
  const [isActive, setIsActive] = useState(false);
  const [isStartingSoon, setIsStartingSoon] = useState(false);

  // Live WIB clock state
  const [currentTime, setCurrentTime] = useState<string>("");

  // Form states
  const [timeRangeOption, setTimeRangeOption] = useState<"default" | "custom">("default");
  const [pointMode, setPointMode] = useState<"custom" | "default">("custom");
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
        setPointMode(data.point === data.default_point ? "default" : "custom");
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

  // Live WIB clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
          timeZone: "Asia/Jakarta",
        })
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, []);

  // Countdown logic
  useEffect(() => {
    if (!welcomePoint || !welcomePoint.active_from || !welcomePoint.active_to) {
      setCountdown("");
      setIsActive(false);
      return;
    }

    const updateCountdown = () => {
      const now = new Date();
      // DB values are stored as UTC, parse them for comparison
      const from = new Date(welcomePoint.active_from!);
      const to = new Date(welcomePoint.active_to!);

      // Check if currently within active window
      const currentlyActive = now >= from && now <= to;
      const currentlyStartingSoon = now < from;
      setIsActive(currentlyActive);
      setIsStartingSoon(currentlyStartingSoon);

      let targetDate: Date;
      let label: string;

      if (now < from) {
        targetDate = from;
        label = "Starts in";
      } else if (now >= from && now <= to) {
        targetDate = to;
        label = "Ends in";
      } else {
        setCountdown("Expired");
        setIsActive(false);
        setIsStartingSoon(false);
        return;
      }

      const diff = targetDate.getTime() - now.getTime();

      if (diff <= 0) {
        setCountdown(label === "Starts in" ? "Starting now" : "Ended");
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      let timeString = "";
      if (days > 0) timeString += `${days}d `;
      if (hours > 0 || days > 0) timeString += `${hours}h `;
      if (minutes > 0 || hours > 0 || days > 0) timeString += `${minutes}m `;
      timeString += `${seconds}s`;

      setCountdown(`${label}: ${timeString.trim()}`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [welcomePoint]);

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
      if (!activeTo) {
        toast.error("Active To is required for custom time range");
        return;
      }
    }

    setIsSubmitting(true);

    const payload = {
      point: pointMode === "default" ? 100 : point,
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
      setPointMode(welcomePoint.point === welcomePoint.default_point ? "default" : "custom");
      setEditDialogOpen(true);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    // DB value is UTC, convert to WIB for display
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Asia/Jakarta",
    });
  };

  return (
    <div className="flex flex-col space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Welcome Point</h1>
          <p className="text-sm text-gray-500 mt-1">Manage welcome point configuration</p>
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
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="space-y-4">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          </div>
        ) : welcomePoint ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
            {/* Hero Section - Large Point Display */}
            <div className="bg-gradient-to-br from-gray-50 to-white p-6 border-b border-gray-100 flex-shrink-0">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
                <div className="max-w-2xl">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="h-10 w-10 rounded-xl bg-[#E5262C]/10 flex items-center justify-center">
                      <Star className="h-6 w-6 text-[#E5262C]" />
                    </div>
                    <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Current Point Value</span>
                  </div>
                  <div className="text-4xl sm:text-5xl font-bold text-gray-900 tracking-tight mb-1">
                    {welcomePoint.point}
                  </div>
                  <p className="text-gray-500 text-sm">Points awarded to new members</p>
                </div>
                <div className="flex-shrink-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Current Time (WIB)</span>
                  </div>
                  <p className="text-lg font-semibold text-gray-700">{currentTime}</p>
                </div>
              </div>
            </div>

            {/* Active Window Section */}
            <div
              className={`p-6 border-b border-gray-100 flex-shrink-0 transition-all duration-300 ${
                isActive ? 'bg-red-50/50 border-l-4 border-l-[#E5262C]' : ''
              } ${
                isStartingSoon ? 'bg-amber-50/50 border-l-4 border-l-amber-500' : ''
              }`}
            >
              <div className="flex items-center gap-2 mb-3">
                <div className={`h-7 w-7 rounded-lg flex items-center justify-center ${
                  isActive ? 'bg-[#E5262C]/10' : isStartingSoon ? 'bg-amber-500/10' : 'bg-blue-50'
                }`}>
                  <Clock className={`h-4 w-4 ${isActive ? 'text-[#E5262C]' : isStartingSoon ? 'text-amber-600' : 'text-blue-600'}`} />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Active Time Window</span>
                  {isActive && (
                    <div className="flex items-center gap-1.5">
                      <div className="h-2 w-2 rounded-full bg-[#E5262C] animate-pulse" />
                      <span className="text-xs font-semibold text-[#E5262C] uppercase tracking-wider">Live</span>
                    </div>
                  )}
                  {isStartingSoon && (
                    <div className="flex items-center gap-1.5">
                      <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                      <span className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Starting Soon</span>
                    </div>
                  )}
                </div>
              </div>
              {welcomePoint.active_from || welcomePoint.active_to ? (
                <div className={`rounded-lg p-4 transition-all duration-300 ${
                  isActive ? 'bg-white border border-[#E5262C]/20 shadow-sm' : isStartingSoon ? 'bg-white border border-amber-500/20 shadow-sm' : 'bg-gray-50'
                }`}>
                  {/* Countdown Display */}
                  {countdown && (
                    <div className={`mb-3 pb-3 border-b ${
                      isActive ? 'border-[#E5262C]/10' : isStartingSoon ? 'border-amber-500/10' : 'border-gray-200'
                    }`}>
                      <div className={`flex items-center gap-2 ${
                        isActive ? 'text-[#E5262C]' : isStartingSoon ? 'text-amber-600' : 'text-gray-700'
                      }`}>
                        <Activity className={`h-4 w-4 ${isActive ? 'animate-pulse' : isStartingSoon ? 'animate-pulse' : ''}`} />
                        <span className="font-semibold text-sm">{countdown}</span>
                      </div>
                    </div>
                  )}
                  {/* Time Range Display */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">From</p>
                      <p className="text-gray-900 font-medium text-sm">{formatDate(welcomePoint.active_from)}</p>
                    </div>
                    <div className="hidden sm:block text-gray-300">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">To</p>
                      <p className="text-gray-900 font-medium text-sm">{formatDate(welcomePoint.active_to)}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-green-500"></div>
                  <span className="text-green-700 font-semibold text-sm">Always Active</span>
                </div>
              )}
            </div>

            {/* Metadata Footer */}
            <div className="bg-gray-50/50 p-6 flex-shrink-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Updated At</p>
                  <p className="text-sm text-gray-700">{formatDate(welcomePoint.updated_at)}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Updated By</p>
                  <p className="text-sm text-gray-700">{welcomePoint.updated_by || "-"}</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center">
            <div className="h-12 w-12 rounded-xl bg-gray-50 flex items-center justify-center mx-auto mb-3">
              <Star className="h-6 w-6 text-gray-300" />
            </div>
            <p className="text-gray-500 text-sm">No welcome point configuration found</p>
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

            {/* Point Mode Selection */}
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">Point Value</label>
              <div className="space-y-1.5">
                <label className="flex items-center space-x-3 p-2.5 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    name="pointMode"
                    value="custom"
                    checked={pointMode === "custom"}
                    onChange={(e) => setPointMode(e.target.value as "custom" | "default")}
                    className="w-4 h-4 text-[#E5262C] border-gray-300 focus:ring-[#E5262C]"
                  />
                  <span className="text-sm text-gray-700">Custom Points</span>
                </label>
                <label className="flex items-center space-x-3 p-2.5 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    name="pointMode"
                    value="default"
                    checked={pointMode === "default"}
                    onChange={(e) => setPointMode(e.target.value as "custom" | "default")}
                    className="w-4 h-4 text-[#E5262C] border-gray-300 focus:ring-[#E5262C]"
                  />
                  <span className="text-sm text-gray-700">Default Point (100)</span>
                </label>
              </div>
            </div>

            {/* Point Value Input */}
            {pointMode === "custom" && (
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Custom Point Value</label>
                <NumberInput
                  min="0"
                  value={point}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPoint(parseInt(e.target.value) || 0)}
                  placeholder="Enter custom point value"
                  className="w-full text-base font-semibold"
                />
              </div>
            )}
            {pointMode === "default" && (
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-sm font-semibold text-gray-700 mb-1">Default Point Value</p>
                <p className="text-3xl font-bold text-[#E5262C]">100</p>
                <p className="text-xs text-gray-500 mt-1">Fixed default value - not editable</p>
              </div>
            )}
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
