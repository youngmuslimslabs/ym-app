import { NextResponse } from 'next/server'
import { google } from 'googleapis'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

export async function POST() {
  const supabase = await createServerClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: userRow } = await supabase
    .from('users')
    .select('id')
    .eq('auth_id', authUser.id)
    .maybeSingle()
  if (!userRow) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: adminFlag } = await supabase.rpc('is_event_admin', {
    p_user_id: userRow.id,
  })
  if (!adminFlag) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const serviceEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n')
  const adminEmail = process.env.GOOGLE_ADMIN_EMAIL
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!serviceEmail || !privateKey || !adminEmail || !supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: 'Server misconfigured: missing Google credentials' }, { status: 500 })
  }

  const auth = new google.auth.JWT({
    email: serviceEmail,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/admin.directory.user.readonly'],
    subject: adminEmail,
  })

  const directory = google.admin({ version: 'directory_v1', auth })
  const googleUsers: { email: string; firstName: string | null; lastName: string | null; avatarUrl: string | null }[] = []
  let pageToken: string | undefined

  do {
    const res = await directory.users.list({
      domain: 'youngmuslims.com',
      maxResults: 500,
      pageToken,
      projection: 'basic',
    })
    for (const user of res.data.users ?? []) {
      if (!user.primaryEmail) continue
      googleUsers.push({
        email: user.primaryEmail,
        firstName: user.name?.givenName ?? null,
        lastName: user.name?.familyName ?? null,
        avatarUrl: user.thumbnailPhotoUrl ?? null,
      })
    }
    pageToken = res.data.nextPageToken ?? undefined
  } while (pageToken)

  const adminClient = createClient(supabaseUrl, serviceRoleKey)
  let created = 0, updated = 0, skipped = 0, errors = 0

  // Fetch all existing users via pagination (Supabase caps each page at 1000)
  type ExistingUser = { id: string; email: string; first_name: string | null; last_name: string | null; avatar_url: string | null }
  const allExisting: ExistingUser[] = []
  const PAGE = 1000
  for (let page = 0; ; page++) {
    const { data, error } = await adminClient
      .from('users')
      .select('id, email, first_name, last_name, avatar_url')
      .range(page * PAGE, (page + 1) * PAGE - 1)
    if (error) return NextResponse.json({ error: 'Failed to fetch existing users' }, { status: 500 })
    if (!data || data.length === 0) break
    allExisting.push(...(data as ExistingUser[]))
    if (data.length < PAGE) break
  }
  const existingMap = new Map(allExisting.map((u) => [u.email, u]))

  // Split into new vs existing
  const toInsert = googleUsers.filter((g) => !existingMap.has(g.email))
  const toCheck = googleUsers.filter((g) => existingMap.has(g.email))

  // Bulk-insert all new users in one call
  if (toInsert.length > 0) {
    const { error } = await adminClient.from('users').insert(
      toInsert.map((g) => ({
        email: g.email,
        first_name: g.firstName,
        last_name: g.lastName,
        avatar_url: g.avatarUrl,
      }))
    )
    if (error) errors += toInsert.length; else created += toInsert.length
  }

  // Only update existing rows that have missing fields
  for (const gUser of toCheck) {
    const existing = existingMap.get(gUser.email)!
    const updates: Record<string, string> = {}
    if (!existing.first_name && gUser.firstName) updates.first_name = gUser.firstName
    if (!existing.last_name && gUser.lastName) updates.last_name = gUser.lastName
    if (!existing.avatar_url && gUser.avatarUrl) updates.avatar_url = gUser.avatarUrl

    if (Object.keys(updates).length > 0) {
      const { error } = await adminClient.from('users').update(updates).eq('id', existing.id)
      if (error) errors++; else updated++
    } else {
      skipped++
    }
  }

  return NextResponse.json({ created, updated, skipped, errors, total: googleUsers.length })
}
