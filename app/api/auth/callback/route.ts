import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'
  const error_description = searchParams.get('error_description')
  const error_code = searchParams.get('error')

  // Check for OAuth errors first (e.g., user denied access)
  if (error_code) {
    console.error('OAuth error:', { error_code, error_description })
    return NextResponse.redirect(
      `${origin}/auth/auth-code-error?message=${encodeURIComponent(error_description || error_code)}`
    )
  }

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      // Log error details for debugging
      console.error('Auth code exchange error:', {
        error: error.message,
        code: error.code,
        status: error.status,
      })

      return NextResponse.redirect(
        `${origin}/auth/auth-code-error?message=${encodeURIComponent(error.message)}`
      )
    }

    // Use forwarded host for correct redirect on Vercel
    const forwardedHost = request.headers.get('x-forwarded-host')
    const forwardedProto = request.headers.get('x-forwarded-proto') || 'https'

    const redirectUrl = forwardedHost
      ? `${forwardedProto}://${forwardedHost}${next}`
      : `${origin}${next}`

    return NextResponse.redirect(redirectUrl)
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(
    `${origin}/auth/auth-code-error?message=${encodeURIComponent('missing_code')}`
  )
}

