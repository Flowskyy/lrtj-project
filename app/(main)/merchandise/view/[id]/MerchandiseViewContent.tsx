"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getImageUrl } from "@/lib/utils";
import { formatWIBDate, formatDisplayDate } from "@/lib/formatWIBDate";
import { ArrowLeft, Loader2, Package, MapPin, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import Link from "next/link";
import RichTextContentField from "@/components/RichTextContentField";

interface MerchandiseItem {
  id: number;
  editedBy?: string;
  display_email?: string;
  name: string;
  image_url: string;
  points: number;
  description: string;
  createdAt: string | null;
  updatedAt: string | null;
  status: number;
  category_id: number | null;
  merchandise_category?: {
    id: number;
    category_name: string | null;
  } | null;
}

interface MerchandiseViewContentProps {
  merchandiseId: string;
}

export default function MerchandiseViewContent({ merchandiseId }: MerchandiseViewContentProps) {
  const router = useRouter();
  const [item, setItem] = useState<MerchandiseItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteItem, setDeleteItem] = useState<MerchandiseItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchItem = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/merchandise/${merchandiseId}`);
        if (res.ok) {
          const data = await res.json();
          setItem(data);
        } else {
          toast.error("Failed to fetch merchandise");
          router.back();
        }
      } catch (err) {
        console.error("Failed to fetch item", err);
        toast.error("Failed to fetch merchandise");
        router.back();
      } finally {
        setLoading(false);
      }
    };

    fetchItem();
  }, [merchandiseId, router]);

  const handleDelete = async () => {
    if (!deleteItem) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/merchandise/${deleteItem.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Merchandise deleted successfully");
        router.push("/merchandise");
      } else {
        toast.error("Failed to delete merchandise");
      }
    } catch (err) {
      console.error("Failed to delete item", err);
      toast.error("Failed to delete merchandise");
    } finally {
      setIsDeleting(false);
    }
  };

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
          <h1 className="text-2xl font-semibold text-gray-900">Merchandise Details</h1>
          <p className="text-sm text-gray-500 mt-1">View complete information about this merchandise item</p>
        </div>
      </div>

      {/* Content Card */}
      <Card className="bg-white border border-gray-200 shadow-sm rounded-xl">
        <CardContent className="p-6">
          {/* Action Bar */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{item.name}</h2>
              <div className="flex items-center gap-2 mt-2">
                {item.status === 1 ? (
                  <Badge variant="default" className="bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 text-xs">
                    Active
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200 text-xs">
                    Inactive
                  </Badge>
                )}
                <span className="text-sm font-semibold text-[#E5262C]">{item.points} pts</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Link href={`/merchandise/edit/${item.id}`}>
                <Button size="sm" className="min-h-[44px]">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </Link>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => setDeleteItem(item)}
                className="min-h-[44px]"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
          {/* Image */}
          <div className="flex justify-center mb-8">
            <div className="h-64 w-64 bg-gray-50 rounded-lg border border-gray-200 overflow-hidden flex items-center justify-center">
              <img
                src={getImageUrl(item.image_url)}
                alt={item.name}
                className="h-full w-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/logo-lrtj.png";
                  (e.target as HTMLImageElement).className = "h-8 w-auto object-contain brightness-95";
                }}
              />
            </div>
          </div>

          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">
                Category
              </label>
              <div className="text-sm text-gray-900">
                {item.merchandise_category?.category_name || "Uncategorized"}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">
                Points Required
              </label>
              <div className="text-sm text-gray-900 font-semibold text-[#E5262C]">
                {item.points} pts
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">
                Last Edited By
              </label>
              <div className="text-sm text-gray-900">{item.display_email || "-"}</div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">
                Status
              </label>
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
          </div>

          {/* Description */}
          <div className="mb-8">
            <label className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">
              Description
            </label>
            <div className="text-sm text-gray-900 prose prose-sm max-w-none">
              <RichTextContentField label="" value={item.description} onChange={() => {}} readOnly />
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

      {/* Delete Dialog */}
      <DeleteConfirmDialog
        open={!!deleteItem}
        onOpenChange={() => setDeleteItem(null)}
        title="Delete Merchandise"
        description="Are you sure you want to delete this merchandise item? This action cannot be undone."
        onConfirm={handleDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
}
