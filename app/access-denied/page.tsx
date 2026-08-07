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
            />
          </div>

          {/* Error Icon */}
          <div className="mb-4 flex justify-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-[#E5262C]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
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
