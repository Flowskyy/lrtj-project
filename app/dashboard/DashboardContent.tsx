"use client";

import { useEffect, useState } from "react";

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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/merchandise");
        const items: MerchandiseItem[] = await res.json();
        const total = items.length;
        const active = items.filter((i) => i.status === 1).length;
        const inactive = items.filter((i) => i.status === 0).length;
        setStats({ total, active, inactive });
      } catch (err) {
        console.error("Failed to fetch merchandise stats", err);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  const displayName = username.includes("@") ? username.split("@")[0] : username;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Card */}
      <div className="bg-gradient-to-r from-[#E5262C]/10 to-[#E5262C]/5 border border-[#E5262C]/10 rounded-2xl p-6">
        <p className="text-lg font-semibold text-gray-900">
          Welcome back, <span className="text-[#E5262C]">{displayName}</span>!
        </p>
        <p className="text-sm text-gray-500 mt-2">Here's your quick overview.</p>
      </div>

      {/* Merchandise Highlight */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Merchandise Highlight</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              Total Merchandise
            </p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {loading ? "..." : stats.total}
            </p>
          </div>
          <div className="p-4 bg-green-50 rounded-xl border border-green-100">
            <p className="text-xs font-semibold uppercase tracking-wider text-green-600">
              Active
            </p>
            <p className="text-3xl font-bold text-green-700 mt-2">
              {loading ? "..." : stats.active}
            </p>
          </div>
          <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Inactive
            </p>
            <p className="text-3xl font-bold text-gray-600 mt-2">
              {loading ? "..." : stats.inactive}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
