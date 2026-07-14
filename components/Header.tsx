"use client"

import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { useEffect, useState } from "react"

interface HeaderProps {
  buttonType: "home" | "logout"
}

export default function Header({ buttonType }: HeaderProps) {
  const pathname = usePathname()
  const [isVisible, setIsVisible] = useState(false)

  const handleLogout = () => {
    signOut({ callbackUrl: "/login" })
  }

  const pageMeta = pathname.includes("merchandise")
    ? {
        title: "Merchandise",
        description: "Manage your merchandise items",
      }
    : {
        title: "Dashboard",
        description: "Overview of your portal",
      }

  useEffect(() => {
    setIsVisible(false)
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, 50)
    return () => clearTimeout(timer)
  }, [pathname])

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-100 shadow-sm">
      <div className="w-full">
        <div className="flex min-h-16 items-center justify-between gap-4 px-6 lg:px-8">
          <div className="min-w-0">
            <h1 className={`text-xl font-bold text-gray-900 tracking-tight truncate transition-opacity duration-300 ease-in-out ${isVisible ? "opacity-100" : "opacity-0"}`}>
              {pageMeta.title}
            </h1>
            <p className={`hidden text-sm text-gray-500 md:block transition-opacity duration-300 ease-in-out ${isVisible ? "opacity-100" : "opacity-0"}`}>
              {pageMeta.description}
            </p>
          </div>
          {buttonType === "logout" && (
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition-all hover:-translate-y-0.5 hover:border-gray-300 hover:text-gray-900 hover:shadow-md"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6A2.25 2.25 0 005.25 5.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m-6-3h11.25m0 0L18 8.25M21 12l-3 3.75" />
              </svg>
              Logout
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
