"use client"

import { useState } from "react"
import { signIn } from "@/lib/auth-client"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Spinner } from "@/components/ui/spinner"
import { Eye, EyeOff, AlertCircle } from "lucide-react"

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const handleMicrosoftSignIn = async () => {
    setLoading(true)
    setError("")

    try {
      await signIn.social({
        provider: "microsoft",
        callbackURL: "/dashboard",
      })
    } catch (err) {
      setError("An error occurred during sign in")
      setLoading(false)
    }
  }

  const handleEmailPasswordSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      await signIn.email({
        email,
        password,
        callbackURL: "/dashboard",
      })
    } catch (err) {
      setError("Invalid email or password")
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
        <Card className="w-full max-w-md bg-white shadow-2xl rounded-xl">
          <CardHeader className="flex flex-col items-center pt-8 pb-4">
            <Image
              src="/logo-lrtj.png"
              alt="LRT Jakarta"
              width={200}
              height={65}
              className="h-16 w-auto object-contain mb-2"
            />
            <h1 className="text-xl font-semibold text-gray-900">Admin Portal</h1>
            <p className="text-sm text-gray-500">Sign in to access your dashboard</p>
          </CardHeader>

          <CardContent className="px-8 pb-8">
            {/* Error Alert */}
            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Login Method Tabs */}
            <Tabs defaultValue="microsoft" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="microsoft">Microsoft</TabsTrigger>
                <TabsTrigger value="email">Email</TabsTrigger>
              </TabsList>

              {/* Microsoft Sign In */}
              <TabsContent value="microsoft" className="mt-0">
                <Button
                  onClick={handleMicrosoftSignIn}
                  disabled={loading}
                  className="w-full bg-[#E5262C] hover:bg-[#c91e24] text-white font-medium h-11 transition-colors disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <Spinner className="mr-2" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 mr-2" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M10.5 0H0V10.5H10.5V0Z" fill="#F25022"/>
                        <path d="M21 0H10.5V10.5H21V0Z" fill="#7FBA00"/>
                        <path d="M10.5 10.5H0V21H10.5V10.5Z" fill="#00A4EF"/>
                        <path d="M21 10.5H10.5V21H21V10.5Z" fill="#FFB900"/>
                      </svg>
                      Sign in with Microsoft
                    </>
                  )}
                </Button>
              </TabsContent>

              {/* Email/Password Sign In */}
              <TabsContent value="email" className="mt-0">
                <form onSubmit={handleEmailPasswordSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your.email@lrtjakarta.co.id"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={loading}
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={loading}
                        className="h-11 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={loading}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
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
                    disabled={loading}
                    className="w-full bg-[#E5262C] hover:bg-[#c91e24] text-white font-medium h-11 transition-colors disabled:opacity-60"
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
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Notes below card */}
        <div className="mt-6 text-center max-w-md">
          <p className="text-white/70 text-sm leading-relaxed">
            Need help? Contact IT Support for assistance with login issues.
          </p>
        </div>

      </div>
    </div>
  )
}
