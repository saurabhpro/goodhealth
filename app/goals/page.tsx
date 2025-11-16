import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getUser } from '@/lib/auth/actions'
import { getGoals } from '@/lib/goals/actions'
import { redirect } from 'next/navigation'

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
            Set and track your fitness objectives
          </p>
        </div>
        <Button asChild>
          <Link href="/goals/new">Create New Goal</Link>
        </Button>
      </div>

      {/* Goals Grid */}
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
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {goals.map((goal) => (
            <Card key={goal.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="mb-2">{goal.title}</CardTitle>
                    <CardDescription>{goal.description}</CardDescription>
                  </div>
                  {goal.achieved ? (
                    <Badge variant="default">Achieved</Badge>
                  ) : (
                    <Badge variant="secondary">In Progress</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Progress Bar */}
                  <div>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">
                        {goal.current_value} / {goal.target_value} {goal.unit}
                      </span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{
                          width: `${Math.min((goal.current_value / goal.target_value) * 100, 100)}%`
                        }}
                      />
                    </div>
                  </div>

                  {/* Target Date */}
                  {goal.target_date && (
                    <div className="text-sm text-muted-foreground">
                      Target: {new Date(goal.target_date).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
