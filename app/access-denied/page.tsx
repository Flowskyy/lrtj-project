"use client"

import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function AccessDeniedPage() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center relative"
      style={{
        backgroundImage: "url('/lrt-station.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/60" />

      {/* Content wrapper */}
      <div className="relative z-10 flex flex-col items-center w-full px-4">

        {/* Card */}
        <div className="w-full max-w-[400px] bg-white shadow-2xl rounded-sm px-8 py-10 text-center">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <Image
              src="/logo-lrtj.png"
              alt="LRT Jakarta"
              width={200}
              height={65}
              className="h-14 w-auto object-contain"
              priority
            />
          </div>

          {/* Error Icon */}
          <div className="mb-4 flex justify-center">
            <Image
              src="/laratawait.png"
              alt="Access Denied"
              width={64}
              height={64}
              className="w-16 h-16 object-contain"
              priority
            />
          </div>

          {/* Heading */}
          <h1 className="text-xl font-bold text-gray-900 mb-2">
            Access Denied
          </h1>

          {/* Message */}
          <p className="text-sm text-gray-600 mb-6 leading-relaxed">
            You do not have permission to access the LRT Jakarta Admin Portal.
            Please contact your administrator to request access.
          </p>

          {/* Back to Login Button */}
          <Link href="/login">
            <Button className="w-full bg-[#E5262C] hover:bg-[#c91e24] text-white text-sm font-semibold py-2.5 rounded-sm tracking-wide transition-colors">
              Back to Login
            </Button>
          </Link>
        </div>

        {/* Additional Info */}
        <div className="mt-6 text-center max-w-[350px]">
          <p className="text-white/70 text-xs leading-relaxed">
            If you believe this is an error, please contact IT Support with your account details.
          </p>
        </div>

      </div>
    </div>
  )
}
