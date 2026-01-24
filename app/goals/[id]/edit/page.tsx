import { redirect } from 'next/navigation'
import { getUser } from '@/lib/auth/actions'
import { createClient } from '@/lib/supabase/server'
import { GoalEditForm } from '@/components/goal-edit-form'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export default async function EditGoalPage({ params }: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = await params
  const user = await getUser()

  if (!user) {
    redirect('/login')
  }

  const supabase = await createClient()

  // Fetch the goal
  const { data: goal, error } = await supabase
    .from('goals')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

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
