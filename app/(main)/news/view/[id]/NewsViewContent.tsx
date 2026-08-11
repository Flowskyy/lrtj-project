"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getImageUrl } from "@/lib/utils";
import { formatDisplayDate } from "@/lib/formatWIBDate";
import { ArrowLeft, Loader2, Edit, Trash2, Eye } from "lucide-react";
import { toast } from "sonner";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import Link from "next/link";

interface NewsItem {
  id: number;
  createdBy?: string;
  creatorEmail?: string | null;
  img_url?: string;
  caption_image?: string;
  views: bigint;
  title?: string;
  title_en?: string;
  type?: string;
  content?: string;
  content_en?: string;
  created_at: string | null;
  updated_at: string | null;
  publish_date: string | null;
  status: number;
}

interface NewsViewContentProps {
  newsId: string;
}

export default function NewsViewContent({ newsId }: NewsViewContentProps) {
  const router = useRouter();
  const [item, setItem] = useState<NewsItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteItem, setDeleteItem] = useState<NewsItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchItem = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/news/${newsId}`);
        if (res.ok) {
          const data = await res.json();
          setItem(data);
        } else {
          toast.error("Failed to fetch news");
          router.back();
        }
      } catch (err) {
        console.error("Failed to fetch item", err);
        toast.error("Failed to fetch news");
        router.back();
      } finally {
        setLoading(false);
      }
    };

    fetchItem();
  }, [newsId, router]);

  const handleDelete = async () => {
    if (!deleteItem) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/news/${deleteItem.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("News deleted successfully");
        router.push("/news");
      } else {
        toast.error("Failed to delete news");
      }
    } catch (err) {
      console.error("Failed to delete item", err);
      toast.error("Failed to delete news");
    } finally {
      setIsDeleting(false);
    }
  };

  // Helper to check if HTML content is actually empty
  const isHtmlContentEmpty = (html: string | undefined | null): boolean => {
    if (!html) return true;
    const text = html.replace(/<[^>]*>/g, '').trim();
    return text === '' || text === '-';
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
          <h1 className="text-xl font-semibold text-gray-900">News Details</h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Image */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <div className="aspect-video bg-gray-50 rounded-md overflow-hidden flex items-center justify-center">
              {item.img_url ? (
                <img
                  src={getImageUrl(item.img_url)}
                  alt={item.caption_image || item.title || "News image"}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/logo-lrtj.png";
                    (e.target as HTMLImageElement).className = "h-12 w-auto object-contain brightness-95";
                  }}
                />
              ) : (
                <div className="text-gray-400 text-sm">No image</div>
              )}
            </div>
            {item.caption_image && (
              <p className="text-xs text-gray-500 mt-2 italic">{item.caption_image}</p>
            )}
          </div>
        </div>

        {/* Right Column - Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Title & Status Card */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">{item.title || "Untitled"}</h2>
                <div className="flex items-center gap-3">
                  {item.status === 1 ? (
                    <Badge variant="default" className="bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 text-xs">
                      Published
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200 text-xs">
                      Draft
                    </Badge>
                  )}
                  {item.type && (
                    <Badge variant="outline" className="text-xs">
                      {item.type}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Link href={`/news/edit/${item.id}`}>
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
                <label className="block text-xs font-medium text-gray-500 mb-1">Type</label>
                <div className="text-sm text-gray-900">{item.type || "-"}</div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Publish Date</label>
                <div className="text-sm text-gray-900">
                  {item.publish_date ? formatDisplayDate(item.publish_date) : "-"}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Title (English)</label>
                <div className="text-sm text-gray-900">{item.title_en || "-"}</div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Image Caption</label>
                <div className="text-sm text-gray-900">{item.caption_image || "-"}</div>
              </div>
            </div>
          </div>

          {/* Content Card */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Content</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-2">Indonesian</label>
                <div 
                  className="text-sm text-gray-900 prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ 
                    __html: isHtmlContentEmpty(item.content) ? '<p class="text-gray-400">No content</p>' : (item.content || '') 
                  }}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-2">English</label>
                <div 
                  className="text-sm text-gray-900 prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ 
                    __html: isHtmlContentEmpty(item.content_en) ? '<p class="text-gray-400">No content</p>' : (item.content_en || '') 
                  }}
                />
              </div>
            </div>
          </div>

          {/* Metadata Card */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 mb-1">Metadata</h3>
            <p className="text-xs text-gray-500 mb-4">Read-only information about this news article</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Views</label>
                <div className="text-sm text-gray-900 font-semibold flex items-center gap-2">
                  <Eye className="h-4 w-4 text-gray-400" />
                  {item.views?.toString() || "0"}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Created</label>
                <div className="text-sm text-gray-900">
                  {item.created_at ? formatDisplayDate(item.created_at) : "-"}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Created By</label>
                <div className="text-sm text-gray-900">{item.creatorEmail || item.createdBy || "-"}</div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Updated At</label>
                <div className="text-sm text-gray-900">
                  {item.updated_at ? formatDisplayDate(item.updated_at) : "-"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {deleteItem && (
        <DeleteConfirmDialog
          open={!!deleteItem}
          onOpenChange={() => setDeleteItem(null)}
          onConfirm={handleDelete}
          isDeleting={isDeleting}
          title="Delete News"
          description={`Are you sure you want to delete "${deleteItem.title || 'this news item'}"? This action cannot be undone.`}
        />
      )}
    </div>
  );
}
