import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const forwardedHost = request.headers.get('x-forwarded-host')
      const forwardedProto = request.headers.get('x-forwarded-proto')
      const isLocalEnv = process.env.NODE_ENV === 'development'

      if (isLocalEnv) {
        // In development, always use the origin (which will be http://localhost)
        return NextResponse.redirect(`${origin}${next}`)
      } else if (forwardedHost) {
        // In production, use the forwarded protocol or default to https
        const protocol = forwardedProto || 'https'
        return NextResponse.redirect(`${protocol}://${forwardedHost}${next}`)
      } else {
        return NextResponse.redirect(`${origin}${next}`)
      }
    } else {
      // Log error details for debugging (you can send to monitoring service)
      // Don't expose error details to user for security
      return NextResponse.redirect(
        `${origin}/auth/auth-code-error?message=${encodeURIComponent('verification_failed')}`
      )
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(
    `${origin}/auth/auth-code-error?message=${encodeURIComponent('missing_code')}`
  )
}

