"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import Link from "next/link"
import Image from "next/image"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

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

        {/* Logo */}
        <div className="mb-5">
          <Image
            src="/lrt-logo.png"
            alt="LRT Jakarta"
            width={200}
            height={65}
            className="h-14 w-auto object-contain"
          />
        </div>

        {/* Card */}
        <div className="w-full max-w-[320px] bg-white shadow-2xl rounded-sm px-7 py-8">
          <form onSubmit={handleSubmit}>

            {/* Email */}
            <div className="mb-4">
              <label htmlFor="email" className="block text-[11px] font-semibold text-gray-700 mb-1 tracking-wide">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="youremail@gmail.com"
                className="w-full border border-gray-300 rounded-sm px-3 py-2 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:border-[#E5262C]"
              />
            </div>

            {/* Password */}
            <div className="mb-5">
              <label htmlFor="password" className="block text-[11px] font-semibold text-gray-700 mb-1 tracking-wide">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="ilovelrtj123!"
                className="w-full border border-gray-300 rounded-sm px-3 py-2 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:border-[#E5262C]"
              />
            </div>

            {/* Error */}
            {error && (
              <p className="text-[11px] text-[#E5262C] mb-3 text-center">{error}</p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#E5262C] hover:bg-[#c91e24] text-white text-sm font-semibold py-2.5 rounded-sm tracking-wide transition-colors disabled:opacity-60 cursor-pointer"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>

            {/* Forgot password */}
            <div className="mt-4 text-center">
              <Link
                href="#"
                className="text-[12px] text-gray-500 hover:text-gray-800 underline"
              >
                Forgot password?
              </Link>
            </div>

          </form>
        </div>

        {/* Notes below card */}
        <div className="mt-4 text-center max-w-[300px]">
          <p className="text-white/60 text-[11px] leading-relaxed">
            Only registered accounts can access this admin portal.
            Contact IT Support if you experience login issues.
          </p>
        </div>

      </div>
    </div>
  )
}
