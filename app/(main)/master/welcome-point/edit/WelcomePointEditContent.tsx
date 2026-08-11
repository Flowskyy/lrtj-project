"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { NumberInput } from "@/components/ui/number-input";
import { Card, CardContent } from "@/components/ui/card";
import { DateTimePicker } from "@/components/ui/datetime-picker";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

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

interface WelcomePointEditContentProps {
  userEmail: string;
}

export default function WelcomePointEditContent({ userEmail }: WelcomePointEditContentProps) {
  const router = useRouter();
  const [welcomePoint, setWelcomePoint] = useState<WelcomePoint | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [timeRangeOption, setTimeRangeOption] = useState<"default" | "custom">("default");
  const [customPoint, setCustomPoint] = useState<number>(0);
  const [defaultPoint, setDefaultPoint] = useState<number>(100);
  const [activeFrom, setActiveFrom] = useState<string>("");
  const [activeTo, setActiveTo] = useState<string>("");

  const fetchWelcomePoint = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/welcome-point");
      if (res.ok) {
        const data = await res.json();
        setWelcomePoint(data);
        setCustomPoint(data.point);
        setDefaultPoint(data.default_point || 100);
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

  const handleSave = async () => {
    if (!defaultPoint || defaultPoint < 0) {
      toast.error("Default point value must be a positive number");
      return;
    }

    if (timeRangeOption === "custom" && (!customPoint || customPoint < 0)) {
      toast.error("Custom point value must be a positive number");
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
      point: timeRangeOption === "default" ? defaultPoint : customPoint,
      default_point: defaultPoint,
      active_from: timeRangeOption === "default" ? null : activeFrom,
      active_to: timeRangeOption === "default" ? null : activeTo,
      updated_by: userEmail,
    };

    try {
      const res = await fetch("/api/welcome-point", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success("Welcome point configuration updated successfully");
        router.push("/master/welcome-point");
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

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Welcome Point</h1>
          <p className="text-sm text-gray-500 mt-1">Manage welcome point configuration</p>
        </div>
        <div className="space-y-4">
          <Skeleton className="h-32 w-full bg-white/60 backdrop-blur-md rounded-2xl" />
          <Skeleton className="h-24 w-full bg-white/60 backdrop-blur-md rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <Link href="/master/welcome-point" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-4 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to Welcome Point
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Edit Welcome Point</h1>
        <p className="text-sm text-gray-500 mt-1">Manage welcome point configuration</p>
      </div>

      {/* Form */}
      <div className="space-y-4">
        {/* Default Point Value */}
        <Card className="bg-white/60 backdrop-blur-md border border-white/40 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] rounded-2xl hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-4">Default Point Value</p>
            <NumberInput
              min="0"
              value={defaultPoint}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDefaultPoint(parseInt(e.target.value) || 0)}
              placeholder="Enter default point value"
              className="w-full"
            />
            <p className="text-xs text-gray-400 mt-2">Used when in Default (Always Active) mode</p>
          </CardContent>
        </Card>

        {/* Active Time Window */}
        <Card className="bg-white/60 backdrop-blur-md border border-white/40 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] rounded-2xl hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-4">Active Time Window</p>
            <div className="space-y-3">
              <label className="flex items-center gap-3 p-3 border border-white/30 rounded-xl cursor-pointer hover:bg-white/50 transition-colors">
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
              <label className="flex items-center gap-3 p-3 border border-white/30 rounded-xl cursor-pointer hover:bg-white/50 transition-colors">
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

            {timeRangeOption === "custom" && (
              <div className="mt-4 space-y-4 pt-4 border-t border-white/30">
                <div>
                  <p className="text-xs text-gray-400 mb-2">Active From</p>
                  <DateTimePicker
                    value={activeFrom}
                    onChange={setActiveFrom}
                    placeholder="Select start date and time"
                    className="w-full"
                  />
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-2">Active To</p>
                  <DateTimePicker
                    value={activeTo}
                    onChange={setActiveTo}
                    placeholder="Select end date and time"
                    className="w-full"
                  />
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-2">Custom Point Value</p>
                  <NumberInput
                    min="0"
                    value={customPoint}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCustomPoint(parseInt(e.target.value) || 0)}
                    placeholder="Enter custom point value"
                    className="w-full"
                  />
                  <p className="text-xs text-gray-400 mt-2">Points awarded during custom time window</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Page-level Footer */}
        <div className="bg-white/60 backdrop-blur-md border border-white/40 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] rounded-2xl pt-4 p-4 flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => router.push("/master/welcome-point")}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSubmitting}
            className="bg-[#E5262C] hover:bg-[#c41e22] text-white"
          >
            {isSubmitting ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
}
