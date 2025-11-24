'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'

/**
 * Get the application URL for redirects, with proper support for Vercel preview deployments.
 * Priority order:
 * 1. Origin header (ensures preview deployments work correctly)
 * 2. Referer header (fallback, contains the full URL)
 * 3. Host header + protocol (fallback if origin not available)
 * 4. VERCEL_URL environment variable (Vercel's automatic deployment URL)
 * 5. APP_URL or NEXT_PUBLIC_APP_URL (explicit configuration)
 */
async function getAppUrl(): Promise<string> {
  const headersList = await headers()
  const origin = headersList.get('origin')
  const referer = headersList.get('referer')
  const host = headersList.get('host')
  const protocol = headersList.get('x-forwarded-proto') || 'https'

  // Debug logging to understand what headers are available
  console.log('[getAppUrl] Headers:', {
    origin,
    referer,
    host,
    protocol,
    vercelUrl: process.env.VERCEL_URL,
    appUrl: process.env.APP_URL,
  })

  // Try to extract origin from referer if origin header is not available
  let urlFromReferer = ''
  if (!origin && referer) {
    try {
      const refererUrl = new URL(referer)
      urlFromReferer = refererUrl.origin
    } catch (e) {
      console.error('[getAppUrl] Failed to parse referer:', e)
    }
  }

  const result = origin ||
    urlFromReferer ||
    (host ? `${protocol}://${host}` : '') ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '') ||
    process.env.APP_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    'http://localhost:3000'

  console.log('[getAppUrl] Resolved URL:', result)
  return result
}

export async function signUp(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const fullName = formData.get('fullName') as string

  const supabase = await createClient()
  const appUrl = await getAppUrl()

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${appUrl}/api/auth/callback`,
      data: {
        full_name: fullName,
      },
    },
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true, data }
}

export async function signIn(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  redirect('/dashboard')
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/')
}

export async function getUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}

export async function resetPassword(formData: FormData) {
  const email = formData.get('email') as string
  const supabase = await createClient()
  const appUrl = await getAppUrl()

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${appUrl}/auth/update-password`,
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

export async function updatePassword(formData: FormData) {
  const password = formData.get('password') as string
  const supabase = await createClient()

  const { error } = await supabase.auth.updateUser({
    password,
  })

  if (error) {
    return { error: error.message }
  }

  redirect('/dashboard')
}

export async function signInWithGoogle(clientOrigin?: string) {
  const supabase = await createClient()

  // Prioritize client-provided origin over server-detected URL
  const appUrl = clientOrigin || await getAppUrl()

  console.log('[signInWithGoogle] Using URL:', appUrl, 'from:', clientOrigin ? 'client' : 'server')

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${appUrl}/api/auth/callback`,
    },
  })

  if (error) {
    return { error: error.message }
  }

  if (data.url) {
    redirect(data.url)
  }
}

