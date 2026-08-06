"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDisplayDate } from "@/lib/formatWIBDate";
import { ArrowLeft, Trash2 } from "lucide-react";
import { toast } from "sonner";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";

interface MemberItem {
  id: number;
  name: string | null;
  email: string;
  no_telepon: string | null;
  alamat: string | null;
  status: number;
  created_at: string | null;
  updated_at: string | null;
  slc_point: number;
  trip_count: number;
  jenis_kelamin: string | null;
  lrtj_saldo: string | null;
  verified_at: string | null;
  nik: string | null;
  tempat_lahir: string | null;
  birthday: string | null;
  province_id: number | null;
  regency_id: number | null;
  activation_slc: number;
  activation_slc_at: string | null;
  activation_lrtjpay: number | null;
  activation_lrtjpay_at: string | null;
  member_level_id: number | null;
  push_notification: number;
  email_notification: number;
  new_content_notification: number;
  image: string | null;
  ecard: string | null;
  ecard2: string | null;
  province_name: string | null;
  regency_name: string | null;
  membership_name: string | null;
}

interface UserViewContentProps {
  userId: string;
}

export default function UserViewContent({ userId }: UserViewContentProps) {
  const router = useRouter();
  const [item, setItem] = useState<MemberItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteItem, setDeleteItem] = useState<MemberItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/users/${userId}`);
        if (res.ok) {
          const data = await res.json();
          setItem(data);
        } else {
          toast.error("Failed to fetch user");
          router.back();
        }
      } catch (err) {
        console.error("Failed to fetch user", err);
        toast.error("Failed to fetch user");
        router.back();
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [userId, router]);

  const handleDelete = async () => {
    if (!deleteItem) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/users/${deleteItem.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        const result = await res.json();
        toast.success(result.message || "User permanently deleted successfully");
        router.push("/users");
      } else {
        const errorData = await res.json();
        toast.error(errorData.error || "Failed to delete user");
      }
    } catch (err) {
      console.error("Failed to delete user", err);
      toast.error("Failed to delete user");
    } finally {
      setIsDeleting(false);
    }
  };

  const maskNIK = (nik: string | null) => {
    if (!nik) return "-";
    if (nik.length <= 4) return nik;
    return nik.substring(0, 4) + "*".repeat(nik.length - 4);
  };

  const getSlcBadge = () => {
    if (item?.activation_slc === 1) {
      return (
        <Badge variant="default" className="bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 text-xs">
          SLC
        </Badge>
      );
    }
    return null;
  };

  const getLrtjPayBadge = () => {
    if (item?.activation_lrtjpay === 1) {
      return (
        <Badge variant="default" className="bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 text-xs">
          LRTJ Pay
        </Badge>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-9" />
          <Skeleton className="h-6 w-48" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <Skeleton className="h-6 w-3/4 mb-4" />
              <Skeleton className="h-4 w-1/4" />
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <Skeleton className="h-4 w-16 mb-4" />
              <div className="space-y-3">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-40" />
              </div>
            </div>
          </div>
          <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <Skeleton className="h-4 w-20 mb-4" />
              <Skeleton className="h-4 w-40" />
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <Skeleton className="h-4 w-16 mb-4" />
              <div className="grid grid-cols-2 gap-6">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-gray-500">User not found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="h-9 w-9"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl font-semibold text-gray-900">User Details</h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Title & Status Card */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">{item.name || "Unknown User"}</h2>
                <div className="flex items-center gap-3">
                  {getSlcBadge()}
                  {getLrtjPayBadge()}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => setDeleteItem(item)}
                  className="h-9"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          </div>

          {/* Basic Info Card */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Basic Information</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Email</label>
                <div className="text-sm text-gray-900">{item.email}</div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Phone</label>
                <div className="text-sm text-gray-900">{item.no_telepon || "-"}</div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Gender</label>
                <div className="text-sm text-gray-900">
                  {item.jenis_kelamin === "L" ? "Laki-laki" : item.jenis_kelamin === "P" ? "Perempuan" : item.jenis_kelamin || "-"}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Address</label>
                <div className="text-sm text-gray-900">{item.alamat || "-"}</div>
              </div>
            </div>
          </div>

          {/* Personal Info Card */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">NIK</label>
                <div className="text-sm text-gray-900">{maskNIK(item.nik)}</div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Place of Birth</label>
                <div className="text-sm text-gray-900">{item.tempat_lahir || "-"}</div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Birthday</label>
                <div className="text-sm text-gray-900">{item.birthday || "-"}</div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Location</label>
                <div className="text-sm text-gray-900">
                  {item.province_name && item.regency_name 
                    ? `${item.regency_name}, ${item.province_name}` 
                    : item.province_name || item.regency_name || "-"}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Stats Card */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Account Statistics</h3>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">SLC Points</label>
                <div className="text-sm text-gray-900 font-semibold">{item.slc_point.toLocaleString()}</div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Trips</label>
                <div className="text-sm text-gray-900 font-semibold">{item.trip_count.toLocaleString()}</div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">LRTJ Saldo</label>
                <div className="text-sm text-gray-900 font-semibold">{item.lrtj_saldo || "-"}</div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Membership</label>
                <div className="text-sm text-gray-900 font-semibold">{item.membership_name || "-"}</div>
              </div>
            </div>
          </div>

          {/* Activation Info Card */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Activation Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">SLC Activation</label>
                <div className="text-sm text-gray-900">{item.activation_slc === 1 ? "Activated" : "Not Activated"}</div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">SLC Activation Date</label>
                <div className="text-sm text-gray-900">{item.activation_slc_at ? formatDisplayDate(item.activation_slc_at) : "-"}</div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">LRTJ Pay Activation</label>
                <div className="text-sm text-gray-900">{item.activation_lrtjpay === 1 ? "Activated" : "Not Activated"}</div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">LRTJ Pay Activation Date</label>
                <div className="text-sm text-gray-900">{item.activation_lrtjpay_at ? formatDisplayDate(item.activation_lrtjpay_at) : "-"}</div>
              </div>
            </div>
          </div>

          {/* Notification Preferences Card */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Notification Preferences</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Push</label>
                <div className="text-sm text-gray-900">{item.push_notification === 1 ? "Enabled" : "Disabled"}</div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Email</label>
                <div className="text-sm text-gray-900">{item.email_notification === 1 ? "Enabled" : "Disabled"}</div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">New Content</label>
                <div className="text-sm text-gray-900">{item.new_content_notification === 1 ? "Enabled" : "Disabled"}</div>
              </div>
            </div>
          </div>

          {/* Metadata Card */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 mb-1">Metadata</h3>
            <p className="text-xs text-gray-500 mb-4">Read-only information about this user</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Verified At</label>
                <div className="text-sm text-gray-900">{item.verified_at ? formatDisplayDate(item.verified_at) : "-"}</div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Created</label>
                <div className="text-sm text-gray-900">{item.created_at ? formatDisplayDate(item.created_at) : "-"}</div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Updated At</label>
                <div className="text-sm text-gray-900">{item.updated_at ? formatDisplayDate(item.updated_at) : "-"}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {deleteItem && (
        <DeleteConfirmDialog
          open={!!deleteItem}
          onOpenChange={() => setDeleteItem(null)}
          title="Permanently Delete User"
          description={`Are you sure you want to permanently delete "${deleteItem.name}"? This action cannot be undone and the user will be completely removed from the database.`}
          onConfirm={handleDelete}
          isDeleting={isDeleting}
        />
      )}
    </div>
  );
}