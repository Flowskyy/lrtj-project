"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, User, Mail, Phone, MapPin, Calendar, CreditCard, Award, Activity, Bell, Shield, Globe } from "lucide-react";
import { useRouter } from "next/navigation";
import { formatWIBDate } from "@/lib/formatWIBDate";

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

  const maskNIK = (nik: string | null) => {
    if (!nik) return "-";
    if (nik.length <= 4) return nik;
    return nik.substring(0, 4) + "*".repeat(nik.length - 4);
  };

  const getStatusBadge = () => {
    if (item?.status === 1) {
      return (
        <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Active</Badge>
      );
    }
    return (
      <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100">Inactive</Badge>
    );
  };

  if (loading) {
    return (
      <div className="min-h-0 flex flex-col">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">User Details</h1>
            <p className="text-sm text-gray-500 mt-0.5">View user information</p>
          </div>
        </div>
        <div className="space-y-4">
          <div className="h-32 bg-gray-50 rounded-lg animate-pulse" />
          <div className="h-48 bg-gray-50 rounded-lg animate-pulse" />
          <div className="h-32 bg-gray-50 rounded-lg animate-pulse" />
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-0 flex flex-col">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">User Details</h1>
          </div>
        </div>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-12 text-center">
            <p className="text-sm text-gray-500">User not found.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-0 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/users")}
            className="h-8 w-8 p-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">User Details</h1>
            <p className="text-sm text-gray-500 mt-0.5">View user information</p>
          </div>
        </div>
        {getStatusBadge()}
      </div>

      {/* Content */}
      <div className="space-y-4">
        {/* Quick Stats */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Award className="h-4 w-4 text-[#E5262C]" />
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">SLC Points</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{item.slc_point.toLocaleString()}</p>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="h-4 w-4 text-[#E5262C]" />
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Trips</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{item.trip_count.toLocaleString()}</p>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <CreditCard className="h-4 w-4 text-[#E5262C]" />
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">LRTJ Saldo</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{item.lrtj_saldo || "-"}</p>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-4 w-4 text-[#E5262C]" />
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Membership</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{item.membership_name || "-"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Basic Information */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gray-100 flex items-center justify-center">
                <User className="h-4 w-4 text-gray-600" />
              </div>
              <CardTitle className="text-base font-semibold text-gray-900">Basic Information</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Name</p>
                <p className="text-gray-900 font-medium">{item.name || "-"}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Email</p>
                <p className="text-gray-900 font-medium break-all">{item.email}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Phone</p>
                <p className="text-gray-900 font-medium">{item.no_telepon || "-"}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Gender</p>
                <p className="text-gray-900 font-medium">
                  {item.jenis_kelamin === "L" ? "Laki-laki" : item.jenis_kelamin === "P" ? "Perempuan" : item.jenis_kelamin || "-"}
                </p>
              </div>
              <div className="md:col-span-2">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Address</p>
                <p className="text-gray-900 font-medium break-all">{item.alamat || "-"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Identity Information */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gray-100 flex items-center justify-center">
                <Shield className="h-4 w-4 text-gray-600" />
              </div>
              <CardTitle className="text-base font-semibold text-gray-900">Identity Information</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">NIK</p>
                <p className="text-gray-900 font-medium break-all">{maskNIK(item.nik)}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Birthplace</p>
                <p className="text-gray-900 font-medium">{item.tempat_lahir || "-"}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Birthday</p>
                <p className="text-gray-900 font-medium">{formatWIBDate(item.birthday)}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Verified At</p>
                <p className="text-gray-900 font-medium">{formatWIBDate(item.verified_at)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Location Information */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gray-100 flex items-center justify-center">
                <Globe className="h-4 w-4 text-gray-600" />
              </div>
              <CardTitle className="text-base font-semibold text-gray-900">Location Information</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Province</p>
                <p className="text-gray-900 font-medium">{item.province_name || "-"}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Regency</p>
                <p className="text-gray-900 font-medium">{item.regency_name || "-"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card Information */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gray-100 flex items-center justify-center">
                <CreditCard className="h-4 w-4 text-gray-600" />
              </div>
              <CardTitle className="text-base font-semibold text-gray-900">Card Information</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">KUE 1</p>
                <p className="text-gray-900 font-medium break-all">{item.ecard || "-"}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">KUE 2</p>
                <p className="text-gray-900 font-medium break-all">{item.ecard2 || "-"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Activation Information */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gray-100 flex items-center justify-center">
                <Activity className="h-4 w-4 text-gray-600" />
              </div>
              <CardTitle className="text-base font-semibold text-gray-900">Activation Information</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">SLC Activation</p>
                <p className="text-gray-900 font-medium">{item.activation_slc === 1 ? "Active" : "Inactive"}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">SLC Activation Date</p>
                <p className="text-gray-900 font-medium">{formatWIBDate(item.activation_slc_at)}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">LRTJ Pay Activation</p>
                <p className="text-gray-900 font-medium">{item.activation_lrtjpay === 1 ? "Active" : "Inactive"}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">LRTJ Pay Activation Date</p>
                <p className="text-gray-900 font-medium">{formatWIBDate(item.activation_lrtjpay_at)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notification Preferences */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gray-100 flex items-center justify-center">
                <Bell className="h-4 w-4 text-gray-600" />
              </div>
              <CardTitle className="text-base font-semibold text-gray-900">Notification Preferences</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Push Notifications</p>
                <p className="text-gray-900 font-medium">{item.push_notification === 1 ? "Enabled" : "Disabled"}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Email Notifications</p>
                <p className="text-gray-900 font-medium">{item.email_notification === 1 ? "Enabled" : "Disabled"}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">New Content Notifications</p>
                <p className="text-gray-900 font-medium">{item.new_content_notification === 1 ? "Enabled" : "Disabled"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Timestamps */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gray-100 flex items-center justify-center">
                <Calendar className="h-4 w-4 text-gray-600" />
              </div>
              <CardTitle className="text-base font-semibold text-gray-900">Timestamps</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Created At</p>
                <p className="text-gray-900 font-medium">{formatWIBDate(item.created_at)}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Updated At</p>
                <p className="text-gray-900 font-medium">{formatWIBDate(item.updated_at)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
