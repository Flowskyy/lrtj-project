"use client"



import Link from "next/link"

import { usePathname } from "next/navigation"

import Image from "next/image"

import React from "react"

import { ShoppingBag, Bell, ChevronLeft, User, Lock, Mail, Package, Gift, Users, Home, Calendar, Gift as GiftIcon, Newspaper } from "lucide-react"

import { signOut, useSession } from "next-auth/react"

import { Button } from "@/components/ui/button"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"

import { Badge } from "@/components/ui/badge"

import { Separator } from "@/components/ui/separator"

import {

  DropdownMenu,

  DropdownMenuContent,

  DropdownMenuItem,

  DropdownMenuSeparator,

  DropdownMenuTrigger,

} from "@/components/ui/dropdown-menu"

import {

  Sidebar,

  SidebarContent,

  SidebarFooter,

  SidebarHeader,

  SidebarInset,

  SidebarMenu,

  SidebarMenuButton,

  SidebarMenuItem,

  SidebarProvider,

  SidebarSeparator,

  SidebarTrigger,

  useSidebar,

} from "@/components/ui/sidebar"

import {

  Breadcrumb,

  BreadcrumbItem,

  BreadcrumbLink,

  BreadcrumbList,

  BreadcrumbPage,

  BreadcrumbSeparator,

} from "@/components/ui/breadcrumb"

import { SidebarNavGroup } from "@/components/SidebarNavGroup"

// Shared icon props for ALL top-level sidebar navigation icons
// IMPORTANT: Any new top-level sidebar icon MUST use these exact props to ensure visual consistency
const SIDEBAR_ICON_PROPS = {
  className: "h-5 w-5",
  strokeWidth: 2,
} as const

const NAV_ITEMS = [

  {

    label: "Dashboard",

    icon: <Home {...SIDEBAR_ICON_PROPS} />,

    href: "/dashboard",

  },

  {

    label: "Users",

    icon: <Users {...SIDEBAR_ICON_PROPS} />,

    href: "/users",

  },

  {

    label: "News",

    icon: <Newspaper {...SIDEBAR_ICON_PROPS} />,

    href: "/news",

  },

  {

    label: "Merchandise",

    icon: <ShoppingBag {...SIDEBAR_ICON_PROPS} />,

    subItems: [

      { href: "/merchandise", label: "Merchandise", icon: <Package className="h-4 w-4" strokeWidth={2} /> },

      { href: "/redeem-merchandise", label: "Redeem Merchandise", icon: <Gift className="h-4 w-4" strokeWidth={2} /> },

    ],

  },

  {

    label: "Daily Benefit",

    icon: <Calendar {...SIDEBAR_ICON_PROPS} />,

    subItems: [

      { href: "/daily-benefit", label: "Daily Benefit", icon: <Calendar className="h-4 w-4" strokeWidth={2} /> },

      { href: "/redeem-benefit", label: "Redeem Benefit", icon: <GiftIcon className="h-4 w-4" strokeWidth={2} /> },

    ],

  },

]



function SidebarContentWrapper({ children }: { children: React.ReactNode }) {
  const { state } = useSidebar()
  const pathname = usePathname()
  const { data: session } = useSession()

  const handleLogout = () => {
    signOut({ callbackUrl: "/login" })
  }

  const getUserInitials = () => {
    if (!session?.user?.email) return "U"
    const email = session.user.email
    const name = email.split("@")[0]
    return name.charAt(0).toUpperCase()
  }

  const pageMeta = pathname === "/merchandise"
    ? {
        title: "Merchandise",
        breadcrumb: ["Merchandise"],
      }
    : pathname === "/merchandise/add"
    ? {
        title: "Add Merchandise",
        breadcrumb: ["Merchandise", "Add Merchandise"],
      }
    : pathname.startsWith("/merchandise/edit/")
    ? {
        title: "Edit Merchandise",
        breadcrumb: ["Merchandise", "Edit Merchandise"],
      }
    : pathname === "/redeem-merchandise"
    ? {
        title: "Redeem Merchandise",
        breadcrumb: ["Merchandise", "Redeem Merchandise"],
      }
    : pathname === "/daily-benefit"
    ? {
        title: "Daily Benefit",
        breadcrumb: ["Daily Benefit", "Daily Benefit"],
      }
    : pathname === "/daily-benefit/add"
    ? {
        title: "Add Daily Benefit",
        breadcrumb: ["Daily Benefit", "Add Daily Benefit"],
      }
    : pathname.startsWith("/daily-benefit/edit/")
    ? {
        title: "Edit Daily Benefit",
        breadcrumb: ["Daily Benefit", "Edit Daily Benefit"],
      }
    : pathname === "/redeem-benefit"
    ? {
        title: "Redeem Benefit",
        breadcrumb: ["Daily Benefit", "Redeem Benefit"],
      }
    : pathname === "/users"
    ? {
        title: "Users",
        breadcrumb: ["Users"],
      }
    : pathname === "/news"
    ? {
        title: "News",
        breadcrumb: ["News"],
      }
    : pathname === "/news/add"
    ? {
        title: "Add News",
        breadcrumb: ["News", "Add News"],
      }
    : pathname.startsWith("/news/edit/")
    ? {
        title: "Edit News",
        breadcrumb: ["News", "Edit News"],
      }
    : {
        title: "Dashboard",
        breadcrumb: ["Dashboard"],
      }

  return (
    <>
      <Sidebar collapsible="icon" className="border-r border-gray-100 group-data-[state=expanded]:min-w-64">

        <SidebarHeader className="pt-4 pb-2 flex items-center justify-center overflow-hidden">

          <div className="flex items-center justify-center w-full h-auto">

            {state === "collapsed" && (
              <Image

                src="/favicon.ico"

                alt="LRT Jakarta"

                width={40}

                height={40}

                className="object-contain"

                priority

              />
            )}

            {state === "expanded" && (
              <Image

                src="/logo-lrtj.png"

                alt="LRT Jakarta"

                width={140}

                height={70}

                className="object-contain max-w-full"

                priority

              />
            )}

          </div>

        </SidebarHeader>

        <SidebarContent className="px-2 group-data-[state=collapsed]:px-0">

          <div className="px-3 pt-1 pb-2">
  <div data-orientation="horizontal" role="separator" aria-orientation="horizontal" data-slot="sidebar-separator" data-sidebar="separator" className="shrink-0 data-horizontal:h-px data-horizontal:w-full data-vertical:w-px data-vertical:self-stretch bg-sidebar-border"></div>
</div>

          <SidebarMenu>

            {NAV_ITEMS.map((item, index) => (

              <React.Fragment key={index}>

                <SidebarNavGroup

                  label={item.label}

                  icon={item.icon}

                  href={item.href}

                  subItems={item.subItems}

                />

                {item.label === "News" && (
                  <div className="px-3 pt-1 pb-2">
  <div data-orientation="horizontal" role="separator" aria-orientation="horizontal" data-slot="sidebar-separator" data-sidebar="separator" className="shrink-0 data-horizontal:h-px data-horizontal:w-full data-vertical:w-px data-vertical:self-stretch bg-sidebar-border"></div>
</div>
                )}

              </React.Fragment>

            ))}

          </SidebarMenu>

        </SidebarContent>

        <SidebarFooter className="border-t border-gray-100 group-data-[state=collapsed]:hidden">

          <div className="flex items-center gap-3 px-3 py-2">

            <Avatar className="h-8 w-8 border border-gray-100">

              <AvatarFallback className="bg-[#E5262C]/10 text-[#E5262C] font-semibold text-sm">

                {getUserInitials()}

              </AvatarFallback>

            </Avatar>

            <div className="flex flex-col">

              <span className="text-sm font-medium text-gray-900">

                {session?.user?.email?.split('@')[0] || 'User'}

              </span>

              <span className="text-xs text-gray-500">

                {session?.user?.email || ''}

              </span>

            </div>

          </div>

        </SidebarFooter>

      </Sidebar>

      <SidebarInset>

        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 bg-white px-4 shadow-[0_0.5px_0_rgba(0,0,0,0.1)]">

          <SidebarTrigger className="h-9 w-9 border-0" />

          <Separator orientation="vertical" className="mr-2 h-full self-auto" />

          <div className="flex items-center justify-center flex-1 md:hidden">
            <Image
              src="/logo-lrtj.png"
              alt="LRT Jakarta"
              width={100}
              height={50}
              className="object-contain h-8 w-auto"
              priority
            />
          </div>

          <Breadcrumb className="hidden sm:flex">

            <BreadcrumbList>

              {pageMeta.breadcrumb.map((item, index) => (

                <React.Fragment key={`${item}-${index}`}>

                  <BreadcrumbItem key={item}>

                    {index === pageMeta.breadcrumb.length - 1 ? (

                      <BreadcrumbPage className="text-[#E5262C] font-semibold">{item}</BreadcrumbPage>

                    ) : (

                      <BreadcrumbLink

                        href={

                          item === "Dashboard"

                            ? "/dashboard"

                            : item === "Merchandise"

                            ? "/merchandise"

                            : item === "Add Merchandise"

                            ? "/merchandise/add"

                            : item === "Edit Merchandise"

                            ? "/merchandise"

                            : item === "Users"

                            ? "/users"

                            : item === "News"

                            ? "/news"

                            : item === "Add News"

                            ? "/news/add"

                            : item === "Edit News"

                            ? "/news"

                            : item === "Daily Benefit"

                            ? "/daily-benefit"

                            : item === "Add Daily Benefit"

                            ? "/daily-benefit/add"

                            : item === "Edit Daily Benefit"

                            ? "/daily-benefit"

                            : item === "Redeem Merchandise"

                            ? "/redeem-merchandise"

                            : item === "Redeem Benefit"

                            ? "/redeem-benefit"

                            : "/redeem-merchandise"

                        }

                        className="text-gray-600 hover:text-[#E5262C]"

                      >

                        {item}

                      </BreadcrumbLink>

                    )}

                  </BreadcrumbItem>

                  {index < pageMeta.breadcrumb.length - 1 && <BreadcrumbSeparator />}

                </React.Fragment>

              ))}

            </BreadcrumbList>

          </Breadcrumb>

          <div className="ml-auto flex items-center gap-3">

            <Button variant="ghost" size="icon" className="relative h-9 w-9">

              <Bell className="h-4 w-4 text-gray-600" />

              <Badge className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center bg-[#E5262C] text-white text-[9px] p-0 rounded-full">

                0

              </Badge>

            </Button>

            <DropdownMenu>

              <DropdownMenuTrigger className="h-8 w-8 p-0 rounded-full hover:bg-muted">

                <Avatar className="h-8 w-8 border border-gray-100">

                  <AvatarFallback className="bg-[#E5262C]/10 text-[#E5262C] font-semibold text-sm">

                    {getUserInitials()}

                  </AvatarFallback>

                </Avatar>

              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-48">

                <DropdownMenuItem disabled className="text-gray-400 cursor-not-allowed">

                  <User className="h-4 w-4 mr-2" />

                  Change Username

                </DropdownMenuItem>

                <DropdownMenuItem disabled className="text-gray-400 cursor-not-allowed">

                  <Lock className="h-4 w-4 mr-2" />

                  Change Password

                </DropdownMenuItem>

                <DropdownMenuItem disabled className="text-gray-400 cursor-not-allowed">

                  <Mail className="h-4 w-4 mr-2" />

                  Change Email

                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem onClick={handleLogout} className="text-red-600 hover:text-red-700 hover:bg-red-50">

                  <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">

                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6A2.25 2.25 0 005.25 5.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m-6-3h11.25m0 0L18 8.25M21 12l-3 3.75" />

                  </svg>

                  Logout

                </DropdownMenuItem>

              </DropdownMenuContent>

            </DropdownMenu>

          </div>

        </header>

        <main className="flex-1 overflow-y-auto bg-gray-50/50 min-w-0">

          <div className="container mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">

            {children}

          </div>

        </main>

      </SidebarInset>
    </>
  )
}

export default function DashboardLayout({

  children,

}: {

  children: React.ReactNode

}) {

  return (
    <SidebarProvider defaultOpen={true}>
      <SidebarContentWrapper>{children}</SidebarContentWrapper>
    </SidebarProvider>
  )

}

