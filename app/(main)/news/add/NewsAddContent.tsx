"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import TypeDropdown from "@/components/TypeDropdown";
import { Switch } from "@/components/ui/switch";
import ImageUpload from "@/components/ImageUpload";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import dynamic from "next/dynamic";

const RichTextContentField = dynamic(() => import("@/components/RichTextContentField"), { ssr: false });

interface NewsAddContentProps {
  username: string;
  userEmail: string | null;
}

export default function NewsAddContent({ username, userEmail }: NewsAddContentProps) {
  const router = useRouter();
  
  // Form states
  const [formTitle, setFormTitle] = useState("");
  const [formTitleEn, setFormTitleEn] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formContentEn, setFormContentEn] = useState("");
  const [formImageUrl, setFormImageUrl] = useState("");
  const [formCaptionImage, setFormCaptionImage] = useState("");
  const [formType, setFormType] = useState("general");
  const [formStatus, setFormStatus] = useState<boolean>(true);
  const [formPublishDate, setFormPublishDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);


  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const payload = {
      title: formTitle,
      title_en: formTitleEn,
      content: formContent || '<p>-</p>',
      content_en: formContentEn || '<p>-</p>',
      img_url: formImageUrl,
      caption_image: formCaptionImage,
      type: formType,
      status: formStatus ? 1 : 0,
      publish_date: formPublishDate || null,
      createdBy: username,
      creatorEmail: userEmail,
    };
    try {
      const res = await fetch("/api/news", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        toast.success("News added successfully");
        router.push("/news");
      } else {
        toast.error("Failed to add news");
      }
    } catch (err) {
      console.error("Failed to add item", err);
      toast.error("Failed to add news");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="animate-fade-in pb-24">
      {/* Page Header */}
      <div className="mb-8">
        <Link href="/news" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-4 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to News
        </Link>
        <h1 className="text-3xl font-semibold text-gray-900">Add News</h1>
        <p className="text-base text-gray-500 mt-2">Create a new news article</p>
      </div>

      {/* Form */}
      <form id="news-form" onSubmit={handleAdd}>
        {/* Basic Information Section */}
        <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-1">Basic Information</h2>
          <p className="text-sm text-gray-500 mb-6">Enter the basic details for this news article</p>
          
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title <span className="text-red-500">*</span>
              </label>
              <Input
                required
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="Enter news title"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title (English)
              </label>
              <Input
                value={formTitleEn}
                onChange={(e) => setFormTitleEn(e.target.value)}
                placeholder="Enter news title in English"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type
                </label>
                <TypeDropdown value={formType} onChange={setFormType} placeholder="Select type" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <div className="flex items-center gap-3">
                  <Switch
                    checked={formStatus}
                    onCheckedChange={setFormStatus}
                  />
                  <span className="text-sm text-gray-600">
                    {formStatus ? "Published" : "Draft"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Media Section */}
        <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-1">Media</h2>
          <p className="text-sm text-gray-500 mb-6">Add an image to accompany your news article</p>
          
          <div className="space-y-5">
            <ImageUpload
              value={formImageUrl}
              onChange={setFormImageUrl}
              label="Featured Image"
              recommendation="Recommended: 16:9 aspect ratio (e.g., 1920x1080)"
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Image Caption
              </label>
              <Input
                value={formCaptionImage}
                onChange={(e) => setFormCaptionImage(e.target.value)}
                placeholder="Image caption/alt text"
              />
            </div>
          </div>
        </section>

        {/* Content Section */}
        <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-1">Content</h2>
          <p className="text-sm text-gray-500 mb-6">Write the main content for your news article</p>
          
          <div className="space-y-5">
            <RichTextContentField
              label="Content (Indonesian)"
              value={formContent}
              onChange={setFormContent}
              placeholder="Enter news content in Indonesian..."
            />
            <RichTextContentField
              label="Content (English)"
              value={formContentEn}
              onChange={setFormContentEn}
              placeholder="Enter news content in English..."
            />
          </div>
        </section>

        {/* Publishing Section */}
        <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-1">Publishing</h2>
          <p className="text-sm text-gray-500 mb-6">Configure when this news article should be published</p>
          
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Publish Date
              </label>
              <Input
                type="date"
                value={formPublishDate}
                onChange={(e) => setFormPublishDate(e.target.value)}
              />
            </div>
          </div>
        </section>
      </form>

      {/* Sticky Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-200 p-4 z-50">
        <div className="flex gap-3">
          <Link href="/news" className="flex-1">
            <Button type="button" variant="outline" className="w-full">
              Cancel
            </Button>
          </Link>
          <Button 
            type="submit" 
            form="news-form"
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
