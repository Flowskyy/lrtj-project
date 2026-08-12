"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Clock } from "lucide-react"

export default function WaitingForApprovalContent() {
  const router = useRouter()
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [userName, setUserName] = useState<string | null>(null)
  const [checking, setChecking] = useState(true)
  const [error, setError] = useState(false)
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const eventSourceRef = useRef<EventSource | null>(null)

  const check = useCallback(async () => {
    try {
      const res = await fetch("/api/user/status")
      const data = await res.json()

      if (data.redirect) {
        sessionStorage.setItem('tab_authenticated', 'true')
        router.replace(data.redirect)
        return
      }

      setUserEmail(data.email || null)
      setUserName(data.name || null)
      setChecking(false)
      setError(false)
    } catch {
      setError(true)
      setChecking(false)
    }
  }, [router])

  useEffect(() => {
    let cancelled = false
    const guardedCheck = async () => {
      if (document.visibilityState !== "visible") return
      await check()
    }

    guardedCheck()

    pollingRef.current = setInterval(guardedCheck, 5000)

    eventSourceRef.current = new EventSource('/api/admin-users/updates')
    
    eventSourceRef.current.onmessage = (event) => {
      if (cancelled) return
      try {
        const data = JSON.parse(event.data)
        if (data.type === 'pending_users_updated') {
          guardedCheck()
        }
      } catch (error) {
        console.error('Failed to parse SSE data:', error)
      }
    }

    eventSourceRef.current.onerror = () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }
    }

    return () => {
      cancelled = true
      if (pollingRef.current) clearInterval(pollingRef.current)
      if (eventSourceRef.current) eventSourceRef.current.close()
    }
  }, [check])

  const handleLogout = async () => {
    if (pollingRef.current) clearInterval(pollingRef.current)
    if (eventSourceRef.current) eventSourceRef.current.close()
    sessionStorage.removeItem("tab_authenticated")
    try {
      await fetch("/api/auth/signout", { method: "POST" })
    } catch {}
    window.location.href = "/login"
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 relative"
      style={{
        backgroundImage: 'url("/lrt-station.jpg")',
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="absolute inset-0 bg-black/50" />

      <div className="w-full max-w-sm relative z-10">
        <Card className="border-0 shadow-xl bg-white/95 backdrop-blur-sm">
          <CardContent className="p-8">
            <div className="flex justify-center mb-6">
              <Image
                src="/logo-lrtj.png"
                alt="LRT Jakarta"
                width={200}
                height={65}
                className="h-16 w-auto object-contain"
              />
            </div>

            <div className="mb-4 flex justify-center">
              <div className="w-16 h-16 bg-yellow-50 rounded-full flex items-center justify-center border border-yellow-100">
                <Clock className="w-8 h-8 text-yellow-600" />
              </div>
            </div>

            {checking ? (
              <div className="flex flex-col items-center gap-3 py-4">
                <div className="h-5 w-48 animate-pulse rounded bg-gray-200/70" />
                <div className="h-4 w-36 animate-pulse rounded bg-gray-200/50" />
              </div>
            ) : error ? (
              <>
                <h1 className="text-xl font-bold text-gray-900 mb-2 text-center">Something went wrong</h1>
                <p className="text-sm text-gray-600 mb-6 text-center leading-relaxed">
                  We couldn&apos;t verify your account status. Please try again or sign in.
                </p>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={handleLogout}
                    className="w-full h-10 rounded-md text-sm font-medium text-gray-500 hover:text-red-600 hover:bg-red-50/80"
                  >
                    Sign Out
                  </button>
                </div>
              </>
            ) : (
              <>
                <h1 className="text-xl font-bold text-gray-900 mb-2 text-center">
                  Waiting for Approval
                </h1>
                <p className="text-sm text-gray-600 mb-2 text-center leading-relaxed">
                  Your Microsoft account has been successfully linked.
                </p>
                <p className="text-sm text-gray-600 mb-6 text-center leading-relaxed">
                  An administrator needs to approve your account and assign a role before you can access the CMS.
                </p>

                {userEmail && (
                  <div className="mb-6 bg-gray-50 border border-gray-200 rounded-md p-3 text-center">
                    <p className="text-xs text-gray-500 mb-1">Signed in as</p>
                    <p className="text-sm font-medium text-gray-900">{userName || userEmail}</p>
                  </div>
                )}

                <p className="text-xs text-gray-500 text-center mb-6 leading-relaxed">
                  This page automatically checks for approval. You will be redirected as soon as your role is assigned.
                </p>

                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => { check() }}
                    className="w-full h-10 rounded-md border border-gray-200/50 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Refresh Status
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full h-10 rounded-md text-sm text-gray-500 hover:text-red-600 hover:bg-red-50/80"
                  >
                    Sign Out
                  </button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
