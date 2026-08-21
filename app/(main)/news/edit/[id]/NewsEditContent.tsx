"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import TypeDropdown from "@/components/TypeDropdown";
import { Switch } from "@/components/ui/switch";
import ImageUpload from "@/components/ImageUpload";
import { DateTimePicker } from "@/components/ui/datetime-picker";
import Link from "next/link";
import { ArrowLeft, Eye } from "lucide-react";
import { formatWIBDate } from "@/lib/formatWIBDate";
import { UnsavedChangesDialog } from "@/components/UnsavedChangesDialog";
import { useAction } from "@/contexts/ActionContext";
import RichTextContentField, { RichTextContentFieldRef } from "@/components/RichTextContentField";

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

interface NewsEditContentProps {
  newsId: string;
}

export default function NewsEditContent({ newsId }: NewsEditContentProps) {
  const router = useRouter();
  const { setAction, clearAction } = useAction();
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
  const [formType, setFormType] = useState("news");
  const [formStatus, setFormStatus] = useState<boolean>(true);
  const [formPublishDate, setFormPublishDate] = useState("");
  const [hasUnsavedRichTextChanges, setHasUnsavedRichTextChanges] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<"save" | "cancel" | null>(null);
  const richTextFieldIdRef = useRef<RichTextContentFieldRef>(null);
  const richTextFieldEnRef = useRef<RichTextContentFieldRef>(null);

  // Set action state when component mounts
  useEffect(() => {
    setAction('editing', 'News');
    return () => {
      clearAction();
    };
  }, [setAction, clearAction]);


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
          setFormImageUrl(data.img_url || "");
          setFormCaptionImage(data.caption_image || "");
          setFormType(data.type || "news");
          setFormStatus(data.status === 1);
          setFormPublishDate(data.publish_date || "");
          
          setFormContent(data.content || '<p>-</p>');
          setFormContentEn(data.content_en || '<p>-</p>');
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
    
    // Check if either rich text field has unsaved changes
    const hasUnsavedId = richTextFieldIdRef.current?.hasUnsavedChanges();
    const hasUnsavedEn = richTextFieldEnRef.current?.hasUnsavedChanges();
    
    if (hasUnsavedId || hasUnsavedEn) {
      setPendingAction("save");
      setShowUnsavedDialog(true);
      return;
    }
    
    proceedWithSave();
  };

  const proceedWithSave = async (contentOverride?: string, contentEnOverride?: string) => {
    if (!item) {
      toast.error("News item not loaded");
      return;
    }

    setIsSubmitting(true);
    const payload = {
      title: formTitle,
      title_en: formTitleEn,
      content: contentOverride || formContent || '<p>-</p>',
      content_en: contentEnOverride || formContentEn || '<p>-</p>',
      img_url: formImageUrl,
      caption_image: formCaptionImage,
      type: formType,
      status: formStatus ? 1 : 0,
      publish_date: formPublishDate || null,
    };
    try {
      const res = await fetch(`/api/news/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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

  const handleCancel = () => {
    // Check if either rich text field has unsaved changes
    const hasUnsavedId = richTextFieldIdRef.current?.hasUnsavedChanges();
    const hasUnsavedEn = richTextFieldEnRef.current?.hasUnsavedChanges();
    
    if (hasUnsavedId || hasUnsavedEn) {
      setPendingAction("cancel");
      setShowUnsavedDialog(true);
      return;
    }
    
    router.push("/news");
  };

  const handleUnsavedDialogConfirm = () => {
    // Keep editing - just close the dialog
    setShowUnsavedDialog(false);
    setPendingAction(null);
  };

  const handleUnsavedDialogDiscard = () => {
    if (pendingAction === "save") {
      // Discard rich text changes and proceed with page save using existing content
      proceedWithSave();
    } else if (pendingAction === "cancel") {
      // Discard changes and proceed with cancel
      router.push("/news");
    }
    setShowUnsavedDialog(false);
    setPendingAction(null);
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
      <div className="mb-8">
        <Link href="/news" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-4 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to News
        </Link>
        <h1 className="text-3xl font-semibold text-gray-900">Edit News</h1>
        <p className="text-base text-gray-500 mt-2">Update this news article</p>
      </div>

      {/* Form */}
      <form id="news-form" onSubmit={handleEdit}>
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type
              </label>
              <TypeDropdown value={formType} onChange={setFormType} placeholder="Select type" />
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
              recommendation="Ratio: 16:9 (Landscape)
Recommended Resolution: 1920 × 1080 px
Format: JPG / PNG / WebP"
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
              ref={richTextFieldIdRef}
              label="Content (Indonesian)"
              value={formContent}
              onChange={setFormContent}
              placeholder="Enter news content in Indonesian..."
              disableTable={true}
              onDirtyChange={setHasUnsavedRichTextChanges}
            />
            <RichTextContentField
              ref={richTextFieldEnRef}
              label="Content (English)"
              value={formContentEn}
              onChange={setFormContentEn}
              placeholder="Enter news content in English..."
              disableTable={true}
              onDirtyChange={setHasUnsavedRichTextChanges}
            />
          </div>
        </section>

        {/* Publishing Options Section */}
        <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-1">Publishing Options</h2>
          <p className="text-sm text-gray-500 mb-6">Configure when and how this news article is published</p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Publish Date
              </label>
              <DateTimePicker
                value={formPublishDate}
                onChange={setFormPublishDate}
                placeholder="Select publish date and time"
              />
            </div>
          </div>
        </section>

        {/* Metadata Section */}
        <section className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-1">Metadata</h2>
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
                {item.created_at ? formatWIBDate(item.created_at) : "-"}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Created By</label>
              <div className="text-sm text-gray-900">{item.creatorEmail || item.createdBy || "-"}</div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Updated At</label>
              <div className="text-sm text-gray-900">
                {item.updated_at ? formatWIBDate(item.updated_at) : "-"}
              </div>
            </div>
          </div>
        </section>
      </form>

      {/* Sticky Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-200 p-4 z-50">
        <div className="flex gap-3">
          <Button 
            type="button" 
            variant="outline" 
            className="flex-1"
            onClick={handleCancel}
          >
            Cancel
          </Button>
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

      {/* Unsaved Changes Dialog */}
      <UnsavedChangesDialog
        open={showUnsavedDialog}
        onOpenChange={(open) => {
          setShowUnsavedDialog(open);
          if (!open) setPendingAction(null);
        }}
        onKeepEditing={handleUnsavedDialogConfirm}
        onDiscard={handleUnsavedDialogDiscard}
        description={
          pendingAction === "save"
            ? "You have unsaved changes in the Content editor. If you continue, the page will be saved using the last saved content. Your unsaved editor changes will be discarded."
            : "You have unsaved changes in the Content editor that will be lost. Are you sure you want to leave?"
        }
        showIcon={false}
      />
    </div>
  );
}
