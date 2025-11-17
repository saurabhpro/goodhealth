'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { Camera, Trash2, Edit2, Save, X } from 'lucide-react'
import { getWorkoutSelfies, getSelfieUrl, deleteWorkoutSelfie, updateSelfieCaption } from '@/lib/selfies/actions'
import { SelfieUpload } from './selfie-upload'
import type { Database } from '@/types/database'

type WorkoutSelfie = Database['public']['Tables']['workout_selfies']['Row']

interface WorkoutSelfieDisplayProps {
  workoutId: string
}

interface SelfieWithUrl extends WorkoutSelfie {
  signedUrl?: string
}

export function WorkoutSelfieDisplay({ workoutId }: WorkoutSelfieDisplayProps) {
  const [selfie, setSelfie] = useState<SelfieWithUrl | null>(null)
  const [loading, setLoading] = useState(true)
  const [showUpload, setShowUpload] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editCaption, setEditCaption] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [reloadTrigger, setReloadTrigger] = useState(0)

  // Function to trigger reload
  const reloadSelfie = () => {
    setReloadTrigger(prev => prev + 1)
  }

  useEffect(() => {
    let cancelled = false

    const loadSelfie = async () => {
      setLoading(true)
      const { selfies, error } = await getWorkoutSelfies(workoutId)

      if (cancelled) return

      if (error) {
        console.error('Failed to load selfie:', error)
        setLoading(false)
        return
      }

      // Get only the first selfie (one per workout)
      if (selfies && selfies.length > 0) {
        const firstSelfie = selfies[0]
        const { url } = await getSelfieUrl(firstSelfie.file_path)

        if (!cancelled) {
          setSelfie({ ...firstSelfie, signedUrl: url || undefined })
          setShowUpload(false)
        }
      } else if (!cancelled) {
        setSelfie(null)
        setShowUpload(false)
      }

      if (!cancelled) {
        setLoading(false)
      }
    }

    loadSelfie()

    return () => {
      cancelled = true
    }
  }, [workoutId, reloadTrigger])

  const handleDelete = async () => {
    if (!selfie) return
    if (!confirm('Are you sure you want to delete this selfie?')) return

    setDeleting(true)

    const result = await deleteWorkoutSelfie(selfie.id)

    if (result.error) {
      toast.error('Failed to delete selfie', {
        description: result.error,
      })
    } else {
      toast.success('Selfie deleted')
      setSelfie(null)
      setShowUpload(false)
    }

    setDeleting(false)
  }

  const handleEditStart = () => {
    setEditing(true)
    setEditCaption(selfie?.caption || '')
  }

  const handleEditCancel = () => {
    setEditing(false)
    setEditCaption('')
  }

  const handleEditSave = async () => {
    if (!selfie) return

    const result = await updateSelfieCaption(selfie.id, editCaption)

    if (result.error) {
      toast.error('Failed to update caption', {
        description: result.error,
      })
    } else {
      toast.success('Caption updated')
      setSelfie({ ...selfie, caption: editCaption })
      setEditing(false)
      setEditCaption('')
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Workout Selfie
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 bg-muted rounded-lg animate-pulse">
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // If there's a selfie, display it
  if (selfie && !showUpload) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Workout Selfie
            </CardTitle>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleEditStart}
                disabled={deleting}
              >
                <Edit2 className="h-4 w-4 mr-1" />
                Edit
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {selfie.signedUrl ? (
            <div className="relative w-full overflow-hidden rounded-lg bg-muted">
              <Image
                src={selfie.signedUrl}
                alt={selfie.caption || 'Workout selfie'}
                width={1200}
                height={600}
                className="w-full h-auto max-h-[600px] object-contain"
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Image unavailable</p>
            </div>
          )}

          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">
              Taken on {new Date(selfie.taken_at).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>

            {editing ? (
              <div className="space-y-3">
                <Textarea
                  value={editCaption}
                  onChange={(e) => setEditCaption(e.target.value)}
                  placeholder="Add a caption..."
                  rows={3}
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="default"
                    onClick={handleEditSave}
                    className="flex-1"
                  >
                    <Save className="h-4 w-4 mr-1" />
                    Save Caption
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleEditCancel}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              selfie.caption && (
                <div className="pt-2 border-t">
                  <p className="text-sm">{selfie.caption}</p>
                </div>
              )
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  // If no selfie and upload is shown
  if (showUpload) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Add Workout Selfie
            </CardTitle>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowUpload(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <SelfieUpload
            workoutId={workoutId}
            onUploadComplete={() => {
              reloadSelfie()
              setShowUpload(false)
            }}
            variant="default"
          />
        </CardContent>
      </Card>
    )
  }

  // If no selfie, show add button
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          Workout Selfie
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center h-48 bg-muted/50 rounded-lg border-2 border-dashed">
            <div className="space-y-2">
              <Camera className="h-12 w-12 mx-auto text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No selfie added yet</p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => setShowUpload(true)}
            className="w-full"
          >
            <Camera className="h-4 w-4 mr-2" />
            Add Workout Selfie
          </Button>
          <p className="text-xs text-muted-foreground">
            Track your progress with a photo!
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
