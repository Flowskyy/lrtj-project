"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import { Switch } from "@/components/ui/switch";
import ImageUpload from "@/components/ImageUpload";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

const RichTextContentField = dynamic(() => import("@/components/RichTextContentField"), { ssr: false });

interface DailyBenefitAddContentProps {
  username: string;
  userEmail: string | null;
}

export default function DailyBenefitAddContent({ username, userEmail }: DailyBenefitAddContentProps) {
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

  const handleAdd = async (e: React.FormEvent) => {
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
      const res = await fetch("/api/daily-benefit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        toast.success("Daily Benefit added successfully");
        router.push("/daily-benefit");
      } else {
        toast.error("Failed to add daily benefit");
      }
    } catch (err) {
      console.error("Failed to add item", err);
      toast.error("Failed to add daily benefit");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="animate-fade-in pb-24">
      {/* Page Header */}
      <div className="mb-8">
        <Link href="/daily-benefit" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-4 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to Daily Benefits
        </Link>
        <h1 className="text-3xl font-semibold text-gray-900">Add Daily Benefit</h1>
        <p className="text-base text-gray-500 mt-2">Create a new daily benefit item</p>
      </div>

      {/* Form */}
      <form id="daily-benefit-form" onSubmit={handleAdd}>
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
