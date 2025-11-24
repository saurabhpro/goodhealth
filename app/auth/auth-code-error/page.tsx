import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Suspense } from 'react'

function ErrorContent({ searchParams }: { readonly searchParams: { readonly message?: string } }) {
  const errorMessage = searchParams.message || 'Unknown error'

  // Common error messages and their user-friendly explanations
  const errorExplanations: Record<string, string> = {
    'missing_code': 'No authentication code was provided in the URL.',
    'verification_failed': 'Failed to verify your authentication code.',
    'pkce_verifier_invalid': 'The authentication session has expired or is invalid. This usually happens if you wait too long to complete the sign-in.',
    'otp_expired': 'The authentication link has expired. Links are only valid for a limited time.',
    'invalid_pkce_code_verifier': 'The authentication session is no longer valid. Please try signing in again.',
  }

  const explanation = errorExplanations[errorMessage] || errorMessage

  return (
    <Card className="w-[450px]">
      <CardHeader>
        <CardTitle className="text-destructive">Authentication Error</CardTitle>
        <CardDescription>
          There was a problem verifying your authentication code
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-md bg-destructive/15 p-4">
          <p className="text-sm text-destructive font-medium mb-1">
            {explanation}
          </p>
          {errorMessage !== explanation && (
            <p className="text-xs text-destructive/70 font-mono">
              Error: {errorMessage}
            </p>
          )}
        </div>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p className="font-semibold">What you can try:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Request a new authentication link</li>
            <li>Make sure you&apos;re using the latest link from your email</li>
            <li>Try signing in again from the beginning</li>
            <li>Clear your browser cache and cookies</li>
            <li>If using Google sign-in, try email/password instead (or vice versa)</li>
          </ul>
        </div>
      </CardContent>
      <CardFooter className="flex gap-4">
        <Button asChild className="flex-1">
          <Link href="/login">Back to Sign In</Link>
        </Button>
        <Button variant="outline" asChild className="flex-1">
          <Link href="/">Go Home</Link>
        </Button>
      </CardFooter>
    </Card>
  )
}

export default async function AuthCodeErrorPage(props: {
  readonly searchParams: Promise<{ readonly message?: string }>
}) {
  const searchParams = await props.searchParams
  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <Suspense fallback={<div>Loading...</div>}>
        <ErrorContent searchParams={searchParams} />
      </Suspense>
    </div>
  )
}
