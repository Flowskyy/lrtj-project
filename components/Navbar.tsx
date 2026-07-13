import Link from "next/link"
import Image from "next/image"

export default function Navbar() {
  return (
    <nav className="sticky top-0 left-0 right-0 z-50 bg-gradient-to-r from-[#333333] to-[#E5262C]">
      <div className="w-full max-w-[1920px] mx-auto py-3 flex items-center justify-between px-0">
        {/* Logo */}
        <div className="flex items-center pl-6">
          <Image
            src="/lrt-logo.png"
            alt="LRT Jakarta"
            width={150}
            height={50}
            className="h-12 w-auto"
          />
        </div>

        {/* Search Bar */}
        <div className="flex-1 max-w-xl mx-8">
          <div className="relative">
            <input
              type="text"
              placeholder="Search..."
              className="w-full px-4 py-2 rounded-full bg-white/20 text-white placeholder-white/70 border border-white/30 focus:outline-none focus:border-white/50"
            />
          </div>
        </div>

        {/* Login Button */}
        <div className="pr-6">
          <Link href="/login">
            <button className="bg-white text-[#E5262C] px-6 py-2 rounded-full font-semibold hover:bg-gray-100 transition-colors">
              LOGIN HERE
            </button>
          </Link>
        </div>
      </div>
    </nav>
  )
}
