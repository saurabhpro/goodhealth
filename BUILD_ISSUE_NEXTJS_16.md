# Next.js 16 Build Issue (RESOLVED)

## Problem

The build was failing in GitHub Actions with Next.js 16.0.3:

```
⨯ Invalid segment configuration export detected. This can cause unexpected behavior from the configs not being applied. You should see the relevant failures in the logs above. Please fix them to continue.
```

However, the actual validation errors were not shown in the logs. This made debugging very difficult as the error message claimed to show failures "in the logs above" but they were not present.

## Root Cause

The actual issue was in `proxy.ts` using `String.raw` template literal in the middleware config matcher, which Next.js 16 doesn't support:

```typescript
// This caused the build to fail
export const config = {
  matcher: [String.raw`/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)`]
}
```

## Solution

Changed the `config.matcher` from using `String.raw` template literal to a regular string in `proxy.ts`:

```typescript
// Fixed version
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)']
}
```

Note the escaped backslash (`\\.`) instead of the single backslash that `String.raw` allowed.

The build now passes successfully with both Turbopack and webpack.

## Investigation Notes

- The build works fine with Next.js 15.1.6
- The error started appearing after commit `9359024` (eslint fixes)
- Previous commit `16253440` builds successfully
- All route segment config exports (`export const dynamic = 'force-dynamic'`) were actually valid
- The viewport export in app/layout.tsx being properly typed didn't fix the issue
- PWA plugin was not the cause

## Related Issues

- https://github.com/vercel/next.js/issues/73518 (Turbopack build errors not showing details)
- This appears to be a Next.js 16 regression where middleware config validation errors are not properly displayed
