'use client'

import { SidebarProvider, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/app-sidebar'
import { AppCompletion } from '@/components/profile-completion/AppCompletion'

interface AppShellProps {
  children: React.ReactNode
}

/**
 * AppShell wraps pages that need the sidebar navigation.
 *
 * Features:
 * - Collapsible sidebar on desktop (icon mode)
 * - Sheet-based overlay on mobile
 * - ChatGPT-style toggle (button in sidebar header, not content)
 * - State persisted via cookie
 */
export function AppShell({ children }: AppShellProps) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        {/* Mobile header with hamburger - hidden on desktop */}
        {/* pt-safe adds padding for iOS notch/Dynamic Island in PWA standalone mode */}
        <header className="flex min-h-14 shrink-0 items-end pb-3 gap-2 border-b px-4 pt-safe md:hidden">
          <SidebarTrigger className="-ml-1" />
        </header>
        {/* Main content */}
        <main className="flex-1">
          <AppCompletion>{children}</AppCompletion>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
