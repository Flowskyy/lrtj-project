import Header from "@/components/Header"
import Sidebar from "@/components/Sidebar"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gray-50">
      {/* Top header */}
      <Header buttonType="logout" />

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <div className="w-full p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
