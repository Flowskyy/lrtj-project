"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, User } from "lucide-react";
import { useRouter } from "next/navigation";

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
  const [item, setItem] = useState<MemberItem | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/users/${userId}`);
        if (res.ok) {
          const data = await res.json();
          setItem(data);
        }
      } catch (err) {
        console.error("Failed to fetch user", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [userId]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <Skeleton className="h-6 w-32" />
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-24" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!item) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-gray-500">User not found.</p>
        </CardContent>
      </Card>
    );
  }

  const maskNIK = (nik: string | null) => {
    if (!nik) return "-";
    if (nik.length <= 4) return nik;
    return nik.substring(0, 4) + "*".repeat(nik.length - 4);
  };

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        onClick={() => router.push("/users")}
        className="mb-2"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Users
      </Button>

      <Card className="shadow-sm">
        <CardHeader className="border-b border-gray-100">
          <CardTitle className="flex items-center gap-2 text-xl">
            <User className="h-5 w-5 text-[#E5262C]" />
            User Details
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-8">
          {/* Basic Info */}
          <div>
            <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <span className="w-1 h-4 bg-[#E5262C] rounded-full"></span>
              Basic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">ID</label>
                <p className="text-sm text-gray-900 font-medium">{item.id}</p>
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</label>
                <p className="text-sm text-gray-900 font-medium">{item.status === 1 ? "Active" : "Inactive"}</p>
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">Name</label>
                <p className="text-sm text-gray-900 font-medium">{item.name || "-"}</p>
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</label>
                <p className="text-sm text-gray-900 font-medium break-all">{item.email}</p>
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">Phone</label>
                <p className="text-sm text-gray-900 font-medium">{item.no_telepon || "-"}</p>
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">Gender</label>
                <p className="text-sm text-gray-900 font-medium">
                  {item.jenis_kelamin === "L" ? "Laki-laki" : item.jenis_kelamin === "P" ? "Perempuan" : item.jenis_kelamin || "-"}
                </p>
              </div>
              <div className="space-y-1 md:col-span-2">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">Address</label>
                <p className="text-sm text-gray-900 font-medium break-all">{item.alamat || "-"}</p>
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">NIK</label>
                <p className="text-sm text-gray-900 font-medium break-all">{maskNIK(item.nik)}</p>
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">Birthplace</label>
                <p className="text-sm text-gray-900 font-medium">{item.tempat_lahir || "-"}</p>
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">Birthday</label>
                <p className="text-sm text-gray-900 font-medium">{item.birthday ? item.birthday.split('T')[0] : "-"}</p>
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">Image</label>
                <p className="text-sm text-gray-900 font-medium break-all">{item.image || "-"}</p>
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">KUE 1</label>
                <p className="text-sm text-gray-900 font-medium break-all">{item.ecard || "-"}</p>
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">KUE 2</label>
                <p className="text-sm text-gray-900 font-medium break-all">{item.ecard2 || "-"}</p>
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">Province</label>
                <p className="text-sm text-gray-900 font-medium">{item.province_name || "-"}</p>
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">Regency</label>
                <p className="text-sm text-gray-900 font-medium">{item.regency_name || "-"}</p>
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">Member</label>
                <p className="text-sm text-gray-900 font-medium">{item.membership_name || "-"}</p>
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">Created At</label>
                <p className="text-sm text-gray-900 font-medium">{item.created_at ? item.created_at.split('T')[0] : "-"}</p>
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">Updated At</label>
                <p className="text-sm text-gray-900 font-medium">{item.updated_at ? item.updated_at.split('T')[0] : "-"}</p>
              </div>
            </div>
          </div>

          {/* LarataClub Stats */}
          <div className="border-t border-gray-100 pt-6">
            <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <span className="w-1 h-4 bg-[#E5262C] rounded-full"></span>
              LarataClub Stats
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-gradient-to-br from-gray-50 to-white border border-gray-100">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">SLC Point</p>
                      <p className="text-2xl font-bold text-gray-900">{item.slc_point.toLocaleString()}</p>
                    </div>
                    <div className="h-10 w-10 rounded-xl bg-[#E5262C]/10 flex items-center justify-center">
                      <span className="text-lg font-bold text-[#E5262C]">P</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-gray-50 to-white border border-gray-100">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Trip Count</p>
                      <p className="text-2xl font-bold text-gray-900">{item.trip_count.toLocaleString()}</p>
                    </div>
                    <div className="h-10 w-10 rounded-xl bg-[#E5262C]/10 flex items-center justify-center">
                      <span className="text-lg font-bold text-[#E5262C]">T</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}
