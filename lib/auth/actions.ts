'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'

/**
 * Get the application URL for email redirects (signUp, resetPassword).
 * These are triggered from server-side and need to construct URLs from environment/headers.
 * For OAuth flows, the client should pass the origin directly.
 */
async function getAppUrl(): Promise<string> {
  const headersList = await headers()
  const referer = headersList.get('referer')
  const host = headersList.get('host')
  const protocol = headersList.get('x-forwarded-proto') || 'https'

  // Try to extract origin from referer (most reliable for server actions)
  if (referer) {
    try {
      const refererUrl = new URL(referer)
      return refererUrl.origin
    } catch (e) {
      console.error('[getAppUrl] Failed to parse referer:', e)
    }
  }

  // Fallback to host header
  if (host) {
    return `${protocol}://${host}`
  }

  // Last resort: environment variables
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }

  return process.env.APP_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    'http://localhost:3000'
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

export async function signInWithGoogle(clientOrigin: string) {
  const supabase = await createClient()

  // Use a fixed production callback URL to avoid Supabase allowlist issues
  // Pass the actual origin as a state parameter so we can redirect back correctly
  const productionUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://goodhealth-three.vercel.app'
  const redirectUrl = `${productionUrl}/api/auth/callback?returnTo=${encodeURIComponent(clientOrigin)}`

  console.log('[signInWithGoogle] Client origin:', clientOrigin)
  console.log('[signInWithGoogle] Redirect URL:', redirectUrl)

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectUrl,
    },
  })

  if (error) {
    console.error('[signInWithGoogle] OAuth error:', error)
    return { error: error.message }
  }

  if (data.url) {
    console.log('[signInWithGoogle] Redirecting to Google:', data.url)
    redirect(data.url)
  }
}

