"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ImageUpload from "@/components/ImageUpload";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { formatWIBDate } from "@/lib/formatWIBDate";
import { UnsavedChangesDialog } from "@/components/UnsavedChangesDialog";
import { useAction } from "@/contexts/ActionContext";

const RichTextContentField = dynamic(() => import("@/components/RichTextContentField"), { ssr: false });
import type { RichTextContentFieldRef } from "@/components/RichTextContentField";

interface MerchandiseEditContentProps {
  username: string;
  userEmail: string | null;
  merchandiseId: string;
}

interface MerchandiseItem {
  id: number;
  name: string;
  points: number;
  image_url: string;
  description: string;
  createdAt: string | null;
  updatedAt: string | null;
  status: number;
  category_id: number | null;
}

interface Category {
  id: number;
  category_name: string | null;
}

export default function MerchandiseEditContent({ username, userEmail, merchandiseId }: MerchandiseEditContentProps) {
  const router = useRouter();
  const { setAction, clearAction } = useAction();

  // Form states
  const [formName, setFormName] = useState("");
  const [formPoints, setFormPoints] = useState(100);
  const [formImageUrl, setFormImageUrl] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formStatus, setFormStatus] = useState<number>(1);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [item, setItem] = useState<MerchandiseItem | null>(null);
  const [hasUnsavedRichTextChanges, setHasUnsavedRichTextChanges] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<"save" | "cancel" | null>(null);
  const richTextFieldRef = useRef<RichTextContentFieldRef>(null);

  // Set action state when component mounts
  useEffect(() => {
    setAction('editing', 'Merchandise');
    return () => {
      clearAction();
    };
  }, [setAction, clearAction]);

  // Fetch item data
  useEffect(() => {
    const fetchItem = async () => {
      try {
        const res = await fetch(`/api/merchandise/${merchandiseId}`);
        if (res.ok) {
          const data = await res.json();
          setItem(data);
          setFormName(data.name);
          setFormPoints(data.points);
          setFormImageUrl(data.image_url);
          setFormDescription(data.description);
          setFormStatus(data.status);
          setCategoryId(data.category_id);
        } else {
          toast.error("Failed to fetch merchandise");
          router.push("/merchandise");
        }
      } catch (err) {
        console.error("Failed to fetch item", err);
        toast.error("Failed to fetch merchandise");
        router.push("/merchandise");
      } finally {
        setLoading(false);
      }
    };
    fetchItem();
  }, [merchandiseId, router]);

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch("/api/merchandise-category");
        if (res.ok) {
          const data = await res.json();
          setCategories(data);
        }
      } catch (err) {
        console.error("Failed to fetch categories", err);
      }
    };
    fetchCategories();
  }, []);

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if rich text field has unsaved changes
    if (richTextFieldRef.current?.hasUnsavedChanges()) {
      setPendingAction("save");
      setShowUnsavedDialog(true);
      return;
    }
    
    proceedWithSave();
  };

  const proceedWithSave = async (descriptionOverride?: string) => {
    setIsSubmitting(true);
    const payload = {
      name: formName,
      points: formPoints,
      image_url: formImageUrl,
      description: descriptionOverride || formDescription,
      editedBy: userEmail || username,
      status: formStatus,
      category_id: categoryId,
    };
    try {
      const res = await fetch(`/api/merchandise/${merchandiseId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        toast.success("Merchandise updated successfully");
        router.push("/merchandise");
      } else {
        toast.error("Failed to update merchandise");
      }
    } catch (err) {
      console.error("Failed to edit item", err);
      toast.error("Failed to update merchandise");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    // Check if rich text field has unsaved changes
    if (richTextFieldRef.current?.hasUnsavedChanges()) {
      setPendingAction("cancel");
      setShowUnsavedDialog(true);
      return;
    }
    
    router.push("/merchandise");
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
      router.push("/merchandise");
    }
    setShowUnsavedDialog(false);
    setPendingAction(null);
  };

  if (loading) {
    return (
      <div className="animate-fade-in pb-24">
        <div className="mb-8">
          <Link href="/merchandise" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-4 transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to Merchandise
          </Link>
          <h1 className="text-3xl font-semibold text-gray-900">Edit Merchandise</h1>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in pb-24">
      {/* Page Header */}
      <div className="mb-8">
        <Link href="/merchandise" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-4 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to Merchandise
        </Link>
        <h1 className="text-3xl font-semibold text-gray-900">Edit Merchandise</h1>
        <p className="text-base text-gray-500 mt-2">Edit merchandise item details</p>
      </div>

      {/* Form */}
      <form id="merchandise-form" onSubmit={handleEdit}>
        {/* Basic Information Section */}
        <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-1">Basic Information</h2>
          <p className="text-sm text-gray-500 mb-6">Enter the basic details for this merchandise item</p>
          
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Name <span className="text-red-500">*</span>
              </label>
              <Input
                required
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Enter merchandise name"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Points <span className="text-red-500">*</span>
                </label>
                <NumberInput
                  required
                  min={0}
                  value={formPoints}
                  onChange={(e) => setFormPoints(parseInt(e.target.value) || 0)}
                  placeholder="Enter points required"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <Select value={categoryId?.toString() || ""} onValueChange={(value) => setCategoryId(value ? parseInt(value) : null)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a category">
                      {categoryId ? categories.find(c => c.id === categoryId)?.category_name || `Category ${categoryId}` : undefined}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id.toString()}>
                        {cat.category_name || `Category ${cat.id}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <div className="flex items-center gap-3">
                <Switch
                  checked={formStatus === 1}
                  onCheckedChange={(checked) => setFormStatus(checked ? 1 : 0)}
                />
                <span className="text-sm text-gray-600">{formStatus === 1 ? "Active" : "Inactive"}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Media Section */}
        <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-1">Media</h2>
          <p className="text-sm text-gray-500 mb-6">Add an image for this merchandise item</p>
          
          <div className="space-y-5">
            <ImageUpload
              value={formImageUrl}
              onChange={setFormImageUrl}
              label="Image"
              recommendation="Ratio: 16:9 (Landscape)
Recommended Resolution: 1920 × 1080 px
Format: JPG / PNG / WebP"
            />
          </div>
        </section>

        {/* Terms & Condition Section */}
        <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-1">Terms & Condition</h2>
          <p className="text-sm text-gray-500 mb-6">Enter the terms and conditions for this merchandise</p>
          
          <div className="space-y-5">
            <RichTextContentField
              ref={richTextFieldRef}
              label="Terms & Condition"
              value={formDescription}
              onChange={setFormDescription}
              placeholder="Enter terms and conditions..."
              disableTable={true}
              onDirtyChange={setHasUnsavedRichTextChanges}
            />
          </div>
        </section>

        {/* Audit Info Section */}
        {item && (
          <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-1">Audit Information</h2>
            <p className="text-sm text-gray-500 mb-6">Timestamp information for this item</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Created
                </label>
                <div className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600">
                  {formatWIBDate(item.createdAt)}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Updated
                </label>
                <div className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600">
                  {formatWIBDate(item.updatedAt)}
                </div>
              </div>
            </div>
          </section>
        )}
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
            form="merchandise-form"
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
            ? "You have unsaved changes in the Terms & Condition editor. If you continue, the page will be saved using the last saved content. Your unsaved editor changes will be discarded."
            : "You have unsaved changes in the Terms & Condition editor that will be lost. Are you sure you want to leave?"
        }
        showIcon={false}
      />
    </div>
  );
}
