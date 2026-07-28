"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Save } from "lucide-react";
import ImageUpload from "@/components/ImageUpload";
import Link from "next/link";

export default function AddBannerPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    description: "",
    image_url: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.image_url.trim()) {
      toast.error("Image is required");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/banners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success("Banner created successfully");
        router.push("/master/banner-config");
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to create banner");
      }
    } catch (err) {
      console.error("Failed to create banner", err);
      toast.error("Failed to create banner");
    } finally {
      setLoading(false);
    }
  };

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
          <h1 className="text-2xl font-bold text-gray-900">Add Banner</h1>
          <p className="text-sm text-gray-500 mt-1">Create a new banner</p>
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
                disabled={loading}
                className="bg-[#E5262C] hover:bg-[#c41e22] text-white"
              >
                <Save className="h-4 w-4 mr-2" />
                {loading ? "Creating..." : "Create Banner"}
              </Button>
              <Link href="/master/banner-config">
                <Button type="button" variant="outline" disabled={loading}>
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
