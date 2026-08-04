"use client";

import { useEffect, useState } from "react";
import React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Infinity, Clock as ClockIcon, Hourglass, Zap, AlertTriangle, ClockAlert, Settings } from "lucide-react";
import { formatWIBDate, parseWIBString, getCurrentWIBTimeISO } from "@/lib/formatWIBDate";
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

interface WelcomePointContentProps {
  username: string;
}

export default function WelcomePointContent({ username }: WelcomePointContentProps) {
  const router = useRouter();
  const [welcomePoint, setWelcomePoint] = useState<WelcomePoint | null>(null);
  const [loading, setLoading] = useState(true);

  // Countdown state
  const [countdown, setCountdown] = useState<string>("");
  const [isActive, setIsActive] = useState(false);
  const [isStartingSoon, setIsStartingSoon] = useState(false);
  const [isNearingEnd, setIsNearingEnd] = useState(false);
  const [windowState, setWindowState] = useState<"default" | "starting-soon" | "active" | "nearing-end" | "expired">("default");

  const fetchWelcomePoint = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/welcome-point");
      if (res.ok) {
        const data = await res.json();
        setWelcomePoint(data);
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

  // Countdown logic
  useEffect(() => {
    if (!welcomePoint || !welcomePoint.active_from || !welcomePoint.active_to) {
      setCountdown("");
      setIsActive(false);
      setIsStartingSoon(false);
      return;
    }

    const updateCountdown = () => {
      const wibNowString = getCurrentWIBTimeISO()
      const wibNow = parseWIBString(wibNowString)

      if (!wibNow) {
        setCountdown("")
        setIsActive(false)
        setIsStartingSoon(false)
        setIsNearingEnd(false)
        setWindowState("default")
        return
      }

      const from = parseWIBString(welcomePoint.active_from!)
      const to = parseWIBString(welcomePoint.active_to!)

      if (!from || !to) {
        setCountdown("")
        setIsActive(false)
        setIsStartingSoon(false)
        setIsNearingEnd(false)
        setWindowState("default")
        return
      }

      const totalDuration = to.getTime() - from.getTime()
      const currentlyActive = wibNow >= from && wibNow <= to
      const currentlyStartingSoon = wibNow < from
      const currentlyExpired = wibNow > to

      // Calculate nearing end: last 10% of duration OR last 1 hour, whichever is longer
      const tenPercentOfDuration = totalDuration * 0.1
      const oneHour = 60 * 60 * 1000
      const nearingEndThreshold = Math.max(tenPercentOfDuration, oneHour)
      const timeUntilEnd = to.getTime() - wibNow.getTime()
      const currentlyNearingEnd = currentlyActive && timeUntilEnd <= nearingEndThreshold

      setIsActive(currentlyActive)
      setIsStartingSoon(currentlyStartingSoon)
      setIsNearingEnd(currentlyNearingEnd)

      // Set window state
      if (!welcomePoint.active_from && !welcomePoint.active_to) {
        setWindowState("default")
      } else if (currentlyStartingSoon) {
        setWindowState("starting-soon")
      } else if (currentlyExpired) {
        setWindowState("expired")
      } else if (currentlyNearingEnd) {
        setWindowState("nearing-end")
      } else if (currentlyActive) {
        setWindowState("active")
      } else {
        setWindowState("default")
      }

      let targetDate: Date
      let label: string

      if (wibNow < from) {
        targetDate = from
        label = "Starts in"
      } else if (wibNow >= from && wibNow <= to) {
        targetDate = to
        label = "Ends in"
      } else {
        setCountdown("Expired")
        setIsActive(false)
        setIsStartingSoon(false)
        setIsNearingEnd(false)
        setWindowState("expired")
        return
      }

      const diff = targetDate.getTime() - wibNow.getTime()

      if (diff <= 0) {
        setCountdown(label === "Starts in" ? "Starting now" : "Ended")
        return
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)

      let timeString = ""
      if (days > 0) timeString += `${days}d `
      if (hours > 0 || days > 0) timeString += `${hours}h `
      if (minutes > 0 || hours > 0 || days > 0) timeString += `${minutes}m `
      timeString += `${seconds}s`

      setCountdown(`${label}: ${timeString.trim()}`)
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 1000)

    return () => clearInterval(interval)
  }, [welcomePoint])

  const getWindowStateConfig = () => {
    switch (windowState) {
      case "default":
        return {
          icon: Infinity,
          iconBgClass: "bg-gray-100/50 backdrop-blur-sm",
          iconTextClass: "text-gray-600",
          label: "Always Active"
        };
      case "starting-soon":
        return {
          icon: Hourglass,
          iconBgClass: "bg-gradient-to-r from-gray-200/50 to-green-400/50 backdrop-blur-sm",
          iconTextClass: "text-gray-700",
          label: "Starting Soon"
        };
      case "active":
        return {
          icon: Zap,
          iconBgClass: "bg-green-500/70 backdrop-blur-sm",
          iconTextClass: "text-white",
          label: "Live"
        };
      case "nearing-end":
        return {
          icon: AlertTriangle,
          iconBgClass: "bg-gradient-to-r from-green-400/50 to-red-500/50 backdrop-blur-sm",
          iconTextClass: "text-white",
          label: "Ending Soon"
        };
      case "expired":
        return {
          icon: ClockAlert,
          iconBgClass: "bg-gray-100/50 backdrop-blur-sm",
          iconTextClass: "text-gray-600",
          label: "Expired"
        };
      default:
        return {
          icon: Infinity,
          iconBgClass: "bg-gray-100/50 backdrop-blur-sm",
          iconTextClass: "text-gray-600",
          label: "Always Active"
        };
    }
  };

  return (
    <div className="space-y-6 animate-fade-in relative min-h-screen">
      {/* Background gradient blobs for glassmorphism effect */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#E5262C] opacity-10 blur-3xl rounded-full" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gray-300 opacity-10 blur-3xl rounded-full" />
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome Point</h1>
          <p className="text-sm text-gray-500 mt-1">Manage welcome point configuration</p>
        </div>
        <Button
          onClick={() => router.push("/master/welcome-point/edit")}
          disabled={loading || !welcomePoint}
          className="bg-[#E5262C] hover:bg-[#c41e22] text-white"
        >
          Edit
        </Button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full bg-white/60 backdrop-blur-md rounded-2xl" />
          <Skeleton className="h-24 w-full bg-white/60 backdrop-blur-md rounded-2xl" />
        </div>
      ) : welcomePoint ? (
        <div className="space-y-4">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {/* Default Point Card */}
            <Card className="bg-white/60 backdrop-blur-md border border-white/40 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] rounded-2xl hover:shadow-lg transition-shadow">
              <CardContent className="p-4 pt-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                      Default Point
                    </p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {welcomePoint.default_point}
                    </p>
                  </div>
                  <div className="h-10 w-10 rounded-xl bg-white/30 backdrop-blur-sm flex items-center justify-center">
                    <Settings className="h-5 w-5 text-gray-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Status Card */}
            <Card className="bg-white/60 backdrop-blur-md border border-white/40 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] rounded-2xl hover:shadow-lg transition-shadow">
              <CardContent className="p-4 pt-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                      Status
                    </p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {welcomePoint.active_from && welcomePoint.active_to ? "Limited Time" : "Default"}
                    </p>
                    {isStartingSoon && countdown && (
                      <p className="text-xs text-gray-500 mt-1">{countdown.replace("Starts in: ", "Upcoming in: ")}</p>
                    )}
                  </div>
                  <div className="h-10 w-10 rounded-xl bg-white/30 backdrop-blur-sm flex items-center justify-center">
                    <div className={`h-2 w-2 rounded-full ${isActive ? "bg-green-600" : isStartingSoon ? "bg-[#E5262C]" : "bg-gray-400"}`} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Current Time Window Card */}
            <Card className="bg-white/60 backdrop-blur-md border border-white/40 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] rounded-2xl hover:shadow-lg transition-shadow">
              <CardContent className="p-4 pt-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                      Current Time Window
                    </p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {welcomePoint.active_from && welcomePoint.active_to ? "Ends " + formatWIBDate(welcomePoint.active_to).split(",")[0] : "Infinite"}
                    </p>
                    {welcomePoint.active_from && welcomePoint.active_to && (
                      <div className="mt-1 space-y-0.5">
                        <p className="text-xs text-gray-500">Start: {formatWIBDate(welcomePoint.active_from)}</p>
                        <p className="text-xs text-gray-500">End: {formatWIBDate(welcomePoint.active_to)}</p>
                      </div>
                    )}
                  </div>
                  <div className={`h-10 w-10 rounded-xl ${getWindowStateConfig().iconBgClass} bg-white/30 backdrop-blur-sm flex items-center justify-center`}>
                    {React.createElement(getWindowStateConfig().icon, {
                      className: `h-5 w-5 ${getWindowStateConfig().iconTextClass}`
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Upcoming/Live Time Window Event Section */}
          {(isStartingSoon || isActive) && welcomePoint.active_from && welcomePoint.active_to && (
            <Card className="bg-white/60 backdrop-blur-md border border-white/40 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] rounded-2xl">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className={`h-8 w-8 rounded-lg ${isStartingSoon ? "bg-gray-100/50 backdrop-blur-sm" : "bg-green-100/50 backdrop-blur-sm"} flex items-center justify-center flex-shrink-0`}>
                    {isStartingSoon ? (
                      <Hourglass className="h-4 w-4 text-gray-600" />
                    ) : (
                      <Zap className="h-4 w-4 text-green-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900">
                      {isStartingSoon ? "Upcoming Event" : "Live Event"}
                    </p>
                    <div className="mt-1 space-y-0.5">
                      <p className="text-xs text-gray-600">
                        Starts: {formatWIBDate(welcomePoint.active_from)}
                      </p>
                      <p className="text-xs text-gray-600">
                        Ends: {formatWIBDate(welcomePoint.active_to)}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Details Card */}
          <Card className="bg-white/60 backdrop-blur-md border border-white/40 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] rounded-2xl">
            <CardContent className="p-6">
              {/* Metadata Footer */}
              <div className="flex items-center gap-3">
                <ClockIcon className="h-4 w-4 text-gray-400" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500">
                    Last Updated: {formatWIBDate(welcomePoint.updated_at)} by {welcomePoint.updated_by}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card className="bg-white/60 backdrop-blur-md border border-white/40 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] rounded-2xl">
          <CardContent className="p-12 text-center">
            <p className="text-gray-500 text-sm">No welcome point configuration found</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
