'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useUser } from '@/lib/auth/hooks'
import { createClient } from '@/lib/supabase/client'
import { ThemeToggle } from '@/components/theme-toggle'
import { Menu, Dumbbell, Activity, CalendarDays, Ruler, TrendingUp, Target } from 'lucide-react'

export function Navbar() {
  const pathname = usePathname()
  const { user, loading } = useUser()
  const [signingOut, setSigningOut] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Activity },
    { name: 'Workouts', href: '/workouts', icon: Dumbbell },
    { name: 'Workout Plans', href: '/workout-plans', icon: CalendarDays },
    { name: 'Measurements', href: '/measurements', icon: Ruler },
    { name: 'Progress', href: '/progress', icon: TrendingUp },
    { name: 'Goals', href: '/goals', icon: Target },
  ]

  const handleSignOut = async () => {
    try {
      setSigningOut(true)
      const supabase = createClient()

      // Sign out from Supabase
      const { error } = await supabase.auth.signOut()

      if (error) {
        console.error('Error signing out:', error)
        setSigningOut(false)
        return
      }

      // Navigate to home page (which shows onboarding)
      // Use window.location for full page reload to ensure clean state
      window.location.href = '/'
    } catch (error) {
      console.error('Error signing out:', error)
      setSigningOut(false)
    }
  }

  return (
    <nav className="border-b bg-background sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Left side: Logo and Desktop Navigation */}
          <div className="flex items-center gap-8">
            <Link href="/" className="text-xl font-bold flex items-center gap-2">
              <Dumbbell className="h-6 w-6" />
              <span className="hidden sm:inline">GoodHealth</span>
            </Link>
            {user && (
              <div className="hidden lg:flex gap-6">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`text-sm font-medium transition-colors hover:text-primary ${
                      pathname === item.href
                        ? 'text-foreground'
                        : 'text-muted-foreground'
                    }`}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Right side: Theme Toggle, User Menu, Mobile Menu */}
          <div className="flex items-center gap-2">
            <ThemeToggle />

            {loading || signingOut ? (
              <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
            ) : user ? (
              <>
                {/* Desktop User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.user_metadata?.avatar_url} />
                        <AvatarFallback>
                          {user.email?.charAt(0).toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {user.user_metadata?.full_name || 'User'}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/profile">Profile</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/settings">Settings</Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleSignOut}
                      disabled={signingOut}
                      className="text-red-600 cursor-pointer"
                    >
                      {signingOut ? 'Signing out...' : 'Sign out'}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Mobile Menu */}
                <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                  <SheetTrigger asChild className="lg:hidden">
                    <Button variant="ghost" size="icon">
                      <Menu className="h-5 w-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                    <SheetHeader>
                      <SheetTitle className="flex items-center gap-2">
                        <Dumbbell className="h-5 w-5" />
                        GoodHealth
                      </SheetTitle>
                    </SheetHeader>
                    <div className="mt-6 flex flex-col gap-4">
                      {/* User Info */}
                      <div className="flex items-center gap-3 pb-4 border-b">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={user.user_metadata?.avatar_url} />
                          <AvatarFallback>
                            {user.email?.charAt(0).toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <p className="text-sm font-medium">
                            {user.user_metadata?.full_name || 'User'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {user.email}
                          </p>
                        </div>
                      </div>

                      {/* Navigation Links */}
                      <nav className="flex flex-col gap-2">
                        {navigation.map((item) => {
                          const Icon = item.icon
                          return (
                            <Link
                              key={item.name}
                              href={item.href}
                              onClick={() => setMobileMenuOpen(false)}
                              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent ${
                                pathname === item.href
                                  ? 'bg-accent text-accent-foreground'
                                  : 'text-muted-foreground'
                              }`}
                            >
                              <Icon className="h-5 w-5" />
                              {item.name}
                            </Link>
                          )
                        })}
                      </nav>

                      {/* Additional Links */}
                      <div className="border-t pt-4 flex flex-col gap-2">
                        <Link
                          href="/profile"
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent transition-colors"
                        >
                          Profile
                        </Link>
                        <Link
                          href="/settings"
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent transition-colors"
                        >
                          Settings
                        </Link>
                        <Button
                          variant="ghost"
                          onClick={handleSignOut}
                          disabled={signingOut}
                          className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                        >
                          {signingOut ? 'Signing out...' : 'Sign out'}
                        </Button>
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
              </>
            ) : (
              <div className="flex gap-2">
                <Button variant="ghost" asChild>
                  <Link href="/login">Sign in</Link>
                </Button>
                <Button asChild>
                  <Link href="/signup">Sign up</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
