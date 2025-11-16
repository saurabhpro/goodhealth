import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getUser } from '@/lib/auth/actions'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const user = await getUser()

  if (!user) {
    redirect('/login')
  }

  const stats = [
    {
      title: 'Total Workouts',
      value: '0',
      description: 'Workouts logged this month',
    },
    {
      title: 'Active Goals',
      value: '0',
      description: 'Goals in progress',
    },
    {
      title: 'Current Streak',
      value: '0',
      description: 'Days in a row',
    },
    {
      title: 'Total Exercises',
      value: '0',
      description: 'Exercises completed',
    },
  ]

  const quickActions = [
    {
      title: 'Log Workout',
      description: 'Record your latest workout session',
      href: '/workouts/new',
      variant: 'default' as const,
    },
    {
      title: 'View Progress',
      description: 'Check your fitness progress',
      href: '/progress',
      variant: 'outline' as const,
    },
    {
      title: 'Set New Goal',
      description: 'Create a new fitness goal',
      href: '/goals/new',
      variant: 'outline' as const,
    },
  ]

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          Welcome back, {user.user_metadata?.full_name || user.email?.split('@')[0] || 'there'}!
        </h1>
        <p className="text-muted-foreground">
          Here's an overview of your fitness journey
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="pb-2">
              <CardDescription>{stat.title}</CardDescription>
              <CardTitle className="text-3xl">{stat.value}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Quick Actions</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {quickActions.map((action) => (
            <Card key={action.title}>
              <CardHeader>
                <CardTitle>{action.title}</CardTitle>
                <CardDescription>{action.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant={action.variant} className="w-full" asChild>
                  <Link href={action.href}>Get Started</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Recent Activity</h2>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8 text-muted-foreground">
              <p className="mb-4">No recent activity yet</p>
              <Button asChild>
                <Link href="/workouts/new">Log Your First Workout</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
