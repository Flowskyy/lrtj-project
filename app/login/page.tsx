"use client"

import { useState, useEffect } from "react"
import { signIn } from "next-auth/react"
import Link from "next/link"
import Image from "next/image"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Small delay to ensure Toaster is mounted and ready
    const timer = setTimeout(() => {
      toast.info("Demo Credentials (for testing)", {
        description: (
          <div className="space-y-0.5">
            <p><span className="font-medium">Email:</span> adminlrtj@smk.belajar.id</p>
            <p><span className="font-medium">Password:</span> 123456</p>
          </div>
        ),
        duration: 6000,
      })
    }, 100)
    return () => clearTimeout(timer)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError("Invalid email or password")
      } else {
        window.location.href = "/dashboard"
      }
    } catch (err) {
      setError("An error occurred")
    } finally {
      setLoading(false)
    }
  }

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
        <Card className="w-full max-w-[360px] shadow-lg border border-gray-200">
          <CardContent className="p-8">
            {/* Logo */}
            <div className="flex justify-center mb-6">
              <Image
                src="/logo-lrtj.png"
                alt="LRT Jakarta"
                width={200}
                height={100}
                className="h-12 w-auto object-contain"
              />
            </div>
            <form onSubmit={handleSubmit}>

              {/* Email */}
              <div className="mb-4">
                <label htmlFor="email" className="block text-xs font-semibold text-gray-700 mb-1.5 tracking-wide uppercase">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="youremail@gmail.com"
                  className="min-h-[44px]"
                />
              </div>

              {/* Password */}
              <div className="mb-5">
                <label htmlFor="password" className="block text-xs font-semibold text-gray-700 mb-1.5 tracking-wide uppercase">
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="ilovelrtj123!"
                  className="min-h-[44px]"
                />
              </div>

              {/* Error */}
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertDescription className="text-xs">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              {/* Submit */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full min-h-[44px] bg-primary hover:bg-primary/90 text-white"
              >
                {loading ? "Signing in..." : "Sign In"}
              </Button>

              {/* Forgot password */}
              <div className="mt-4 text-center">
                <Link
                  href="#"
                  className="text-xs text-gray-500 hover:text-gray-800 underline"
                >
                  Forgot password?
                </Link>
              </div>

            </form>
          </CardContent>
        </Card>

        {/* Notes below card */}
        <div className="mt-5 text-center max-w-[320px]">
          <p className="text-white/70 text-xs leading-relaxed">
            Only registered accounts can access this admin portal.
            Contact IT Support if you experience login issues.
          </p>
        </div>

      </div>
    </div>
  )
}
