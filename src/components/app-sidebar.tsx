'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
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
  Calendar,
  CalendarDays,
  Shield,
  X,
} from 'lucide-react'
import { MemberAvatar } from '@/components/brand/member-avatar'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'
import { createClient } from '@/lib/supabase/client'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/brand/logo'
import { useAuth } from '@/contexts/AuthContext'

const NAV_ITEMS = [
  { href: '/home', label: 'Home', icon: Home },
  { href: '/people', label: 'People', icon: Users },
  { href: '/finance', label: 'Finance', icon: DollarSign },
  { href: '/docs', label: 'Docs', icon: FileText },
]

interface InvitedConference {
  id: string
  name: string
}

export function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, signOut } = useAuth()
  // Using shadcn's useSidebar hook for state and toggle
  const { isMobile, setOpenMobile, state, toggleSidebar } = useSidebar()
  const [conferences, setConferences] = useState<InvitedConference[]>([])
  const [isAdmin, setIsAdmin] = useState(false)

  // Load conferences the user is invited to + admin status. RLS already
  // filters attendee rows to their own. The admin check uses the same
  // is_event_admin() function the DB policies use, so the sidebar visibility
  // matches what they're actually allowed to do.
  //
  // Fetched once per signed-in user, then refreshed on window focus (catches
  // the long-idle-tab case, e.g. a newly granted admin). It used to re-run on
  // every pathname change — three queries per click for data that rarely
  // changes. Real-time push for instant deltas would need a Supabase realtime
  // subscription on conference_attendees + role_assignments; we'll add that in
  // the realtime stage.
  const authId = user?.id
  useEffect(() => {
    if (!authId) return
    let cancelled = false
    // Coalesce focus-triggered refetches: tab-thrash should not fire
    // back-to-back queries.
    let lastFetchStartedAt = 0
    const supabase = createClient()

    async function fetchSidebarData() {
      if (Date.now() - lastFetchStartedAt < 30_000) return
      lastFetchStartedAt = Date.now()
      const { data: userRow } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', authId!)
        .maybeSingle()
      if (!userRow || cancelled) return
      const [confRes, adminRes] = await Promise.all([
        supabase
          .from('conference_attendees')
          .select('conferences(id, name)')
          .eq('user_id', userRow.id),
        supabase.rpc('is_event_admin', { p_user_id: userRow.id }),
      ])
      if (cancelled) return
      const list = ((confRes.data ?? []) as { conferences: InvitedConference | null }[])
        .map((r) => r.conferences)
        .filter((c): c is InvitedConference => c !== null)
        .sort((a, b) => a.name.localeCompare(b.name))
      setConferences(list)
      setIsAdmin(Boolean(adminRes.data))
    }

    void fetchSidebarData()
    const onFocus = () => {
      void fetchSidebarData()
    }
    window.addEventListener('focus', onFocus)
    return () => {
      cancelled = true
      window.removeEventListener('focus', onFocus)
    }
  }, [authId])

  // Custom state for hover effect on entire collapsed sidebar
  const [isHoveringCollapsed, setIsHoveringCollapsed] = useState(false)

  const isCollapsed = state === 'collapsed'

  // Extract display name from email (e.g., "omar.khan@..." -> "Omar")
  const displayName = user?.email?.split('@')[0]?.split('.')[0] ?? 'User'
  const capitalizedName = displayName.charAt(0).toUpperCase() + displayName.slice(1)

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
    if (isMobile) setOpenMobile(false)
    window.open(
      'https://wa.me/15169378725?text=Assalamu%20alaykum%20my%20beloved%20brother.%20This%20app%20has%20caused%20me%20emotional%20damage.%20My%20grievances%20are%20as%20follows%3A%20',
      '_blank'
    )
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
                  <PanelLeft className="!size-4" />
                ) : (
                  <Logo className="h-6 max-w-8" />
                )}
              </SidebarMenuButton>
            ) : (
              /* When expanded: show logo with app name */
              <SidebarMenuButton size="lg" className="pointer-events-none select-none" tabIndex={-1}>
                <Logo variant="full" className="h-4 max-w-44" />
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

        {conferences.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>
              <CalendarDays className="mr-1.5 size-3" />
              Conferences
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {conferences.map((c) => (
                  <SidebarMenuItem key={c.id}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === `/conferences/${c.id}`}
                      tooltip={c.name}
                      onClick={handleNavClick}
                    >
                      <Link href={`/conferences/${c.id}`}>
                        <Calendar />
                        <span className="truncate">{c.name}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>
              <Shield className="mr-1.5 size-3" />
              Admin
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname.startsWith('/admin/conferences')}
                    tooltip="Conferences"
                    onClick={handleNavClick}
                  >
                    <Link href="/admin/conferences">
                      <Calendar />
                      <span>Conferences</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
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
                  <MemberAvatar
                    name={user?.user_metadata?.full_name || capitalizedName}
                    src={user?.user_metadata?.avatar_url}
                    size="xs"
                    className="bg-sidebar-primary text-sidebar-primary-foreground"
                  />
                  {/* Name with inline chevron */}
                  <span className="truncate font-semibold max-w-[100px]">{capitalizedName}</span>
                  <ChevronUp className="ml-auto h-4 w-4 shrink-0" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="min-w-40 rounded-lg"
                side="top"
                align="start"
                sideOffset={4}
              >
                <DropdownMenuItem onClick={handleViewProfile} className="text-sm">
                  <User className="mr-2 h-3.5 w-3.5" />
                  View Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleFeedback} className="text-sm">
                  <MessageSquare className="mr-2 h-3.5 w-3.5" />
                  Share Feedback
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSignOut} className="text-sm">
                  <LogOut className="mr-2 h-3.5 w-3.5" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>

        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
