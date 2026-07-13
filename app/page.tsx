import Navbar from "@/components/Navbar"
import Carousel from "@/components/Carousel"

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <Carousel />
    </div>
  )
}
