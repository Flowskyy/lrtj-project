"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import { Switch } from "@/components/ui/switch";
import ImageUpload from "@/components/ImageUpload";
import RichTextContentField from "@/components/RichTextContentField";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { formatWIBDate } from "@/lib/formatWIBDate";

interface DailyBenefitEditContentProps {
  username: string;
  dailyBenefitId: string;
}

interface DailyBenefitItem {
  id: number;
  name: string;
  redeem_point: number;
  image_url: string;
  term_condition: string;
  created_at: string | null;
  updated_at: string | null;
  status: number;
  start_date: string | null;
  end_date: string | null;
  is_active: number | null;
}

export default function DailyBenefitEditContent({ username, dailyBenefitId }: DailyBenefitEditContentProps) {
  const router = useRouter();
  
  // Form states
  const [formName, setFormName] = useState("");
  const [formPoints, setFormPoints] = useState(100);
  const [formImageUrl, setFormImageUrl] = useState("");
  const [formTermCondition, setFormTermCondition] = useState("");
  const [formStatus, setFormStatus] = useState<number>(1);
  const [formStartDate, setFormStartDate] = useState("");
  const [formEndDate, setFormEndDate] = useState("");
  const [formIsActive, setFormIsActive] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [item, setItem] = useState<DailyBenefitItem | null>(null);

  // Fetch item data
  useEffect(() => {
    const fetchItem = async () => {
      try {
        const res = await fetch(`/api/daily-benefit/${dailyBenefitId}`);
        if (res.ok) {
          const data = await res.json();
          setItem(data);
          setFormName(data.name);
          setFormPoints(data.redeem_point);
          setFormImageUrl(data.image_url);
          setFormTermCondition(data.term_condition);
          setFormStatus(data.status);
          setFormStartDate(data.start_date ? data.start_date.split('T')[0] : "");
          setFormEndDate(data.end_date ? data.end_date.split('T')[0] : "");
          setFormIsActive(data.is_active ?? 1);
        } else {
          toast.error("Failed to fetch daily benefit");
          router.push("/daily-benefit");
        }
      } catch (err) {
        console.error("Failed to fetch item", err);
        toast.error("Failed to fetch daily benefit");
        router.push("/daily-benefit");
      } finally {
        setLoading(false);
      }
    };
    fetchItem();
  }, [dailyBenefitId, router]);

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const payload = {
      name: formName,
      redeem_point: formPoints,
      image_url: formImageUrl,
      term_condition: formTermCondition,
      editedBy: username,
      status: formStatus,
      start_date: formStartDate || null,
      end_date: formEndDate || null,
      is_active: formIsActive,
    };
    try {
      const res = await fetch(`/api/daily-benefit/${dailyBenefitId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        toast.success("Daily Benefit updated successfully");
        router.push("/daily-benefit");
      } else {
        toast.error("Failed to update daily benefit");
      }
    } catch (err) {
      console.error("Failed to edit item", err);
      toast.error("Failed to update daily benefit");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-fade-in pb-24">
        <div className="mb-8">
          <Link href="/daily-benefit" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-4 transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to Daily Benefits
          </Link>
          <h1 className="text-3xl font-semibold text-gray-900">Edit Daily Benefit</h1>
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
        <Link href="/daily-benefit" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-4 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to Daily Benefits
        </Link>
        <h1 className="text-3xl font-semibold text-gray-900">Edit Daily Benefit</h1>
        <p className="text-base text-gray-500 mt-2">Edit daily benefit item details</p>
      </div>

      {/* Form */}
      <form id="daily-benefit-form" onSubmit={handleEdit}>
        {/* Basic Information Section */}
        <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-1">Basic Information</h2>
          <p className="text-sm text-gray-500 mb-6">Enter the basic details for this daily benefit</p>
          
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Name <span className="text-red-500">*</span>
              </label>
              <Input
                required
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Enter daily benefit name"
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
          </div>
        </section>

        {/* Media Section */}
        <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-1">Media</h2>
          <p className="text-sm text-gray-500 mb-6">Add an image for this daily benefit</p>
          
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
          <p className="text-sm text-gray-500 mb-6">Enter the terms and conditions for this daily benefit</p>
          
          <div className="space-y-5">
            <RichTextContentField
              label="Terms & Condition"
              value={formTermCondition}
              onChange={setFormTermCondition}
              placeholder="Enter terms and conditions..."
            />
          </div>
        </section>

        {/* Schedule Section */}
        <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-1">Schedule</h2>
          <p className="text-sm text-gray-500 mb-6">Configure the validity period for this daily benefit</p>
          
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date
                </label>
                <Input
                  type="date"
                  value={formStartDate}
                  onChange={(e) => setFormStartDate(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date
                </label>
                <Input
                  type="date"
                  value={formEndDate}
                  onChange={(e) => setFormEndDate(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Is Active
              </label>
              <div className="flex items-center gap-3">
                <Switch
                  checked={formIsActive === 1}
                  onCheckedChange={(checked) => setFormIsActive(checked ? 1 : 0)}
                />
                <span className="text-sm text-gray-600">{formIsActive === 1 ? "Yes" : "No"}</span>
              </div>
            </div>
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
                  {formatWIBDate(item.created_at)}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Updated
                </label>
                <div className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600">
                  {formatWIBDate(item.updated_at)}
                </div>
              </div>
            </div>
          </section>
        )}
      </form>

      {/* Sticky Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-200 p-4 z-50">
        <div className="flex gap-3">
          <Link href="/daily-benefit" className="flex-1">
            <Button type="button" variant="outline" className="w-full">
              Cancel
            </Button>
          </Link>
          <Button 
            type="submit" 
            form="daily-benefit-form"
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
