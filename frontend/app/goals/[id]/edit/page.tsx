import { redirect } from 'next/navigation'
import { getUser } from '@/lib/auth/actions'
import { getGoal } from '@/lib/goals/actions'
import { GoalEditForm } from '@/components/goal-edit-form'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export default async function EditGoalPage({ params }: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = await params
  const user = await getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch the goal via Python backend
  const { goal, error } = await getGoal(id)

  if (error || !goal) {
    redirect('/goals')
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Edit Goal</h1>
        <p className="text-muted-foreground">
          Update your fitness goal details
        </p>
      </div>

      <GoalEditForm goal={goal} />
    </div>
  )
}
