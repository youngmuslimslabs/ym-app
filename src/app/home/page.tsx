import { redirect } from 'next/navigation'
import { Users, DollarSign, FileText } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { fetchUserContext } from '@/lib/supabase/queries'
import { AppShell } from '@/components/layout'
import { PersonalContextCard, QuickActionCard } from '@/components/home'

const QUICK_ACTIONS = [
  {
    href: '/people',
    icon: Users,
    title: 'People',
    description: 'Browse YM members',
  },
  {
    href: '/finance',
    icon: DollarSign,
    title: 'Finance',
    description: 'Reimbursements',
  },
  {
    href: '/docs',
    icon: FileText,
    title: 'Docs',
    description: 'Halaqa & SOPs',
  },
]

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  // Fetch real user context
  const userContext = await fetchUserContext(user.id)

  // Fallback values if user context not found
  const displayName = userContext?.name || user.email?.split('@')[0] || 'Member'
  const displayRoles = userContext?.roles.length ? userContext.roles : []
  const displayNN = userContext?.neighborNetName || 'No NeighborNet'
  const displaySR = userContext?.subregionName || ''
  const displayYear = userContext?.yearJoined || new Date().getFullYear()

  return (
    <AppShell>
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-3.5rem)] md:min-h-screen px-4 py-12">
        <div className="w-full max-w-2xl space-y-8">
          {/* Personal Context Card */}
          <div
            className="animate-in fade-in slide-in-from-bottom-4 duration-500"
            style={{ animationDelay: '0ms' }}
          >
            <PersonalContextCard
              name={displayName}
              roles={displayRoles}
              neighborNetName={displayNN}
              subregionName={displaySR}
              yearJoined={displayYear}
            />
          </div>

          {/* Quick Action Cards */}
          <div
            className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500"
            style={{ animationDelay: '150ms' }}
          >
            {QUICK_ACTIONS.map((action) => (
              <QuickActionCard
                key={action.href}
                href={action.href}
                icon={action.icon}
                title={action.title}
                description={action.description}
              />
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  )
}
