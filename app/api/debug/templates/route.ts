/**
 * Debug API to check workout templates
 */

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  console.log('User ID:', user.id)

  // Try different queries to debug

  // Query 1: All templates
  const { data: allTemplates, error: allError } = await supabase
    .from('workout_templates')
    .select('*')

  console.log('All templates:', allTemplates?.length, 'Error:', allError)

  // Query 2: Only public templates
  const { data: publicTemplates, error: publicError } = await supabase
    .from('workout_templates')
    .select('*')
    .eq('is_public', true)

  console.log('Public templates:', publicTemplates?.length, 'Error:', publicError)

  // Query 3: User templates
  const { data: userTemplates, error: userError } = await supabase
    .from('workout_templates')
    .select('*')
    .eq('user_id', user.id)

  console.log('User templates:', userTemplates?.length, 'Error:', userError)

  // Query 4: Using OR (the actual query in generator)
  const { data: orTemplates, error: orError } = await supabase
    .from('workout_templates')
    .select('*')
    .or(`user_id.eq.${user.id},is_public.eq.true`)

  console.log('OR query templates:', orTemplates?.length, 'Error:', orError)

  return NextResponse.json({
    userId: user.id,
    allTemplates: {
      count: allTemplates?.length || 0,
      error: allError,
      samples: allTemplates?.slice(0, 2).map(t => ({
        id: t.id,
        name: t.name,
        is_public: t.is_public,
        user_id: t.user_id,
      }))
    },
    publicTemplates: {
      count: publicTemplates?.length || 0,
      error: publicError,
      samples: publicTemplates?.slice(0, 2).map(t => ({
        id: t.id,
        name: t.name,
        is_public: t.is_public,
      }))
    },
    userTemplates: {
      count: userTemplates?.length || 0,
      error: userError,
    },
    orQueryTemplates: {
      count: orTemplates?.length || 0,
      error: orError,
      samples: orTemplates?.slice(0, 2).map(t => ({
        id: t.id,
        name: t.name,
        is_public: t.is_public,
        user_id: t.user_id,
      }))
    }
  })
}
