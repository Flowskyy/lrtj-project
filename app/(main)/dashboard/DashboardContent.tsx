"use client";

import { useEffect, useState } from "react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface MerchandiseItem {
  id: number;
  editedBy?: string;
  creator_email?: string;
  name: string;
  image_url: string;
  points: number;
  description: string;
  createdAt: string | null;
  updatedAt: string | null;
  status: number;
}

interface DashboardContentProps {
  username: string;
}

export default function DashboardContent({ username }: DashboardContentProps) {
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0 });
  const [redeemStats, setRedeemStats] = useState({ total: 0, pending: 0, completed: 0 });
  const [userStats, setUserStats] = useState({ total: 0, verified: 0, unverified: 0 });
  const [loading, setLoading] = useState(true);
  const [redeemLoading, setRedeemLoading] = useState(true);
  const [userLoading, setUserLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/merchandise");
        const response = await res.json();
        setStats({
          total: response.meta?.total || 0,
          active: response.meta?.active || 0,
          inactive: response.meta?.inactive || 0,
        });
      } catch (err) {
        console.error("Failed to fetch merchandise stats", err);
      } finally {
        setLoading(false);
      }
    }

    async function fetchRedeemStats() {
      try {
        const res = await fetch("/api/redeem");
        const response = await res.json();
        setRedeemStats({
          total: response.meta?.total || 0,
          pending: response.meta?.pending || 0,
          completed: response.meta?.completed || 0,
        });
      } catch (err) {
        console.error("Failed to fetch redeem stats", err);
      } finally {
        setRedeemLoading(false);
      }
    }

    async function fetchUserStats() {
      try {
        const res = await fetch("/api/users?limit=1");
        const response = await res.json();
        setUserStats({
          total: response.meta?.total || 0,
          verified: response.meta?.verified || 0,
          unverified: response.meta?.unverified || 0,
        });
      } catch (err) {
        console.error("Failed to fetch user stats", err);
      } finally {
        setUserLoading(false);
      }
    }

    fetchStats();
    fetchRedeemStats();
    fetchUserStats();
  }, []);

  const displayName = username.includes("@") ? username.split("@")[0] : username;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Alert */}
      <Alert className="bg-gradient-to-r from-[#E5262C]/10 to-[#E5262C]/5 border-[#E5262C]/10 rounded-2xl px-6 py-6">
        <AlertTitle className="text-lg font-semibold text-gray-900">
          Welcome back, <span className="text-[#E5262C]">{displayName}</span>!
        </AlertTitle>
        <AlertDescription className="text-sm text-gray-500 mt-2">
          Here's your quick overview.
        </AlertDescription>
      </Alert>

      {/* Merchandise Highlight Card */}
      <Card className="border-gray-100 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-bold text-gray-900">Merchandise Highlight</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {loading ? (
              <>
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-8 w-16" />
                </div>
                <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                  <Skeleton className="h-4 w-16 mb-2" />
                  <Skeleton className="h-8 w-16" />
                </div>
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <Skeleton className="h-4 w-16 mb-2" />
                  <Skeleton className="h-8 w-16" />
                </div>
              </>
            ) : (
              <>
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Total Merchandise
                  </p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {stats.total}
                  </p>
                </div>
                <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                  <p className="text-xs font-semibold uppercase tracking-wider text-green-600">
                    Active
                  </p>
                  <p className="text-3xl font-bold text-green-700 mt-2">
                    {stats.active}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Inactive
                  </p>
                  <p className="text-3xl font-bold text-gray-600 mt-2">
                    {stats.inactive}
                  </p>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Redeem Merchandise Highlight Card */}
      <Card className="border-gray-100 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-bold text-gray-900">Redeem Merchandise Highlight</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {redeemLoading ? (
              <>
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-8 w-16" />
                </div>
                <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-100">
                  <Skeleton className="h-4 w-16 mb-2" />
                  <Skeleton className="h-8 w-16" />
                </div>
                <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                  <Skeleton className="h-4 w-16 mb-2" />
                  <Skeleton className="h-8 w-16" />
                </div>
              </>
            ) : (
              <>
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Total Redeems
                  </p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {redeemStats.total}
                  </p>
                </div>
                <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-100">
                  <p className="text-xs font-semibold uppercase tracking-wider text-yellow-600">
                    Pending
                  </p>
                  <p className="text-3xl font-bold text-yellow-700 mt-2">
                    {redeemStats.pending}
                  </p>
                </div>
                <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                  <p className="text-xs font-semibold uppercase tracking-wider text-green-600">
                    Completed
                  </p>
                  <p className="text-3xl font-bold text-green-700 mt-2">
                    {redeemStats.completed}
                  </p>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Users Highlight Card */}
      <Card className="border-gray-100 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-bold text-gray-900">Users Highlight</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {userLoading ? (
              <>
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-8 w-16" />
                </div>
                <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                  <Skeleton className="h-4 w-16 mb-2" />
                  <Skeleton className="h-8 w-16" />
                </div>
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <Skeleton className="h-4 w-16 mb-2" />
                  <Skeleton className="h-8 w-16" />
                </div>
              </>
            ) : (
              <>
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Total Users
                  </p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {userStats.total}
                  </p>
                </div>
                <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                  <p className="text-xs font-semibold uppercase tracking-wider text-green-600">
                    Verified
                  </p>
                  <p className="text-3xl font-bold text-green-700 mt-2">
                    {userStats.verified}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Unverified
                  </p>
                  <p className="text-3xl font-bold text-gray-600 mt-2">
                    {userStats.unverified}
                  </p>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
