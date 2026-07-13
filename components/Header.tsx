"use client"

import Link from "next/link"
import Image from "next/image"
import { signOut } from "next-auth/react"

interface HeaderProps {
  buttonType: "home" | "logout"
}

export default function Header({ buttonType }: HeaderProps) {
  const handleLogout = () => {
    signOut({ callbackUrl: "/login" })
  }

  return (
    <header className="w-full bg-gradient-to-r from-[#222222] via-[#2A2A2A] to-[#E5262C] shadow-lg">
      <div className="w-full max-w-[1920px] mx-auto h-16 flex items-center justify-between px-6">

        {/* Logo and Text */}
        <div className="flex items-center gap-3">
          <Image
            src="/lrt-logo.png"
            alt="LRT Jakarta"
            width={120}
            height={40}
            className="h-10 w-auto object-contain brightness-110"
          />
        </div>

        {/* Search Bar - only show on home page */}
        {buttonType === "home" && (
          <div className="flex-1 flex justify-center max-w-md mx-4">
            <div className="relative w-full max-w-xs flex items-center">
              <input
                type="text"
                placeholder="Search here"
                className="w-full bg-white text-gray-800 placeholder-gray-400 text-xs px-4 py-1.5 rounded-full pr-10 focus:outline-none focus:ring-1 focus:ring-red-400 shadow-inner"
              />
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2.5}
                stroke="currentColor"
                className="absolute right-3.5 w-3.5 h-3.5 text-gray-400 cursor-pointer hover:text-gray-600 transition-colors"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </div>
          </div>
        )}

        {/* Right Glassmorphism Button */}
        <div>
          {buttonType === "home" ? (
            <Link href="/login">
              <button className="bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider px-5 py-2 rounded-full shadow-[0_4px_12px_rgba(255,255,255,0.1)] transition-all duration-300 hover:shadow-[0_4px_16px_rgba(255,255,255,0.25)] hover:scale-105 active:scale-95 cursor-pointer">
                BACK TO HOME
              </button>
            </Link>
          ) : (
            <button
              onClick={handleLogout}
              className="bg-gradient-to-b from-[#D8242A] to-[#B3191E] hover:from-[#E5262C] hover:to-[#C91E24] border border-[#ffffff]/10 text-white text-[11px] font-bold uppercase tracking-wider px-8 py-2.5 rounded-full shadow-[0_4px_14px_rgba(0,0,0,0.25)] transition-all duration-300 hover:shadow-[0_6px_20px_rgba(0,0,0,0.35)] hover:scale-105 active:scale-95 cursor-pointer"
            >
              LOGOUT
            </button>
          )}
        </div>

      </div>
    </header>
  )
}
