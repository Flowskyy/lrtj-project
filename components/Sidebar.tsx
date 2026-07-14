"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import Image from "next/image"
import { useState } from "react"

const NAV_ITEMS = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    href: "/dashboard/merchandise",
    label: "Merchandise",
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
      </svg>
    ),
  },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(true)

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
        <aside
        className={`flex flex-col bg-white border-r border-gray-100 shadow-xl shadow-gray-200/40 transition-all duration-300 ease-in-out lg:shadow-none ${
          isCollapsed ? "w-20" : "w-64"
        } fixed inset-y-0 left-0 z-50 lg:static ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Logo */}
        <div className="border-b border-gray-100 py-6 px-4 flex flex-col items-center justify-center transition-all duration-300">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="w-full flex items-center justify-center hover:opacity-90 transition-opacity"
          >
            <div className="relative flex items-center justify-center">
              {/* Favicon (collapsed state) */}
              <Image
                src="/favicon.ico"
                alt="LRT Jakarta"
                width={48}
                height={48}
                className={`object-contain absolute transition-all duration-300 ${
                  isCollapsed 
                    ? "opacity-100 scale-100 z-10" 
                    : "opacity-0 scale-90 z-0"
                }`}
                priority
                style={{
                  filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.25)) drop-shadow(0 2px 3px rgba(0,0,0,0.15))"
                }}
              />
              {/* Full logo (expanded state) */}
              <Image
                src="/lrt-logo.png"
                alt="LRT Jakarta"
                width={192}
                height={108}
                className={`object-contain transition-all duration-300 ${
                  isCollapsed 
                    ? "opacity-0 scale-90 z-0" 
                    : "opacity-100 scale-100 z-10"
                }`}
                priority
                style={{
                  filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.25)) drop-shadow(0 2px 3px rgba(0,0,0,0.15))"
                }}
              />
            </div>
          </button>
          <button
            onClick={() => setIsMobileOpen(false)}
            className="mt-3 rounded-xl p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 lg:hidden"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Navigation */}
        <nav className={`flex-1 p-3 flex flex-col gap-4 transition-all duration-300 ${isCollapsed ? "items-center" : "items-stretch"}`}>
          {NAV_ITEMS.map((item) => {
            const isActive = item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href)

            const handleClick = () => {
              setIsMobileOpen(false)
            }

            return (
              <Link key={item.href} href={item.href} onClick={handleClick} className="block">
                <span
                  className={`flex items-center gap-3 rounded-2xl p-3 transition-all ${
                    isActive
                      ? "bg-[#E5262C]/10 text-[#E5262C] border border-[#E5262C]/10"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  } ${isCollapsed ? "justify-center" : ""}`}
                  title={item.label}
                >
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                      isActive ? "bg-[#E5262C] text-white" : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {item.icon}
                  </span>
                  <span
                    className={`font-medium text-sm transition-all duration-300 overflow-hidden whitespace-nowrap ${
                      isCollapsed 
                        ? "opacity-0 max-w-0" 
                        : "opacity-100 max-w-[200px]"
                    }`}
                  >
                    {item.label}
                  </span>
                </span>
              </Link>
            )
          })}
        </nav>
      </aside>

      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#E5262C] text-white shadow-xl shadow-[#E5262C]/30 transition-transform hover:scale-105 lg:hidden"
      >
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
    </>
  )
}