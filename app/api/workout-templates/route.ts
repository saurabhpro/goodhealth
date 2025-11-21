/**
 * API route to fetch all workout templates (user's + public)
 */

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  // Fetch user's templates + public templates
  const { data: templates, error } = await supabase
    .from('workout_templates')
    .select('*')
    .or(`user_id.eq.${user.id},is_public.eq.true`)

  if (error) {
    console.error('Error fetching templates:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    templates,
    count: templates?.length || 0,
    publicCount: templates?.filter(t => t.is_public).length || 0,
    userCount: templates?.filter(t => t.user_id === user.id).length || 0,
  })
}
