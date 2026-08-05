"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ImageUpload from "@/components/ImageUpload";
import RichTextContentField from "@/components/RichTextContentField";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface MerchandiseAddContentProps {
  username: string;
  userEmail: string | null;
}

interface Category {
  id: number;
  category_name: string | null;
}

export default function MerchandiseAddContent({ username, userEmail }: MerchandiseAddContentProps) {
  const router = useRouter();
  
  // Form states
  const [formName, setFormName] = useState("");
  const [formPoints, setFormPoints] = useState(100);
  const [formImageUrl, setFormImageUrl] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formStatus, setFormStatus] = useState<number>(1);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const payload = {
      name: formName,
      points: formPoints,
      image_url: formImageUrl,
      description: formDescription,
      editedBy: userEmail || username,
      status: formStatus,
      category_id: categoryId,
    };
    try {
      const res = await fetch("/api/merchandise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        toast.success("Merchandise added successfully");
        router.push("/merchandise");
      } else {
        toast.error("Failed to add merchandise");
      }
    } catch (err) {
      console.error("Failed to add item", err);
      toast.error("Failed to add merchandise");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="animate-fade-in pb-24">
      {/* Page Header */}
      <div className="mb-8">
        <Link href="/merchandise" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-4 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to Merchandise
        </Link>
        <h1 className="text-3xl font-semibold text-gray-900">Add Merchandise</h1>
        <p className="text-base text-gray-500 mt-2">Create a new merchandise item</p>
      </div>

      {/* Form */}
      <form id="merchandise-form" onSubmit={handleAdd}>
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
            />
          </div>
        </section>

        {/* Terms & Condition Section */}
        <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-1">Terms & Condition</h2>
          <p className="text-sm text-gray-500 mb-6">Enter the terms and conditions for this merchandise</p>
          
          <div className="space-y-5">
            <RichTextContentField
              label="Terms & Condition"
              value={formDescription}
              onChange={setFormDescription}
              placeholder="Enter terms and conditions..."
            />
          </div>
        </section>
      </form>

      {/* Sticky Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-200 p-4 z-50">
        <div className="flex gap-3">
          <Link href="/merchandise" className="flex-1">
            <Button type="button" variant="outline" className="w-full">
              Cancel
            </Button>
          </Link>
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
    </div>
  );
}
