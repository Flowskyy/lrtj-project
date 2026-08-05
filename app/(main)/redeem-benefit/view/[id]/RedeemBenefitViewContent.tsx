"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import StatusBadge from "@/components/StatusBadge";
import { formatDisplayDate } from "@/lib/formatWIBDate";
import { ArrowLeft, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";

interface RedeemBenefitItem {
  id: number;
  user_id: number;
  merchant_id: number;
  name: string;
  email: string;
  status: string;
  created_at: string | null;
  updated_at: string | null;
}

interface RedeemBenefitViewContentProps {
  redeemBenefitId: string;
}

export default function RedeemBenefitViewContent({ redeemBenefitId }: RedeemBenefitViewContentProps) {
  const router = useRouter();
  const [item, setItem] = useState<RedeemBenefitItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteItem, setDeleteItem] = useState<RedeemBenefitItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchItem = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/redeem-benefit/${redeemBenefitId}`);
        if (res.ok) {
          const data = await res.json();
          setItem(data);
        } else {
          toast.error("Failed to fetch redeem benefit record");
          router.back();
        }
      } catch (err) {
        console.error("Failed to fetch item", err);
        toast.error("Failed to fetch redeem benefit record");
        router.back();
      } finally {
        setLoading(false);
      }
    };

    fetchItem();
  }, [redeemBenefitId, router]);

  const handleDelete = async () => {
    if (!deleteItem) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/redeem-benefit/${deleteItem.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Redeem benefit record deleted successfully");
        router.push("/redeem-benefit");
      } else {
        toast.error("Failed to delete redeem benefit record");
      }
    } catch (err) {
      console.error("Failed to delete item", err);
      toast.error("Failed to delete redeem benefit record");
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-9" />
          <Skeleton className="h-6 w-48" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <Skeleton className="h-6 w-3/4 mb-4" />
              <Skeleton className="h-4 w-1/4" />
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <Skeleton className="h-4 w-16 mb-4" />
              <div className="space-y-3">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-40" />
              </div>
            </div>
          </div>
          <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <Skeleton className="h-4 w-20 mb-4" />
              <Skeleton className="h-4 w-40" />
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <Skeleton className="h-4 w-16 mb-4" />
              <div className="grid grid-cols-2 gap-6">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
          </div>
        </div>
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
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="h-9 w-9"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Redeem Benefit Record Details</h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Title & Status Card */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Redeem Benefit #{item.id}</h2>
                <div className="flex items-center gap-3">
                  <StatusBadge status={item.status} />
                </div>
              </div>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => setDeleteItem(item)}
                className="h-9"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>

          {/* Receiver Info Card */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Receiver Information</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Name</label>
                <div className="text-sm text-gray-900">{item.name}</div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Email</label>
                <div className="text-sm text-gray-900">{item.email}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* User Info Card */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">User Information</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">User ID</label>
                <div className="text-sm text-gray-900">{item.user_id}</div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Merchant ID</label>
                <div className="text-sm text-gray-900">{item.merchant_id}</div>
              </div>
            </div>
          </div>

          {/* Timestamps Card */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Timestamps</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Created</label>
                <div className="text-sm text-gray-900">{formatDisplayDate(item.created_at)}</div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Updated</label>
                <div className="text-sm text-gray-900">{formatDisplayDate(item.updated_at)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Dialog */}
      {deleteItem && (
        <DeleteConfirmDialog
          open={!!deleteItem}
          onOpenChange={() => setDeleteItem(null)}
          onConfirm={handleDelete}
          title="Delete Redeem Benefit Record"
          description={`Are you sure you want to delete redeem benefit record #${deleteItem.id}? This action cannot be undone.`}
          isDeleting={isDeleting}
        />
      )}
    </div>
  );
}