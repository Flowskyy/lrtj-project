"use client"

import { useState } from "react"
import { signIn } from "@/lib/auth-client"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Spinner } from "@/components/ui/spinner"
import { Eye, EyeOff, AlertCircle } from "lucide-react"

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [microsoftLoading, setMicrosoftLoading] = useState(false)
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const handleEmailPasswordSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      // Set sessionStorage flag BEFORE initiating sign-in to ensure it's available
      // when the dashboard auth guard runs after redirect
      try { sessionStorage.setItem('tab_authenticated', 'true') } catch {}

      const result = await signIn.email({
        email,
        password,
        callbackURL: "/dashboard",
      })

      if (result.error) {
        setError(result.error.message || "Invalid email or password")
        setLoading(false)
        try { sessionStorage.removeItem('tab_authenticated') } catch {}
        return
      }
      
      // Success - redirect handled by callbackURL, but ensure it happens
      window.location.href = "/dashboard"
    } catch (err) {
      setError("Invalid email or password")
      setLoading(false)
      try { sessionStorage.removeItem('tab_authenticated') } catch {}
    }
  }

  const handleMicrosoftSignIn = async () => {
    setMicrosoftLoading(true)
    setError("")

    try {
      // Set sessionStorage flag BEFORE initiating sign-in to ensure it's available
      // when the dashboard auth guard runs after redirect
      try { sessionStorage.setItem('tab_authenticated', 'true') } catch {}
      
      await signIn.social({
        provider: "microsoft",
        callbackURL: "/dashboard",
      })
    } catch (err) {
      setError("Microsoft sign-in failed. Please try again.")
      setMicrosoftLoading(false)
      try { sessionStorage.removeItem('tab_authenticated') } catch {}
    }
  }

  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center px-4 relative"
      style={{
        backgroundImage: 'url("/lrt-station.jpg")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Dark overlay for better text contrast */}
      <div className="absolute inset-0 bg-black/50" />
      
      <div className="w-full max-w-sm relative z-10">
        {/* Login Form Card */}
        <Card className="border-0 shadow-xl bg-white/95 backdrop-blur-sm">
          <CardContent className="p-8">
            {/* Logo */}
            <div className="flex justify-center mb-6">
              <Image
                src="/logo-lrtj.png"
                alt="LRT Jakarta"
                width={200}
                height={65}
                className="h-16 w-auto object-contain"
              />
            </div>

            {/* Error Alert */}
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleEmailPasswordSignIn} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@lrtjakarta.co.id"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading || microsoftLoading}
                  className="h-10"
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading || microsoftLoading}
                    className="h-10 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading || microsoftLoading}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground disabled:opacity-50 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading || microsoftLoading}
                className="w-full h-10 bg-[#E5262C] hover:bg-[#c91e24] text-white font-medium transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Spinner className="mr-2" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>

            {/* Divider */}
            <div className="flex items-center my-6">
              <div className="flex-1 border-t border-gray-300" />
              <span className="px-4 text-sm text-gray-500">or</span>
              <div className="flex-1 border-t border-gray-300" />
            </div>

            {/* Microsoft Sign In Button */}
            <Button
              type="button"
              onClick={handleMicrosoftSignIn}
              disabled={microsoftLoading || loading}
              variant="outline"
              className="w-full h-10 gap-2 transition-colors disabled:opacity-50"
            >
              {microsoftLoading ? (
                <>
                  <Spinner className="mr-2" />
                  Connecting...
                </>
              ) : (
                <>
                  {/* Microsoft Logo SVG */}
                  <svg 
                    width="20" 
                    height="20" 
                    viewBox="0 0 23 23" 
                    fill="none" 
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <rect x="1" y="1" width="10" height="10" fill="#F25022"/>
                    <rect x="1" y="12" width="10" height="10" fill="#00A4EF"/>
                    <rect x="12" y="1" width="10" height="10" fill="#7FBA00"/>
                    <rect x="12" y="12" width="10" height="10" fill="#FFB900"/>
                  </svg>
                  Sign in with Microsoft
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
