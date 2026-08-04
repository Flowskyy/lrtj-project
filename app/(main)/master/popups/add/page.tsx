"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import ImageUpload from "@/components/ImageUpload";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function AddPopupPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
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

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/popups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success("Popup created successfully");
        router.push("/master/popups");
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to create popup");
      }
    } catch (err) {
      console.error("Failed to create popup", err);
      toast.error("Failed to create popup");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="animate-fade-in pb-24">
      {/* Page Header */}
      <div className="mb-8">
        <Link href="/master/popups" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-4 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to Popups
        </Link>
        <h1 className="text-3xl font-semibold text-gray-900">Add Popup</h1>
        <p className="text-base text-gray-500 mt-2">Create a new popup image</p>
      </div>

      {/* Form */}
      <form id="popup-form" onSubmit={handleSubmit}>
        {/* Basic Information Section */}
        <section className="bg-white/60 backdrop-blur-md border border-white/40 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] rounded-2xl p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-1">Basic Information</h2>
          <p className="text-sm text-gray-500 mb-6">Enter the details for this popup</p>

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter popup description (optional)"
                rows={3}
              />
            </div>
          </div>
        </section>

        {/* Media Section */}
        <section className="bg-white/60 backdrop-blur-md border border-white/40 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] rounded-2xl p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-1">Media</h2>
          <p className="text-sm text-gray-500 mb-6">Add an image for this popup</p>

          <div className="space-y-5">
            <ImageUpload
              value={formData.image_url}
              onChange={(value) => setFormData({ ...formData, image_url: value })}
              label="Popup Image"
              recommendation="Recommendation Popup Image
Ratio: 148:210 (A5 Portrait)
Recommended Resolution: 1480 × 2100 px
Format: JPG / PNG"
            />
          </div>
        </section>
      </form>

      {/* Sticky Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/70 backdrop-blur-md border-t border-white/40 p-4 z-50">
        <div className="flex gap-3">
          <Link href="/master/popups" className="flex-1">
            <Button type="button" variant="outline" className="w-full">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            form="popup-form"
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
