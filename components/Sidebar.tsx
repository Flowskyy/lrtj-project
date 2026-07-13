"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

export default function Sidebar() {
  const pathname = usePathname()

  const isDashboardActive = pathname === "/dashboard"

  return (
    <aside className="w-64 bg-[#F5F3F0] border-r border-[#E5E9E8] flex flex-col p-4 space-y-3 min-h-[calc(100vh-64px)] shrink-0">
      
      {/* Navigation Links */}
      <nav className="flex flex-col gap-3">
        {/* Dashboard Button */}
        <Link href="/dashboard" className="w-full">
          <button
            className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold tracking-wider uppercase transition-all duration-300 cursor-pointer text-center text-white bg-[#BD8226] border border-[#BD8226]/40 hover:bg-[#a6711f] hover:scale-102 hover:shadow-[0_4px_12px_rgba(189,130,38,0.25)]
              ${isDashboardActive 
                ? "shadow-[0_4px_14px_rgba(189,130,38,0.4)] brightness-110" 
                : "opacity-90 hover:opacity-100"
              }
            `}
          >
            DASHBOARD
          </button>
        </Link>
      </nav>

    </aside>
  )
}
