"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getImageUrl } from "@/lib/utils";
import { formatWIBDate } from "@/lib/formatWIBDate";
import { ArrowLeft, Loader2, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import Link from "next/link";

interface DailyBenefitItem {
  id: number;
  editedBy?: string;
  name: string;
  image_url: string;
  redeem_point: number;
  term_condition: string;
  created_at: string | null;
  updated_at: string | null;
  status: number;
  start_date: string | null;
  end_date: string | null;
  is_active: number | null;
}

interface DailyBenefitViewContentProps {
  dailyBenefitId: string;
}

export default function DailyBenefitViewContent({ dailyBenefitId }: DailyBenefitViewContentProps) {
  const router = useRouter();
  const [item, setItem] = useState<DailyBenefitItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteItem, setDeleteItem] = useState<DailyBenefitItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchItem = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/daily-benefit/${dailyBenefitId}`);
        if (res.ok) {
          const data = await res.json();
          setItem(data);
        } else {
          toast.error("Failed to fetch daily benefit");
          router.back();
        }
      } catch (err) {
        console.error("Failed to fetch item", err);
        toast.error("Failed to fetch daily benefit");
        router.back();
      } finally {
        setLoading(false);
      }
    };

    fetchItem();
  }, [dailyBenefitId, router]);

  const handleDelete = async () => {
    if (!deleteItem) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/daily-benefit/${deleteItem.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Daily Benefit deleted successfully");
        router.push("/daily-benefit");
      } else {
        toast.error("Failed to delete daily benefit");
      }
    } catch (err) {
      console.error("Failed to delete item", err);
      toast.error("Failed to delete daily benefit");
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
              <Skeleton className="aspect-video w-full rounded-md" />
            </div>
          </div>
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/4" />
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <Skeleton className="h-4 w-16 mb-4" />
              <div className="grid grid-cols-2 gap-6">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-16" />
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
          <h1 className="text-xl font-semibold text-gray-900">Daily Benefit Details</h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Image */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <div className="aspect-video bg-gray-50 rounded-md overflow-hidden flex items-center justify-center">
              <img
                src={getImageUrl(item.image_url)}
                alt={item.name}
                className="h-full w-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/logo-lrtj.png";
                  (e.target as HTMLImageElement).className = "h-12 w-auto object-contain brightness-95";
                }}
              />
            </div>
          </div>
        </div>

        {/* Right Column - Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Title & Status Card */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">{item.name}</h2>
                <div className="flex items-center gap-3">
                  {item.status === 1 ? (
                    <Badge variant="default" className="bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 text-xs">
                      Active
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200 text-xs">
                      Inactive
                    </Badge>
                  )}
                  <span className="text-sm font-semibold text-[#E5262C]">{item.redeem_point} pts</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Link href={`/daily-benefit/edit/${item.id}`}>
                  <Button size="sm" className="h-9">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                </Link>
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
          </div>

          {/* Basic Info Card */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Points Required</label>
                <div className="text-sm text-gray-900 font-semibold text-[#E5262C]">
                  {item.redeem_point} pts
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Last Edited By</label>
                <div className="text-sm text-gray-900">{item.editedBy || "-"}</div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
                <div>
                  {item.status === 1 ? (
                    <Badge variant="default" className="bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 text-xs">
                      Active
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200 text-xs">
                      Inactive
                    </Badge>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Is Active</label>
                <div>
                  {item.is_active === 1 ? (
                    <Badge variant="default" className="bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 text-xs">
                      Yes
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200 text-xs">
                      No
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Schedule Card */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Schedule</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {item.start_date && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Start Date</label>
                  <div className="text-sm text-gray-900">{formatWIBDate(item.start_date)}</div>
                </div>
              )}
              {item.end_date && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">End Date</label>
                  <div className="text-sm text-gray-900">{formatWIBDate(item.end_date)}</div>
                </div>
              )}
            </div>
          </div>

          {/* Terms & Conditions Card */}
          {item.term_condition && item.term_condition !== '<p>-</p>' && (
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Terms & Conditions</h3>
              <div
                className="text-sm text-gray-700 leading-relaxed [&_p]:mb-1 [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_li]:mb-0.5 [&_strong]:font-semibold"
                dangerouslySetInnerHTML={{ __html: item.term_condition }}
              />
            </div>
          )}

          {/* Timestamps Card */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Timestamps</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Created</label>
                <div className="text-sm text-gray-900">{formatWIBDate(item.created_at)}</div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Updated</label>
                <div className="text-sm text-gray-900">{formatWIBDate(item.updated_at)}</div>
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
          title="Delete Daily Benefit"
          description={`Are you sure you want to delete "${deleteItem.name}"? This action cannot be undone.`}
          isDeleting={isDeleting}
        />
      )}
    </div>
  );
}
