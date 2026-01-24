import { redirect } from 'next/navigation'
import { getUser } from '@/lib/auth/actions'
import { MeasurementForm } from '@/components/measurement-form'
import { getLatestMeasurement } from '@/lib/measurements/actions'

export const dynamic = 'force-dynamic'

export default async function NewMeasurementPage() {
  const user = await getUser()

  if (!user) {
    redirect('/login')
  }

  // Get the latest measurement to pre-fill some fields
  const { measurement: latestMeasurement } = await getLatestMeasurement()

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Add Body Measurement</h1>
        <p className="text-muted-foreground">
          Record your body measurements to track your progress over time
        </p>
      </div>

      <MeasurementForm latestMeasurement={latestMeasurement} />
    </div>
  )
}
