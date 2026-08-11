"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import Image from "next/image"
import React from "react"
import { ShoppingBag, Bell, ChevronLeft, User, Lock, Mail, Package, Gift, Users, Home, Calendar, Gift as GiftIcon, Newspaper, Settings, Star, Image as ImageIcon, Award, Trophy, Clock, Shield, Key } from "lucide-react"
import { signOut, useSession } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import ChangePasswordDialog from "@/components/ChangePasswordDialog"
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
import { getCurrentWIBTimeCompact } from "@/lib/formatWIBDate"
import { useOnlineStatus } from "@/hooks/use-online-status"
import { SessionProvider, useSessionContext } from "@/contexts/SessionContext"
import { ActionProvider, useAction } from "@/contexts/ActionContext"

// Shared icon props for ALL top-level sidebar navigation icons
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
    label: "Notifications",
    icon: <Bell {...SIDEBAR_ICON_PROPS} />,
    href: "/notifications",
  },
  {
    label: "LarataClub History",
    icon: <Trophy {...SIDEBAR_ICON_PROPS} />,
    href: "/larata-club-earning",
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
    label: "Master",
    icon: <Settings {...SIDEBAR_ICON_PROPS} />,
    subItems: [
      { href: "/master/merchandise-category", label: "Merchandise Category", icon: <Package className="h-4 w-4" strokeWidth={2} /> },
      { href: "/master/welcome-point", label: "Welcome Point", icon: <Star className="h-4 w-4" strokeWidth={2} /> },
      { href: "/master/banner", label: "Banner", icon: <ImageIcon className="h-4 w-4" strokeWidth={2} /> },
      { href: "/master/popups", label: "Popups", icon: <ImageIcon className="h-4 w-4" strokeWidth={2} /> },
      { href: "/master/membership", label: "Membership", icon: <Award className="h-4 w-4" strokeWidth={2} /> },
      { href: "/master/roles", label: "Roles", icon: <Shield className="h-4 w-4" strokeWidth={2} /> },
      { href: "/master/admin-management", label: "Auth Management", icon: <User className="h-4 w-4" strokeWidth={2} /> },
    ],
  },
]

function SidebarContentWrapper({ children }: { children: React.ReactNode }) {
  const { state } = useSidebar()
  const pathname = usePathname()
  const { session: displaySession, isPending } = useSessionContext()
  
  // Permissions state
  const [userPermissions, setUserPermissions] = React.useState<string[]>([])
  const [loadingPermissions, setLoadingPermissions] = React.useState(true)

  // Dialog states
  const [changePasswordDialogOpen, setChangePasswordDialogOpen] = React.useState(false)

  // Format pathname for display (breadcrumb-style)
  const formatPathnameForDisplay = (path: string): string => {
    if (!path || path === '/') return 'Dashboard'

    // Remove leading slash and split
    const segments = path.replace(/^\//, '').split('/')

    // Map segments to readable names based on NAV_ITEMS
    const segmentMap: Record<string, string> = {
      'dashboard': 'Dashboard',
      'users': 'Users',
      'news': 'News',
      'notifications': 'Notifications',
      'larata-club-earning': 'LarataClub History',
      'merchandise': 'Merchandise',
      'redeem-merchandise': 'Redeem Merchandise',
      'master': 'Master',
      'merchandise-category': 'Merchandise Category',
      'welcome-point': 'Welcome Point',
      'banner': 'Banner',
      'popups': 'Popups',
      'membership': 'Membership',
      'roles': 'Roles',
      'admin-management': 'Auth Management',
    }

    const readableSegments = segments.map(segment => {
      return segmentMap[segment] || segment
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
    })

    return readableSegments.join(' / ')
  }

  // Online status tracking with current page reporting
  const formattedPathname = formatPathnameForDisplay(pathname)
  const { sendHeartbeat } = useOnlineStatus()
  const { clearAction } = useAction()

  // Send heartbeat with current page on pathname change
  React.useEffect(() => {
    // Reset action state to reading when navigating to a new page
    clearAction()
    // Send heartbeat with the new page - the hook will use lastKnownPageRef.current
    sendHeartbeat(formattedPathname)
  }, [pathname, sendHeartbeat, clearAction])

  const handleLogout = async () => {
    try {
      // Direct API call to logout endpoint
      const res = await fetch('/api/auth/signout', {
        method: 'POST',
      })
      
      if (res.ok) {
        window.location.href = "/login"
      } else {
        console.error('Logout failed')
        // Force redirect anyway
        window.location.href = "/login"
      }
    } catch (error) {
      console.error('Logout error:', error)
      // Force redirect anyway
      window.location.href = "/login"
    }
  }

  const getUserInitials = () => {
    if (!displaySession?.user?.email) return "U"
    // Use email for initials since we're removing username concept
    return displaySession.user.email.charAt(0).toUpperCase()
  }

  // Fetch user permissions
  React.useEffect(() => {
    const fetchPermissions = async () => {
      if (displaySession?.user) {
        try {
          const res = await fetch('/api/user-permissions')
          if (res.ok) {
            const data = await res.json()
            setUserPermissions(data.permissions || [])
          }
        } catch (error) {
          console.error('Failed to fetch permissions:', error)
        } finally {
          setLoadingPermissions(false)
        }
      } else {
        setLoadingPermissions(false)
      }
    }

    fetchPermissions()
  }, [displaySession])

  // Filter nav items based on permissions
  const filteredNavItems = React.useMemo(() => {
    if (loadingPermissions || !displaySession) return NAV_ITEMS // Show all while loading

    const getPageKey = (href: string) => {
      // Special handling for master routes
      if (href.startsWith('/master/')) {
        return 'master-' + href.replace('/master/', '').replace(/\//g, '-')
      }
      return href.replace(/^\//, '').replace(/\//g, '-')
    }

    return NAV_ITEMS.map(item => {
      if (!item.subItems || item.subItems.length === 0) {
        // Single item - check if user has permission
        if (!item.href) return null
        const pageKey = getPageKey(item.href)
        if (userPermissions.length === 0 || userPermissions.includes(pageKey)) {
          return item
        }
        return null
      } else {
        // Group with sub-items - filter sub-items
        const filteredSubItems = item.subItems.filter(subItem => {
          if (!subItem.href) return false
          const pageKey = getPageKey(subItem.href)
          return userPermissions.length === 0 || userPermissions.includes(pageKey)
        })

        if (filteredSubItems.length > 0) {
          return { ...item, subItems: filteredSubItems }
        }
        return null
      }
    }).filter(Boolean) as typeof NAV_ITEMS
  }, [userPermissions, loadingPermissions, isPending])

  // Live WIB clock state
  const [currentTime, setCurrentTime] = React.useState<string>("")

  React.useEffect(() => {
    const updateTime = () => {
      setCurrentTime(getCurrentWIBTimeCompact())
    }

    updateTime()
    const interval = setInterval(updateTime, 1000)

    return () => clearInterval(interval)
  }, [])

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
    : pathname.startsWith("/merchandise/view/")
    ? {
        title: "View Merchandise",
        breadcrumb: ["Merchandise", "View Merchandise"],
      }
    : pathname === "/redeem-merchandise"
    ? {
        title: "Redeem Merchandise",
        breadcrumb: ["Merchandise", "Redeem Merchandise"],
      }
    : pathname.startsWith("/redeem-merchandise/view/")
    ? {
        title: "View Redeem",
        breadcrumb: ["Merchandise", "Redeem Merchandise", "View Redeem"],
      }
    : pathname === "/daily-benefit"
    ? {
        title: "Daily Benefit",
        breadcrumb: ["Daily Benefit"],
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
    : pathname.startsWith("/redeem-benefit/view/")
    ? {
        title: "View Redeem Benefit",
        breadcrumb: ["Daily Benefit", "Redeem Benefit", "View Redeem Benefit"],
      }
    : pathname === "/master/merchandise-category"
    ? {
        title: "Merchandise Category",
        breadcrumb: ["Master", "Merchandise Category"],
      }
    : pathname === "/master/merchandise-category/add"
    ? {
        title: "Add Merchandise Category",
        breadcrumb: ["Master", "Merchandise Category", "Add Merchandise Category"],
      }
    : pathname.startsWith("/master/merchandise-category/edit/")
    ? {
        title: "Edit Merchandise Category",
        breadcrumb: ["Master", "Merchandise Category", "Edit Merchandise Category"],
      }
    : pathname === "/master/welcome-point"
    ? {
        title: "Welcome Point",
        breadcrumb: ["Master", "Welcome Point"],
      }
    : pathname === "/master/welcome-point/add"
    ? {
        title: "Add Welcome Point",
        breadcrumb: ["Master", "Welcome Point", "Add Welcome Point"],
      }
    : pathname.startsWith("/master/welcome-point/edit/")
    ? {
        title: "Edit Welcome Point",
        breadcrumb: ["Master", "Welcome Point", "Edit Welcome Point"],
      }
    : pathname === "/master/banner"
    ? {
        title: "Banner",
        breadcrumb: ["Master", "Banner"],
      }
    : pathname === "/master/banner/add"
    ? {
        title: "Add Banner",
        breadcrumb: ["Master", "Banner", "Add Banner"],
      }
    : pathname.startsWith("/master/banner/edit/")
    ? {
        title: "Edit Banner",
        breadcrumb: ["Master", "Banner", "Edit Banner"],
      }
    : pathname === "/master/popups"
    ? {
        title: "Popups",
        breadcrumb: ["Master", "Popups"],
      }
    : pathname === "/master/popups/add"
    ? {
        title: "Add Popup",
        breadcrumb: ["Master", "Popups", "Add Popup"],
      }
    : pathname.startsWith("/master/popups/edit/")
    ? {
        title: "Edit Popup",
        breadcrumb: ["Master", "Popups", "Edit Popup"],
      }
    : pathname === "/master/membership"
    ? {
        title: "Membership",
        breadcrumb: ["Master", "Membership"],
      }
    : pathname === "/master/membership/add"
    ? {
        title: "Add Membership",
        breadcrumb: ["Master", "Membership", "Add Membership"],
      }
    : pathname.startsWith("/master/membership/edit/")
    ? {
        title: "Edit Membership",
        breadcrumb: ["Master", "Membership", "Edit Membership"],
      }
    : pathname === "/master/roles"
    ? {
        title: "Roles",
        breadcrumb: ["Master", "Roles"],
      }
    : pathname === "/master/roles/add"
    ? {
        title: "Add Role",
        breadcrumb: ["Master", "Roles", "Add Role"],
      }
    : pathname.startsWith("/master/roles/edit/")
    ? {
        title: "Edit Role",
        breadcrumb: ["Master", "Roles", "Edit Role"],
      }
    : pathname === "/master/admin-management"
    ? {
        title: "Auth Management",
        breadcrumb: ["Master", "Auth Management"],
      }
    : pathname === "/users"
    ? {
        title: "Users",
        breadcrumb: ["Users"],
      }
    : pathname.startsWith("/users/")
    ? {
        title: "View User",
        breadcrumb: ["Users", "View User"],
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
    : pathname.startsWith("/news/view/")
    ? {
        title: "View News",
        breadcrumb: ["News", "View News"],
      }
    : pathname === "/notifications"
    ? {
        title: "Notifications",
        breadcrumb: ["Notifications"],
      }
    : pathname === "/larata-club-earning"
    ? {
        title: "LarataClub History",
        breadcrumb: ["LarataClub History"],
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

            {filteredNavItems.map((item, index) => (

              <React.Fragment key={index}>

                <SidebarNavGroup
                  label={item.label}
                  icon={item.icon}
                  href={item.href}
                  subItems={item.subItems}
                />

                {item.label === "Merchandise" && (
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

                {!displaySession ? (
                  <div className="h-2 w-2 animate-pulse rounded-full bg-[#E5262C]/50" />
                ) : (
                  getUserInitials()
                )}
              </AvatarFallback>

            </Avatar>

            <div className="flex flex-col">

              <span className="text-sm font-medium text-gray-900">

                {!displaySession ? (
                  <div className="h-3 w-20 animate-pulse rounded bg-gray-200" />
                ) : (
                  displaySession?.user?.email || 'User'
                )}

              </span>

              <span className="text-xs text-gray-500">

                {!displaySession ? (
                  <div className="h-2 w-24 animate-pulse rounded bg-gray-200 mt-1" />
                ) : (
                  displaySession?.user?.email ? 'Admin' : ''
                )}

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
                            : item === "View User"
                            ? "/users"
                            : item === "News"
                            ? "/news"
                            : item === "Add News"
                            ? "/news/add"
                            : item === "LarataClub History"
                            ? "/larata-club-earning"
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
                            : item === "Master"
                            ? "/master/merchandise-category"
                            : item === "Merchandise Category"
                            ? "/master/merchandise-category"
                            : item === "Welcome Point"
                            ? "/master/welcome-point"
                            : item === "Banner"
                            ? "/master/banner"
                            : item === "Popups"
                            ? "/master/popups"
                            : item === "Membership"
                            ? "/master/membership"
                            : item === "Roles"
                            ? "/master/roles"
                            : item === "Auth Management"
                            ? "/master/admin-management"
                            : "/"
                        }
                      >
                        {item}
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>

                  {index < pageMeta.breadcrumb.length - 1 && (
                    <BreadcrumbSeparator />
                  )}
                </React.Fragment>
              ))}
            </BreadcrumbList>
          </Breadcrumb>

          <div className="ml-auto flex items-center gap-2">

            <div className="hidden md:flex items-center gap-2 text-sm text-gray-500">
              <Clock className="h-4 w-4" />
              <span className="font-mono">{currentTime}</span>
            </div>

            <DropdownMenu>

              <DropdownMenuTrigger className="h-8 w-8 p-0 rounded-full hover:bg-muted">

                <Avatar className="h-8 w-8 border border-gray-100">

                  <AvatarFallback className="bg-[#E5262C]/10 text-[#E5262C] font-semibold text-sm">

                    {!displaySession ? (
                      <div className="h-2 w-2 animate-pulse rounded-full bg-[#E5262C]/50" />
                    ) : (
                      getUserInitials()
                    )}
                  </AvatarFallback>

                </Avatar>

              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-48">

                <div className="px-2 py-1.5 text-sm text-gray-900 font-medium border-b">
                  {displaySession?.user?.email || 'User'}
                </div>

                <DropdownMenuItem onClick={() => setChangePasswordDialogOpen(true)} className="cursor-pointer">

                  <Key className="mr-2 h-4 w-4" />

                  <span>Change Password</span>

                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600">

                  <Lock className="mr-2 h-4 w-4" />

                  <span>Logout</span>

                </DropdownMenuItem>

              </DropdownMenuContent>

            </DropdownMenu>

          </div>

        </header>

        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">

          {children}

        </main>

        {/* Background gradient blobs for glassmorphism effect - positioned outside SidebarInset to avoid CSS containing block clipping */}
        <div className="fixed inset-0 -z-10 pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#E5262C] opacity-10 blur-3xl rounded-full" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-gray-300 opacity-10 blur-3xl rounded-full" />
        </div>

        {/* Change Password Dialog */}
        <ChangePasswordDialog
          open={changePasswordDialogOpen}
          onOpenChange={setChangePasswordDialogOpen}
          onPasswordChanged={() => {
            // Password changed successfully
          }}
        />
      </SidebarInset>
    </>
  )
}

export function DashboardLayoutClient({ children, initialSession }: { children: React.ReactNode; initialSession: any }) {
  return (
    <SessionProvider initialSession={initialSession}>
      <ActionProvider>
        <SidebarProvider defaultOpen={true}>
          <SidebarContentWrapper>{children}</SidebarContentWrapper>
        </SidebarProvider>
      </ActionProvider>
    </SessionProvider>
  )
}
