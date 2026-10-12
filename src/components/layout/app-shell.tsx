'use client'

import Link from 'next/link'
import { SidebarProvider, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar'
import { Logo } from '@/components/brand/logo'
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
        <header className="flex min-h-14 shrink-0 items-end gap-3 border-b bg-background px-4 pb-3 pt-safe md:hidden">
          <SidebarTrigger className="-ml-1" />
          <Link href="/home" aria-label="Young Muslims home" className="mb-1.5 text-primary">
            <Logo variant="full" className="h-4 max-w-[11rem]" />
          </Link>
        </header>
        {/* Main content */}
        <main className="flex-1">
          <AppCompletion>{children}</AppCompletion>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
