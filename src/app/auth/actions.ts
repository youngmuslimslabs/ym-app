'use server'

import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SIDE_COOKIE } from '@/lib/side'

export async function signOut() {
    const supabase = await createClient()
    await supabase.auth.signOut()
    // Drop the Brothers/Sisters theme so the login page (and the next person
    // on a shared device) gets the General theme.
    ;(await cookies()).delete(SIDE_COOKIE)
    redirect('/login/')
}
