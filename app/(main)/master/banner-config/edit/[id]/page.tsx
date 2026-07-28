"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Save } from "lucide-react";
import ImageUpload from "@/components/ImageUpload";
import Link from "next/link";
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
  const [saving, setSaving] = useState(false);
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

    setSaving(true);
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
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-4">
          <Skeleton className="h-9 w-20" />
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </div>
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent className="space-y-6">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-48 w-full" />
            <div className="flex gap-3">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-24" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/master/banner-config">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Banner</h1>
          <p className="text-sm text-gray-500 mt-1">Edit banner #{id}</p>
        </div>
      </div>

      {/* Form Card */}
      <Card>
        <CardHeader>
          <CardTitle>Banner Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter banner description (optional)"
                className="mt-1"
                rows={3}
              />
            </div>
            <ImageUpload
              value={formData.image_url}
              onChange={(value) => setFormData({ ...formData, image_url: value })}
              label="Banner Image"
            />
            <div className="flex items-center gap-3 pt-4">
              <Button
                type="submit"
                disabled={saving}
                className="bg-[#E5262C] hover:bg-[#c41e22] text-white"
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? "Saving..." : "Save Changes"}
              </Button>
              <Link href="/master/banner-config">
                <Button type="button" variant="outline" disabled={saving}>
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
