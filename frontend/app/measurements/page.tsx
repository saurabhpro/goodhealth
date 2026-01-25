import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getUser } from '@/lib/auth/actions'
import { getMeasurements } from '@/lib/measurements/actions'
import { MeasurementsList } from '@/components/measurements-list'
import { MeasurementsChart } from '@/components/measurements-chart'

export const dynamic = 'force-dynamic'

export default async function MeasurementsPage() {
  const user = await getUser()

  if (!user) {
    redirect('/login')
  }

  const { measurements } = await getMeasurements()

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Body Measurements</h1>
            <p className="text-muted-foreground">
              Track your body composition and measurements over time
            </p>
          </div>
          <Button asChild>
            <Link href="/measurements/new">Add Measurement</Link>
          </Button>
        </div>
      </div>

      {measurements && measurements.length > 0 ? (
        <Tabs defaultValue="chart" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="chart">Progress Chart</TabsTrigger>
            <TabsTrigger value="list">All Measurements</TabsTrigger>
          </TabsList>

          <TabsContent value="chart" className="space-y-6">
            <MeasurementsChart measurements={measurements} />
            <div className="mt-8">
              <h2 className="text-2xl font-bold mb-4">Recent Measurements</h2>
              <MeasurementsList measurements={measurements.slice(0, 3)} />
            </div>
          </TabsContent>

          <TabsContent value="list">
            <MeasurementsList measurements={measurements} />
          </TabsContent>
        </Tabs>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>No measurements yet</CardTitle>
            <CardDescription>
              Start tracking your body measurements to monitor your progress over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/measurements/new">Add Your First Measurement</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
