import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export default function Home() {
  const features = [
    {
      title: 'Track Workouts',
      description: 'Log your exercises, sets, reps, and weights with ease',
    },
    {
      title: 'Visualize Progress',
      description: 'See your gains with beautiful charts and analytics',
    },
    {
      title: 'Set Goals',
      description: 'Create and track fitness goals to stay motivated',
    },
    {
      title: 'Share & Connect',
      description: 'Share your achievements with the community',
    },
  ]

  return (
    <div className="flex min-h-screen flex-col">
      {/* Hero Section */}
      <section className="flex flex-1 items-center justify-center px-4 py-20">
        <div className="container mx-auto max-w-5xl text-center">
          <h1 className="mb-6 text-5xl font-bold tracking-tight sm:text-6xl md:text-7xl">
            Track Your Fitness Journey
          </h1>
          <p className="mb-8 text-lg text-muted-foreground sm:text-xl md:text-2xl">
            Log workouts, visualize progress, and achieve your fitness goals with GoodHealth
          </p>
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Button size="lg" asChild>
              <Link href="/signup">Get Started Free</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/login">Sign In</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="border-t bg-muted/50 px-4 py-20">
        <div className="container mx-auto max-w-6xl">
          <h2 className="mb-12 text-center text-3xl font-bold sm:text-4xl">
            Everything You Need to Succeed
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <Card key={feature.title}>
                <CardContent className="pt-6">
                  <h3 className="mb-2 text-xl font-semibold">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t px-4 py-20">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="mb-4 text-3xl font-bold sm:text-4xl">
            Ready to Transform Your Fitness?
          </h2>
          <p className="mb-8 text-lg text-muted-foreground">
            Join thousands of users tracking their progress and achieving their goals
          </p>
          <Button size="lg" asChild>
            <Link href="/signup">Start Your Journey Today</Link>
          </Button>
        </div>
      </section>
    </div>
  )
}
