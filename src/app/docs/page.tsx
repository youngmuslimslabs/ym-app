import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppShell } from '@/components/layout'
import { DocsContent } from './DocsContent'

export default async function DocsPage() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  return (
    <AppShell>
      <DocsContent />
    </AppShell>
  )
}
