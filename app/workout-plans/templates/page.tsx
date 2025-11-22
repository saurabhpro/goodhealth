'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { Plus, ArrowLeft, MoreVertical, Edit, Trash2, Dumbbell, Clock, TrendingUp, Loader2 } from 'lucide-react'
import { getUserTemplates, deleteUserTemplate } from '@/lib/workout-plans/preferences-actions'
import type { UserWorkoutTemplate } from '@/types'

export default function WorkoutTemplatesPage() {
  const router = useRouter()
  const [templates, setTemplates] = useState<UserWorkoutTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [templateToDelete, setTemplateToDelete] = useState<UserWorkoutTemplate | null>(null)

  useEffect(() => {
    loadTemplates()
  }, [])

  async function loadTemplates() {
    try {
      const { templates: data, error } = await getUserTemplates({ isActive: true })

      if (error) {
        toast.error('Failed to load templates', { description: error })
        return
      }

      setTemplates(data || [])
    } catch (error) {
      toast.error('Failed to load templates')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!templateToDelete) return

    try {
      const { error } = await deleteUserTemplate(templateToDelete.id)

      if (error) {
        toast.error('Failed to delete template', { description: error })
        return
      }

      toast.success('Template deleted successfully')
      setTemplates(templates.filter(t => t.id !== templateToDelete.id))
      setDeleteDialogOpen(false)
      setTemplateToDelete(null)
    } catch (error) {
      toast.error('Failed to delete template')
    }
  }

  function confirmDelete(template: UserWorkoutTemplate) {
    setTemplateToDelete(template)
    setDeleteDialogOpen(true)
  }

  if (loading) {
    return (
      <div className="container mx-auto max-w-6xl py-8 px-4">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-6xl py-8 px-4">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Button variant="ghost" size="sm" asChild className="mb-4">
            <Link href="/workout-plans">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Workout Plans
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">My Workout Templates</h1>
          <p className="text-muted-foreground mt-2">
            Create and manage your custom workout templates
          </p>
        </div>
        <Button asChild>
          <Link href="/workout-plans/templates/new">
            <Plus className="mr-2 h-4 w-4" />
            New Template
          </Link>
        </Button>
      </div>

      {/* Templates Grid */}
      {templates.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Dumbbell className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No templates yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create your first workout template to get started
            </p>
            <Button asChild>
              <Link href="/workout-plans/templates/new">
                <Plus className="mr-2 h-4 w-4" />
                Create Template
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => {
            const exercises = Array.isArray(template.exercises) ? template.exercises : []
            const exerciseCount = exercises.length

            return (
              <Card key={template.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg line-clamp-1">{template.name}</CardTitle>
                      {template.description && (
                        <CardDescription className="line-clamp-2 mt-1">
                          {template.description}
                        </CardDescription>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => router.push(`/workout-plans/templates/${template.id}/edit`)}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => confirmDelete(template)}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* Badges */}
                    <div className="flex flex-wrap gap-2">
                      {template.workout_type && (
                        <Badge variant="secondary">{template.workout_type}</Badge>
                      )}
                      {template.intensity_level && (
                        <Badge variant="outline">{template.intensity_level}</Badge>
                      )}
                      {template.difficulty_level && (
                        <Badge variant="outline">{template.difficulty_level}</Badge>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Dumbbell className="h-4 w-4" />
                        <span>{exerciseCount} exercises</span>
                      </div>
                      {template.estimated_duration && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>{template.estimated_duration} min</span>
                        </div>
                      )}
                      {template.times_used !== null && template.times_used !== undefined && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <TrendingUp className="h-4 w-4" />
                          <span>Used {template.times_used}x</span>
                        </div>
                      )}
                    </div>

                    {/* Action Button */}
                    <Button
                      variant="outline"
                      className="w-full"
                      size="sm"
                      onClick={() => router.push(`/workout-plans/templates/${template.id}`)}
                    >
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{templateToDelete?.name}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
