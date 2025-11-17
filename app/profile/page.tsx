import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getUser } from '@/lib/auth/actions'
import { getWorkouts } from '@/lib/workouts/actions'
import { getGoals } from '@/lib/goals/actions'
import { redirect } from 'next/navigation'
import { ProfileEditForm } from '@/components/profile/profile-edit-form'

export const dynamic = 'force-dynamic'

export default async function ProfilePage() {
  const user = await getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch data for statistics
  const { workouts } = await getWorkouts()
  const { goals } = await getGoals()

  const totalWorkouts = workouts.length
  const totalGoals = goals.length

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Profile</h1>
        <p className="text-muted-foreground">
          Manage your account information
        </p>
      </div>

      {/* Profile Picture & Basic Info */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>Your account details and profile picture</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src={user.user_metadata?.avatar_url} />
              <AvatarFallback className="text-2xl">
                {user.email?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="text-lg font-semibold">
                {user.user_metadata?.full_name || 'User'}
              </h3>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>

          <ProfileEditForm user={user} />
        </CardContent>
      </Card>

      {/* Account Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Account Statistics</CardTitle>
          <CardDescription>Your activity on GoodHealth</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Member Since</p>
              <p className="text-2xl font-bold">
                {new Date(user.created_at || '').toLocaleDateString('en-US', {
                  month: 'short',
                  year: 'numeric'
                })}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Total Workouts</p>
              <p className="text-2xl font-bold">{totalWorkouts}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Total Goals</p>
              <p className="text-2xl font-bold">{totalGoals}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
