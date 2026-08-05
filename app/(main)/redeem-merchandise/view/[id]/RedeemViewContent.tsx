"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import StatusBadge from "@/components/StatusBadge";
import { formatWIBDate, formatDisplayDate } from "@/lib/formatWIBDate";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface RedeemItem {
  id: number;
  user_id: number;
  merchandise_id: number;
  merchandise_name: string;
  receiver_name: string;
  receiver_phone: string;
  receiver_email: string;
  receiver_address: string;
  status: string;
  createdAt: string | null;
  updatedAt: string | null;
}

interface RedeemViewContentProps {
  redeemId: string;
}

export default function RedeemViewContent({ redeemId }: RedeemViewContentProps) {
  const router = useRouter();
  const [item, setItem] = useState<RedeemItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchItem = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/redeem/${redeemId}`);
        if (res.ok) {
          const data = await res.json();
          setItem(data);
        } else {
          toast.error("Failed to fetch redeem record");
          router.back();
        }
      } catch (err) {
        console.error("Failed to fetch item", err);
        toast.error("Failed to fetch redeem record");
        router.back();
      } finally {
        setLoading(false);
      }
    };

    fetchItem();
  }, [redeemId, router]);

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-6 w-48" />
        </div>
        <Card className="bg-white border border-gray-200 shadow-sm rounded-xl">
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="h-10 w-10"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Redeem Record Details</h1>
          <p className="text-sm text-gray-500 mt-1">View complete information about this redemption</p>
        </div>
      </div>

      {/* Content Card */}
      <Card className="bg-white border border-gray-200 shadow-sm rounded-xl">
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Redeem #{item.id}</h2>

          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">
                User ID
              </label>
              <div className="text-sm text-gray-900 font-medium">{item.user_id}</div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">
                Status
              </label>
              <div><StatusBadge status={item.status} /></div>
            </div>
          </div>

          {/* Receiver Info */}
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">
              Receiver Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Name</label>
                <div className="text-sm text-gray-900">{item.receiver_name}</div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Phone</label>
                <div className="text-sm text-gray-900">{item.receiver_phone}</div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Email</label>
                <div className="text-sm text-gray-900">{item.receiver_email}</div>
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-xs font-medium text-gray-500 mb-1">Address</label>
              <div className="text-sm text-gray-900">{item.receiver_address}</div>
            </div>
          </div>

          {/* Merchandise Info */}
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">
              Merchandise Information
            </h3>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Merchandise Name</label>
              <div className="text-sm text-gray-900 font-medium">{item.merchandise_name}</div>
            </div>
          </div>

          {/* Timestamps */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">
              Timestamps
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Created</label>
                <div className="text-sm text-gray-900">{formatDisplayDate(item.createdAt)}</div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Updated</label>
                <div className="text-sm text-gray-900">{formatDisplayDate(item.updatedAt)}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
