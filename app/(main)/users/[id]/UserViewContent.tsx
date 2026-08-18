"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { formatWIBDate } from "@/lib/formatWIBDate";
import { ArrowLeft, Trash2, AlertTriangle, ChevronDown, ChevronRight } from "lucide-react";
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

interface RelatedRecord {
  table: string;
  count: number;
  originalTable: string;
  preview: any[];
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
  const [deactivateSlcConfirm, setDeactivateSlcConfirm] = useState(false);
  const [deactivateLrtjPayConfirm, setDeactivateLrtjPayConfirm] = useState(false);
  const [isDeactivatingSlc, setIsDeactivatingSlc] = useState(false);
  const [isDeactivatingLrtjPay, setIsDeactivatingLrtjPay] = useState(false);
  const [relatedRecords, setRelatedRecords] = useState<RelatedRecord[] | null>(null);
  const [showForceDeleteDialog, setShowForceDeleteDialog] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

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

  const handleDelete = async (force: boolean = false) => {
    if (!deleteItem) return;
    setIsDeleting(true);
    try {
      const url = force ? `/api/users/${deleteItem.id}?force=true` : `/api/users/${deleteItem.id}`;
      const res = await fetch(url, {
        method: "DELETE",
      });
      if (res.ok) {
        const result = await res.json();
        
        // Check if user has related records
        if (result.hasRelatedRecords) {
          setRelatedRecords(result.relatedData);
          setShowForceDeleteDialog(true);
          setIsDeleting(false);
          return;
        }
        
        toast.success(result.message || "User permanently deleted successfully");
        setDeleteItem(null);
        setRelatedRecords(null);
        setExpandedRows(new Set());
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

  const handleForceDelete = async () => {
    setShowForceDeleteDialog(false);
    setRelatedRecords(null);
    await handleDelete(true);
  };

  const toggleRowExpansion = (index: number) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const getPreviewFields = (record: RelatedRecord) => {
    switch (record.originalTable) {
      case 'merchandise redemption':
        return (
          <div className="space-y-2">
            {record.preview.map((item: any) => (
              <div key={item.id} className="text-xs text-gray-600 border-b border-gray-100 pb-2 last:border-0">
                <div className="font-medium text-gray-700">Item #{item.merchandise_id}</div>
                <div className="flex justify-between">
                  <span>{item.receiver_name || 'No name'}</span>
                  <span className="text-gray-500">{item.status}</span>
                </div>
                <div className="text-gray-400">{formatWIBDate(item.created_at)}</div>
              </div>
            ))}
            {record.count > 3 && (
              <div className="text-xs text-gray-500 italic">+{record.count - 3} more records</div>
            )}
          </div>
        );
        
      case 'benefit redemption':
        return (
          <div className="space-y-2">
            {record.preview.map((item: any) => (
              <div key={item.id} className="text-xs text-gray-600 border-b border-gray-100 pb-2 last:border-0">
                <div className="font-medium text-gray-700">Merchant #{item.merchant_id}</div>
                <div className="flex justify-between">
                  <span>{item.name || 'No name'}</span>
                  <span className="text-gray-500">{item.status}</span>
                </div>
                <div className="text-gray-400">{formatWIBDate(item.created_at)}</div>
              </div>
            ))}
            {record.count > 3 && (
              <div className="text-xs text-gray-500 italic">+{record.count - 3} more records</div>
            )}
          </div>
        );
        
      case 'SLC earning record':
        return (
          <div className="space-y-2">
            {record.preview.map((item: any) => (
              <div key={item.id} className="text-xs text-gray-600 border-b border-gray-100 pb-2 last:border-0">
                <div className="font-medium text-gray-700">{item.category} {item.type ? `(${item.type})` : ''}</div>
                <div className="flex justify-between">
                  <span className="text-gray-500">{item.info || 'No info'}</span>
                  <span className="font-medium text-green-600">+{item.earning_point} pts</span>
                </div>
                <div className="text-gray-400">{formatWIBDate(item.created_at)}</div>
              </div>
            ))}
            {record.count > 3 && (
              <div className="text-xs text-gray-500 italic">+{record.count - 3} more records</div>
            )}
          </div>
        );
        
      case 'LRTJ earning record':
        return (
          <div className="space-y-2">
            {record.preview.map((item: any) => (
              <div key={item.id} className="text-xs text-gray-600 border-b border-gray-100 pb-2 last:border-0">
                <div className="font-medium text-gray-700">{item.category}</div>
                <div className="flex justify-between">
                  <span className="text-gray-500">{item.info || 'No info'}</span>
                  <span className="font-medium text-green-600">+{item.earning_point} pts</span>
                </div>
                <div className="text-gray-400">{formatWIBDate(item.created_at)}</div>
              </div>
            ))}
            {record.count > 3 && (
              <div className="text-xs text-gray-500 italic">+{record.count - 3} more records</div>
            )}
          </div>
        );
        
      case 'trip history record':
        return (
          <div className="space-y-2">
            {record.preview.map((item: any) => (
              <div key={item.id} className="text-xs text-gray-600 border-b border-gray-100 pb-2 last:border-0">
                <div className="font-medium text-gray-700">Trip #{item.id}</div>
                <div className="flex justify-between">
                  <span>{item.station_in || 'Unknown'} → {item.station_out || 'Unknown'}</span>
                </div>
                <div className="text-gray-400">{formatWIBDate(item.station_in_at || item.created_at)}</div>
              </div>
            ))}
            {record.count > 3 && (
              <div className="text-xs text-gray-500 italic">+{record.count - 3} more records</div>
            )}
          </div>
        );
        
      default:
        return <div className="text-xs text-gray-500">No preview available</div>;
    }
  };

  const handleDeactivateSlc = async () => {
    if (!item) return;
    setIsDeactivatingSlc(true);
    try {
      const res = await fetch(`/api/users/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          activation_slc: 0,
          activation_slc_at: null,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setItem({ ...item, activation_slc: data.activation_slc, activation_slc_at: data.activation_slc_at });
        toast.success("LarataClub deactivated successfully");
        setDeactivateSlcConfirm(false);
      } else {
        const errorData = await res.json();
        toast.error(errorData.error || "Failed to deactivate LarataClub");
      }
    } catch (err) {
      console.error("Failed to deactivate LarataClub", err);
      toast.error("Failed to deactivate LarataClub");
    } finally {
      setIsDeactivatingSlc(false);
    }
  };

  const handleDeactivateLrtjPay = async () => {
    if (!item) return;
    setIsDeactivatingLrtjPay(true);
    try {
      const res = await fetch(`/api/users/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          activation_lrtjpay: 0,
          activation_lrtjpay_at: null,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setItem({ ...item, activation_lrtjpay: data.activation_lrtjpay, activation_lrtjpay_at: data.activation_lrtjpay_at });
        toast.success("LarataPay deactivated successfully");
        setDeactivateLrtjPayConfirm(false);
      } else {
        const errorData = await res.json();
        toast.error(errorData.error || "Failed to deactivate LarataPay");
      }
    } catch (err) {
      console.error("Failed to deactivate LarataPay", err);
      toast.error("Failed to deactivate LarataPay");
    } finally {
      setIsDeactivatingLrtjPay(false);
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
          LarataClub
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
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-gray-900">{item.name || "Unknown User"}</h2>
                <div className="flex items-center gap-3 pt-2">
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
                <label className="block text-xs font-medium text-gray-500 mb-1">Kartu Uang Elektronik 1</label>
                <div className="text-sm text-gray-900">{item.ecard || "-"}</div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Kartu Uang Elektronik 2</label>
                <div className="text-sm text-gray-900">{item.ecard2 || "-"}</div>
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
                <label className="block text-xs font-medium text-gray-500 mb-1">LarataClub Points</label>
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
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-500 mb-1">LarataClub</label>
                  <div className="flex items-center gap-2">
                    <div className="text-sm text-gray-900">{item.activation_slc === 1 ? "Activated" : "Not Activated"}</div>
                    {item.activation_slc === 1 && (
                      <Badge variant="default" className="bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 text-xs">
                        Active
                      </Badge>
                    )}
                  </div>
                </div>
                {item.activation_slc === 1 && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setDeactivateSlcConfirm(true)}
                    className="h-8 text-xs"
                  >
                    Deactivate
                  </Button>
                )}
              </div>
              {item.activation_slc_at && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">LarataClub Activation Date</label>
                  <div className="text-sm text-gray-900">{formatWIBDate(item.activation_slc_at)}</div>
                </div>
              )}
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-500 mb-1">LarataPay</label>
                  <div className="flex items-center gap-2">
                    <div className="text-sm text-gray-900">{item.activation_lrtjpay === 1 ? "Activated" : "Not Activated"}</div>
                    {item.activation_lrtjpay === 1 && (
                      <Badge variant="default" className="bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 text-xs">
                        Active
                      </Badge>
                    )}
                  </div>
                </div>
                {item.activation_lrtjpay === 1 && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setDeactivateLrtjPayConfirm(true)}
                    className="h-8 text-xs"
                  >
                    Deactivate
                  </Button>
                )}
              </div>
              {item.activation_lrtjpay_at && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">LarataPay Activation Date</label>
                  <div className="text-sm text-gray-900">{formatWIBDate(item.activation_lrtjpay_at)}</div>
                </div>
              )}
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
                <div className="text-sm text-gray-900">{item.verified_at ? formatWIBDate(item.verified_at) : "-"}</div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Created</label>
                <div className="text-sm text-gray-900">{item.created_at ? formatWIBDate(item.created_at) : "-"}</div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Updated At</label>
                <div className="text-sm text-gray-900">{item.updated_at ? formatWIBDate(item.updated_at) : "-"}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {deleteItem && !showForceDeleteDialog && (
        <DeleteConfirmDialog
          open={!!deleteItem}
          onOpenChange={() => {
            setDeleteItem(null);
            setRelatedRecords(null);
            setExpandedRows(new Set());
          }}
          title="Permanently Delete User"
          description={`Are you sure you want to permanently delete "${deleteItem.name}"? This action cannot be undone and the user will be completely removed from the database.`}
          onConfirm={() => handleDelete(false)}
          isDeleting={isDeleting}
        />
      )}

      {/* Force Delete Confirmation Dialog */}
      <AlertDialog open={showForceDeleteDialog} onOpenChange={setShowForceDeleteDialog}>
        <AlertDialogContent className="max-w-md bg-white/90 backdrop-blur-md border border-gray-200/80 shadow-sm rounded-lg p-0 overflow-hidden">
          <div className="px-6 pt-6 pb-4 border-b border-white/30">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-50 flex items-center justify-center border border-red-100">
                <AlertTriangle className="h-6 w-6 text-[#E5262C]" />
              </div>
              <div className="flex-1 pt-1">
                <AlertDialogHeader className="p-0">
                  <AlertDialogTitle className="text-xl font-semibold text-gray-900 mb-2">
                    User Has Related Records
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-sm text-gray-600 leading-relaxed">
                    This user has data in the following tables that will be permanently deleted:
                  </AlertDialogDescription>
                </AlertDialogHeader>
              </div>
            </div>
          </div>

          {/* Related Records List */}
          <div className="px-6 py-4 bg-gray-50 border-y border-gray-100">
            <ul className="space-y-2">
              {relatedRecords?.map((record, index) => (
                <li key={index}>
                  <Collapsible open={expandedRows.has(index)} onOpenChange={() => toggleRowExpansion(index)}>
                    <CollapsibleTrigger
                      render={
                        <div className="flex items-center justify-between text-sm cursor-pointer hover:bg-gray-100 rounded-md py-3 px-2 transition-colors" />
                      }
                      nativeButton={false}
                    >
                      <div className="flex items-center gap-2 flex-1">
                        {expandedRows.has(index) ? (
                          <ChevronDown className="h-4 w-4 text-gray-500" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-gray-500" />
                        )}
                        <span className="text-gray-700 font-medium">{record.table}</span>
                      </div>
                      <Badge variant="secondary" className="bg-red-50 text-red-700 border-red-200">
                        {record.count} record{record.count > 1 ? 's' : ''}
                      </Badge>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="pl-6 pr-2 py-2 mt-1 bg-white rounded-md border border-gray-200">
                        {getPreviewFields(record)}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </li>
              ))}
            </ul>
          </div>

          {/* Warning Section */}
          <div className="px-6 py-4 bg-red-50/50 border-y border-red-100">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-[#E5262C] flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800 font-medium">
                All related records will be permanently deleted. This action cannot be undone.
              </p>
            </div>
          </div>

          <AlertDialogFooter className="-mx-4 -mb-2 flex-col-reverse rounded-b-xl border-t bg-muted/50 p-4 group-data-[size=sm]/alert-dialog-content:grid group-data-[size=sm]/alert-dialog-content:grid-cols-2 sm:flex-row sm:justify-end px-6 py-6 flex gap-3">
            <AlertDialogCancel 
              disabled={isDeleting}
              onClick={() => {
                setShowForceDeleteDialog(false);
                setRelatedRecords(null);
                setDeleteItem(null);
                setExpandedRows(new Set());
              }}
              className="flex-1 h-11 bg-white/60 border-gray-200/50 hover:bg-white/80 text-gray-700"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleForceDelete}
              disabled={isDeleting}
              className="flex-1 h-11 bg-[#E5262C] hover:bg-[#c41f24] text-white font-medium shadow-sm"
            >
              {isDeleting ? "Deleting..." : "Force Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* LarataClub Deactivation Confirmation Dialog */}
      <AlertDialog open={deactivateSlcConfirm} onOpenChange={setDeactivateSlcConfirm}>
        <AlertDialogContent className="max-w-md bg-white/90 backdrop-blur-md border border-gray-200/80 shadow-sm rounded-lg p-0 overflow-hidden">
          <div className="px-6 pt-6 pb-4 border-b border-white/30">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center border border-amber-100">
                <AlertTriangle className="h-6 w-6 text-amber-600" />
              </div>
              <div className="flex-1 pt-1">
                <AlertDialogHeader className="p-0">
                  <AlertDialogTitle className="text-xl font-semibold text-gray-900 mb-2">
                    Deactivate LarataClub
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-sm text-gray-600 leading-relaxed">
                    This will deactivate LarataClub for this user. This cannot be undone from here - reactivation must be done via the mobile app.
                  </AlertDialogDescription>
                </AlertDialogHeader>
              </div>
            </div>
          </div>
          <div className="px-6 py-4 bg-amber-50/50 border-y border-amber-100">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800 font-medium">
                The user will lose access to LarataClub features immediately.
              </p>
            </div>
          </div>
          <AlertDialogFooter className="-mx-4 -mb-2 flex-col-reverse rounded-b-xl border-t bg-muted/50 p-4 group-data-[size=sm]/alert-dialog-content:grid group-data-[size=sm]/alert-dialog-content:grid-cols-2 sm:flex-row sm:justify-end px-6 py-6 flex gap-3">
            <AlertDialogCancel disabled={isDeactivatingSlc} className="flex-1 h-11 bg-white/60 border-gray-200/50 hover:bg-white/80 text-gray-700">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeactivateSlc}
              disabled={isDeactivatingSlc}
              className="flex-1 h-11 bg-[#E5262C] hover:bg-[#c41f24] text-white font-medium shadow-sm"
            >
              {isDeactivatingSlc ? "Deactivating..." : "Deactivate"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* LarataPay Deactivation Confirmation Dialog */}
      <AlertDialog open={deactivateLrtjPayConfirm} onOpenChange={setDeactivateLrtjPayConfirm}>
        <AlertDialogContent className="max-w-md bg-white/90 backdrop-blur-md border border-gray-200/80 shadow-sm rounded-lg p-0 overflow-hidden">
          <div className="px-6 pt-6 pb-4 border-b border-white/30">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center border border-amber-100">
                <AlertTriangle className="h-6 w-6 text-amber-600" />
              </div>
              <div className="flex-1 pt-1">
                <AlertDialogHeader className="p-0">
                  <AlertDialogTitle className="text-xl font-semibold text-gray-900 mb-2">
                    Deactivate LarataPay
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-sm text-gray-600 leading-relaxed">
                    This will deactivate LarataPay for this user. This cannot be undone from here - reactivation must be done via the mobile app.
                  </AlertDialogDescription>
                </AlertDialogHeader>
              </div>
            </div>
          </div>
          <div className="px-6 py-4 bg-amber-50/50 border-y border-amber-100">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800 font-medium">
                The user will lose access to LarataPay features immediately.
              </p>
            </div>
          </div>
          <AlertDialogFooter className="-mx-4 -mb-2 flex-col-reverse rounded-b-xl border-t bg-muted/50 p-4 group-data-[size=sm]/alert-dialog-content:grid group-data-[size=sm]/alert-dialog-content:grid-cols-2 sm:flex-row sm:justify-end px-6 py-6 flex gap-3">
            <AlertDialogCancel disabled={isDeactivatingLrtjPay} className="flex-1 h-11 bg-white/60 border-gray-200/50 hover:bg-white/80 text-gray-700">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeactivateLrtjPay}
              disabled={isDeactivatingLrtjPay}
              className="flex-1 h-11 bg-[#E5262C] hover:bg-[#c41f24] text-white font-medium shadow-sm"
            >
              {isDeactivatingLrtjPay ? "Deactivating..." : "Deactivate"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}