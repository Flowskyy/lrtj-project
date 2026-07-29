"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import ImageUpload from "@/components/ImageUpload";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface Banner {
  id: number;
  description: string | null;
  image_url: string;
  sequence: number;
  created_at: string | null;
  updated_at: string | null;
  created_by: string | null;
  updated_by: string | null;
}

export default function EditBannerPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [banner, setBanner] = useState<Banner | null>(null);
  const [formData, setFormData] = useState({
    description: "",
    image_url: "",
  });

  useEffect(() => {
    fetchBanner();
  }, [id]);

  const fetchBanner = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/banners/${id}`);
      if (res.ok) {
        const data = await res.json();
        setBanner(data);
        setFormData({
          description: data.description || "",
          image_url: data.image_url,
        });
      } else {
        toast.error("Failed to fetch banner");
        router.push("/master/banner-config");
      }
    } catch (err) {
      console.error("Failed to fetch banner", err);
      toast.error("Failed to fetch banner");
      router.push("/master/banner-config");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.image_url.trim()) {
      toast.error("Image is required");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/banners/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success("Banner updated successfully");
        router.push("/master/banner-config");
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to update banner");
      }
    } catch (err) {
      console.error("Failed to update banner", err);
      toast.error("Failed to update banner");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-fade-in pb-24">
        <div className="mb-8">
          <Skeleton className="h-6 w-32 mb-4" />
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-5 w-64 mt-2" />
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <Skeleton className="h-6 w-40 mb-6" />
          <Skeleton className="h-24 w-full mb-6" />
          <Skeleton className="h-6 w-24 mb-6" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in pb-24">
      {/* Page Header */}
      <div className="mb-8">
        <Link href="/master/banner-config" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-4 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to Banner
        </Link>
        <h1 className="text-3xl font-semibold text-gray-900">Edit Banner</h1>
        <p className="text-base text-gray-500 mt-2">Edit banner details</p>
      </div>

      {/* Form */}
      <form id="banner-form" onSubmit={handleSubmit}>
        {/* Basic Information Section */}
        <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-1">Basic Information</h2>
          <p className="text-sm text-gray-500 mb-6">Enter the details for this banner</p>

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter banner description (optional)"
                rows={3}
              />
            </div>
          </div>
        </section>

        {/* Media Section */}
        <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-1">Media</h2>
          <p className="text-sm text-gray-500 mb-6">Add an image for this banner</p>

          <div className="space-y-5">
            <ImageUpload
              value={formData.image_url}
              onChange={(value) => setFormData({ ...formData, image_url: value })}
              label="Banner Image"
            />
          </div>
        </section>

        {/* Audit Info Section */}
        {banner && (
          <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-1">Audit Information</h2>
            <p className="text-sm text-gray-500 mb-6">Timestamp information for this item</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Created
                </label>
                <div className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600">
                  {banner.created_at ? new Date(banner.created_at).toLocaleString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                    timeZone: "Asia/Jakarta",
                  }) : "-"}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Updated
                </label>
                <div className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600">
                  {banner.updated_at ? new Date(banner.updated_at).toLocaleString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                    timeZone: "Asia/Jakarta",
                  }) : "-"}
                </div>
              </div>
            </div>
          </section>
        )}
      </form>

      {/* Sticky Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-200 p-4 z-50">
        <div className="flex gap-3">
          <Link href="/master/banner-config" className="flex-1">
            <Button type="button" variant="outline" className="w-full">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            form="banner-form"
            className="flex-1 bg-[#E5262C] hover:bg-[#c91e24] text-white"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
}
