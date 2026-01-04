'use client'

import { SidebarProvider, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/app-sidebar'

interface AppShellProps {
  children: React.ReactNode
}

/**
 * AppShell wraps pages that need the sidebar navigation.
 *
 * Features:
 * - Collapsible sidebar on desktop (icon mode)
 * - Sheet-based overlay on mobile
 * - Hamburger trigger in mobile header
 * - State persisted via cookie
 */
export function AppShell({ children }: AppShellProps) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        {/* Mobile header with hamburger - hidden on desktop */}
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4 md:hidden">
          <SidebarTrigger className="-ml-1" />
        </header>
        {/* Main content */}
        <main className="flex-1">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
