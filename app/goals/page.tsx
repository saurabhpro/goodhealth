import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getUser } from '@/lib/auth/actions'
import { getGoals } from '@/lib/goals/actions'
import { redirect } from 'next/navigation'
import { GoalsCalendar } from '@/components/goals-calendar'

// Force dynamic rendering to prevent caching issues
export const dynamic = 'force-dynamic'

export default async function GoalsPage() {
  const user = await getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch goals from Supabase
  const { goals } = await getGoals()

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">My Goals</h1>
          <p className="text-muted-foreground">
            Track your fitness objectives on a timeline
          </p>
        </div>
        <Button asChild>
          <Link href="/goals/new">Create New Goal</Link>
        </Button>
      </div>

      {/* Goals Calendar View */}
      {goals.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <h3 className="text-lg font-semibold mb-2">No goals yet</h3>
              <p className="text-muted-foreground mb-6">
                Set your first fitness goal to stay motivated and track progress
              </p>
              <Button asChild>
                <Link href="/goals/new">Create Your First Goal</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <GoalsCalendar goals={goals} />
      )}
    </div>
  )
}
