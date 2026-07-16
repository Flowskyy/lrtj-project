"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronRight, ChevronDown } from "lucide-react"
import { useEffect, useState } from "react"
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  useSidebar,
} from "@/components/ui/sidebar"

interface NavItem {
  href: string
  label: string
  icon?: React.ReactNode
}

interface SidebarNavGroupProps {
  label: string
  icon: React.ReactNode
  href?: string
  subItems?: NavItem[]
  isCollapsed?: boolean
  onMobileClose?: () => void
}

export function SidebarNavGroup({
  label,
  icon,
  href,
  subItems,
  isCollapsed,
  onMobileClose,
}: SidebarNavGroupProps) {
  const pathname = usePathname()
  const { state, toggleSidebar } = useSidebar()
  const isCollapsedState = state === "collapsed"
  
  // For flat items (no subItems)
  if (!subItems || subItems.length === 0) {
    if (!href) return null
    
    const isActive = href === "/dashboard"
      ? pathname === "/dashboard"
      : pathname.startsWith(href)

    const handleClick = () => {
      onMobileClose?.()
    }

    return (
      <SidebarMenuItem>
        <Link href={href} onClick={handleClick} className="block">
          <SidebarMenuButton
            isActive={isActive}
            tooltip={isCollapsedState ? label : undefined}
          >
            {icon}
            <span className="group-data-[collapsible=icon]:hidden">{label}</span>
          </SidebarMenuButton>
        </Link>
      </SidebarMenuItem>
    )
  }

  // For collapsible groups with subItems
  const isGroupActive = subItems.some(item =>
    item.href === "/dashboard"
      ? pathname === "/dashboard"
      : pathname.startsWith(item.href)
  )

  const [isOpen, setIsOpen] = useState(isGroupActive)

  useEffect(() => {
    setIsOpen(isGroupActive)
  }, [isGroupActive])

  return (
    <SidebarMenuItem>
      {/* Icon-only version when collapsed */}
      <div className="group-data-[collapsible=icon]:block hidden">
        <SidebarMenuButton
          isActive={isGroupActive}
          tooltip={isCollapsedState ? label : undefined}
          onClick={() => {
            if (isCollapsedState) {
              toggleSidebar()
              setIsOpen(true)
            }
          }}
        >
          {icon}
        </SidebarMenuButton>
      </div>
      {/* Full collapsible version when expanded */}
      <Collapsible open={isOpen} onOpenChange={setIsOpen} className="group/collapsible group-data-[collapsible=icon]:hidden">
        <CollapsibleTrigger className={`flex w-full items-center justify-between rounded-md p-2 transition-colors ${isGroupActive ? 'bg-primary/10 text-primary' : 'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'}`}>
          <div className="flex items-center gap-2">
            {icon}
            <span className="text-sm font-medium">{label}</span>
          </div>
          {isOpen ? <ChevronDown className="h-4 w-4 transition-transform duration-200" /> : <ChevronRight className="h-4 w-4 transition-transform duration-200" />}
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {subItems.map((subItem) => {
              const isSubActive = subItem.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(subItem.href)

              const handleSubClick = () => {
                onMobileClose?.()
              }

              return (
                <SidebarMenuSubItem key={subItem.href}>
                  <SidebarMenuSubButton
                    isActive={isSubActive}
                    size="md"
                    render={<Link href={subItem.href} onClick={handleSubClick} className="block" />}
                  >
                    {subItem.icon}
                    <span>{subItem.label}</span>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              )
            })}
          </SidebarMenuSub>
        </CollapsibleContent>
      </Collapsible>
    </SidebarMenuItem>
  )
}
