"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import ImageUpload from "@/components/ImageUpload";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface NewsItem {
  id: number;
  createdBy?: string;
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

interface NewsEditContentProps {
  username: string;
  newsId: string;
}

export default function NewsEditContent({ username, newsId }: NewsEditContentProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [item, setItem] = useState<NewsItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
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

  // Fetch news item
  useEffect(() => {
    const fetchItem = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/news/${newsId}`);
        if (res.ok) {
          const data = await res.json();
          setItem(data);
          setFormTitle(data.title || "");
          setFormTitleEn(data.title_en || "");
          setFormContent(data.content || "");
          setFormContentEn(data.content_en || "");
          setFormImageUrl(data.img_url || "");
          setFormCaptionImage(data.caption_image || "");
          setFormType(data.type || "general");
          setFormStatus(data.status === 1);
          setFormPublishDate(data.publish_date ? new Date(data.publish_date).toISOString().split('T')[0] : "");
        } else {
          toast.error("Failed to load news item");
          router.push("/news");
        }
      } catch (err) {
        console.error("Failed to fetch item", err);
        toast.error("Failed to load news item");
        router.push("/news");
      } finally {
        setLoading(false);
      }
    };

    fetchItem();
  }, [newsId, router]);

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/news/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formTitle,
          title_en: formTitleEn,
          content: formContent,
          content_en: formContentEn,
          img_url: formImageUrl,
          caption_image: formCaptionImage,
          type: formType,
          status: formStatus ? 1 : 0,
          publish_date: formPublishDate || null,
        }),
      });
      if (res.ok) {
        toast.success("News updated successfully");
        router.push("/news");
      } else {
        toast.error("Failed to update news");
      }
    } catch (err) {
      console.error("Failed to edit item", err);
      toast.error("Failed to update news");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-fade-in pb-24">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-4" />
        <div className="h-10 w-64 bg-gray-200 rounded animate-pulse mb-2" />
        <div className="h-5 w-96 bg-gray-200 rounded animate-pulse mb-8" />
        <div className="space-y-6">
          <div className="h-32 bg-gray-200 rounded animate-pulse" />
          <div className="h-32 bg-gray-200 rounded animate-pulse" />
          <div className="h-32 bg-gray-200 rounded animate-pulse" />
          <div className="h-32 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  if (!item) {
    return null;
  }

  return (
    <div className="animate-fade-in pb-24">
      {/* Page Header */}
      <div className="mb-8 pb-6 border-b border-gray-200">
        <Link href="/news" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-4 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to News
        </Link>
        <h1 className="text-2xl font-semibold text-gray-900">Edit News</h1>
        <p className="text-sm text-gray-500 mt-1">Update this news article</p>
      </div>

      {/* Form */}
      <form id="news-form" onSubmit={handleEdit} className="max-w-3xl">
        {/* Basic Information Section */}
        <section className="pt-0 pb-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Basic Information</h2>
          <p className="text-sm text-gray-500 mb-6">Enter the basic details for this news article</p>
          
          <div className="space-y-4">
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
                <Select value={formType} onValueChange={(v) => setFormType(v || 'general')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="promotion">Promotion</SelectItem>
                    <SelectItem value="announcement">Announcement</SelectItem>
                    <SelectItem value="event">Event</SelectItem>
                  </SelectContent>
                </Select>
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
        <section className="py-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Media</h2>
          <p className="text-sm text-gray-500 mb-6">Add an image to accompany your news article</p>
          
          <div className="space-y-4">
            <ImageUpload
              value={formImageUrl}
              onChange={setFormImageUrl}
              label="Featured Image"
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
        <section className="py-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Content</h2>
          <p className="text-sm text-gray-500 mb-6">Write the main content for your news article</p>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Content (Indonesian)
              </label>
              <textarea
                rows={8}
                value={formContent}
                onChange={(e) => setFormContent(e.target.value)}
                placeholder="Enter news content in Indonesian..."
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-[#E5262C] focus:ring-2 focus:ring-[#E5262C]/20 resize-y"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Content (English)
              </label>
              <textarea
                rows={8}
                value={formContentEn}
                onChange={(e) => setFormContentEn(e.target.value)}
                placeholder="Enter news content in English..."
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-[#E5262C] focus:ring-2 focus:ring-[#E5262C]/20 resize-y"
              />
            </div>
          </div>
        </section>

        {/* Publishing Section */}
        <section className="py-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Publishing</h2>
          <p className="text-sm text-gray-500 mb-6">Configure when this news article should be published</p>
          
          <div className="space-y-4">
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

        {/* Metadata Section */}
        <section className="py-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Metadata</h2>
          <p className="text-sm text-gray-500 mb-6">Read-only information about this news article</p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Views
              </label>
              <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600">
                {item.views.toString()}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Created
              </label>
              <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600">
                {item.created_at ? new Date(item.created_at).toLocaleDateString() : "-"}
              </div>
            </div>
          </div>
        </section>
      </form>

      {/* Sticky Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-50">
        <div className="max-w-3xl mx-auto flex gap-3">
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
