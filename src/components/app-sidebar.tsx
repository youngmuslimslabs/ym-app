'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import Image from 'next/image'
import {
  Home,
  Users,
  DollarSign,
  FileText,
  MessageSquare,
  User,
  LogOut,
  ChevronUp,
  PanelLeftClose,
  PanelLeft,
  X,
} from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'

const NAV_ITEMS = [
  { href: '/home', label: 'Home', icon: Home },
  { href: '/people', label: 'People', icon: Users },
  { href: '/finance', label: 'Finance', icon: DollarSign },
  { href: '/docs', label: 'Docs', icon: FileText },
]

export function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, signOut } = useAuth()
  // Using shadcn's useSidebar hook for state and toggle
  const { isMobile, setOpenMobile, state, toggleSidebar } = useSidebar()

  // Custom state for hover effect on entire collapsed sidebar
  const [isHoveringCollapsed, setIsHoveringCollapsed] = useState(false)

  const isCollapsed = state === 'collapsed'

  // Extract display name from email (e.g., "omar.khan@..." -> "Omar")
  const displayName = user?.email?.split('@')[0]?.split('.')[0] ?? 'User'
  const capitalizedName = displayName.charAt(0).toUpperCase() + displayName.slice(1)
  const initials = capitalizedName.charAt(0).toUpperCase()

  const handleNavClick = () => {
    // Close mobile sidebar when navigating
    if (isMobile) {
      setOpenMobile(false)
    }
  }

  const handleViewProfile = () => {
    if (isMobile) setOpenMobile(false)
    router.push('/profile')
  }

  const handleSignOut = async () => {
    if (isMobile) setOpenMobile(false)
    await signOut()
  }

  const handleFeedback = () => {
    // TODO: Implement feedback action (external link, modal, or defer)
    console.log('Share feedback clicked')
  }

  // Handle click on collapsed sidebar to expand
  const handleSidebarClick = (e: React.MouseEvent) => {
    // Only expand if collapsed and on desktop
    if (isCollapsed && !isMobile) {
      // Don't expand if clicking on a button or link (let those handle their own actions)
      const target = e.target as HTMLElement
      const isInteractiveElement = target.closest(
        'button, a, [role="menuitem"], [role="button"], input, select, textarea'
      )
      if (!isInteractiveElement) {
        setIsHoveringCollapsed(false) // Reset hover state when expanding
        toggleSidebar()
      }
    }
  }

  return (
    <Sidebar
      collapsible="icon"
      onMouseEnter={() => isCollapsed && !isMobile && setIsHoveringCollapsed(true)}
      onMouseLeave={() => setIsHoveringCollapsed(false)}
      onClick={handleSidebarClick}
      className={isCollapsed && !isMobile ? 'cursor-pointer' : ''}
    >
      {/* Header - YM Logo */}
      <SidebarHeader className="relative">
        <SidebarMenu>
          <SidebarMenuItem>
            {/* When collapsed on desktop: logo swaps to expand icon on sidebar hover */}
            {isCollapsed && !isMobile ? (
              <SidebarMenuButton
                size="lg"
                onClick={toggleSidebar}
                tooltip="Open sidebar"
              >
                {isHoveringCollapsed ? (
                  <PanelLeft className="!size-6" />
                ) : (
                  <Image
                    src="/favicon.ico"
                    alt="Young Muslims"
                    width={24}
                    height={24}
                    className="rounded shrink-0"
                  />
                )}
              </SidebarMenuButton>
            ) : (
              /* When expanded: show logo with app name */
              <SidebarMenuButton size="lg" className="cursor-default hover:bg-transparent">
                <Image
                  src="/favicon.ico"
                  alt="Young Muslims"
                  width={24}
                  height={24}
                  className="rounded shrink-0"
                />
                <span className="truncate font-semibold">Young Muslims</span>
              </SidebarMenuButton>
            )}
          </SidebarMenuItem>
        </SidebarMenu>

        {/* Close/Collapse button - vertically centered with logo */}
        {/* Mobile: X to close sheet overlay */}
        {isMobile && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setOpenMobile(false)}
            className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 text-sidebar-foreground/70 hover:text-sidebar-foreground"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close sidebar</span>
          </Button>
        )}
        {/* Desktop: PanelLeftClose to collapse (only when expanded) */}
        {!isCollapsed && !isMobile && (
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 text-sidebar-foreground/70 hover:text-sidebar-foreground"
          >
            <PanelLeftClose className="h-4 w-4" />
            <span className="sr-only">Collapse sidebar</span>
          </Button>
        )}
      </SidebarHeader>

      {/* Navigation - using shadcn's built-in tooltip support */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
                    tooltip={item.label}
                    onClick={handleNavClick}
                  >
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer - User Profile + Feedback */}
      <SidebarFooter>
        <SidebarMenu>
          {/* User Profile - dropdown opens upward */}
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  tooltip={capitalizedName}
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  {/* Avatar - 24px to match logo size in lg variant buttons */}
                  <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">
                    {initials}
                  </div>
                  {/* Name with inline chevron */}
                  <span className="truncate font-semibold max-w-[100px]">{capitalizedName}</span>
                  <ChevronUp className="ml-auto h-4 w-4 shrink-0" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-48 rounded-lg"
                side="top"
                align="start"
                sideOffset={4}
              >
                <DropdownMenuItem onClick={handleViewProfile}>
                  <User className="mr-2 h-4 w-4" />
                  View Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>

          {/* Share Feedback */}
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Share Feedback" onClick={handleFeedback}>
              <MessageSquare />
              <span>Share Feedback</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
