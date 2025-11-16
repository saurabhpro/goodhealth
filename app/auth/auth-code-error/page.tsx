import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

export default function AuthCodeErrorPage() {
  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <Card className="w-[450px]">
        <CardHeader>
          <CardTitle className="text-destructive">Authentication Error</CardTitle>
          <CardDescription>
            There was a problem verifying your authentication code
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md bg-destructive/15 p-4">
            <p className="text-sm text-destructive">
              The authentication link may have expired or is invalid.
            </p>
          </div>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p className="font-semibold">What you can try:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Request a new authentication link</li>
              <li>Make sure you're using the latest link from your email</li>
              <li>Try signing in again from the beginning</li>
              <li>Clear your browser cache and cookies</li>
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
    </div>
  )
}
