import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'
  const returnTo = searchParams.get('returnTo') // Original origin for preview deployments
  const error_description = searchParams.get('error_description')
  const error_code = searchParams.get('error')

  // Determine the target origin (for preview deployments)
  const targetOrigin = returnTo || origin

  // Check for OAuth errors first (e.g., user denied access)
  if (error_code) {
    console.error('OAuth error:', { error_code, error_description })
    return NextResponse.redirect(
      `${targetOrigin}/auth/auth-code-error?message=${encodeURIComponent(error_description || error_code)}`
    )
  }

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // Always redirect to the target origin (preview deployment or production)
      console.log('[Callback] Redirecting to:', `${targetOrigin}${next}`)
      return NextResponse.redirect(`${targetOrigin}${next}`)
    } else {
      // Log error details for debugging
      console.error('Auth code exchange error:', {
        error: error.message,
        code: error.code,
        status: error.status,
      })

      return NextResponse.redirect(
        `${targetOrigin}/auth/auth-code-error?message=${encodeURIComponent(error.message)}`
      )
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(
    `${targetOrigin}/auth/auth-code-error?message=${encodeURIComponent('missing_code')}`
  )
}

