import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth/actions'

export const dynamic = 'force-dynamic'

export default async function DebugPage() {
  const user = await getUser()
  const supabase = await createClient()

  let workoutsData = null
  let workoutsError = null

  if (user) {
    const { data, error } = await supabase
      .from('workouts')
      .select('*')
      .eq('user_id', user.id)

    workoutsData = data
    workoutsError = error
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Debug Information</h1>

      <div className="space-y-4">
        <div className="p-4 border rounded">
          <h2 className="font-bold mb-2">User Info:</h2>
          <pre className="text-xs overflow-auto">
            {JSON.stringify({
              id: user?.id,
              email: user?.email,
            }, null, 2)}
          </pre>
        </div>

        <div className="p-4 border rounded">
          <h2 className="font-bold mb-2">Environment Variables:</h2>
          <pre className="text-xs">
            SUPABASE_URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✓ Set' : '✗ Missing'}
            {'\n'}SUPABASE_KEY: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✓ Set' : '✗ Missing'}
          </pre>
        </div>

        <div className="p-4 border rounded">
          <h2 className="font-bold mb-2">Workouts Query Result:</h2>
          {workoutsError ? (
            <div className="text-red-600">
              <p className="font-bold">Error:</p>
              <pre className="text-xs overflow-auto">{JSON.stringify(workoutsError, null, 2)}</pre>
            </div>
          ) : (
            <pre className="text-xs overflow-auto">
              Found {workoutsData?.length || 0} workouts
              {'\n\n'}
              {JSON.stringify(workoutsData, null, 2)}
            </pre>
          )}
        </div>
      </div>
    </div>
  )
}
