import Header from "@/components/Header"
import Sidebar from "@/components/Sidebar"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Top header — fixed height */}
      <Header buttonType="logout" />

      {/* Body — takes remaining height, no overflow on parent */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-6 bg-[#F5F3F0]/45">
          {children}
        </main>
      </div>
    </div>
  )
}
