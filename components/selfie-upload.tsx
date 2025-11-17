'use client'

import { useState, useRef, ChangeEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'
import { Camera, X, Upload, Image as ImageIcon } from 'lucide-react'
import { uploadWorkoutSelfie } from '@/lib/selfies/actions'

interface SelfieUploadProps {
  workoutId: string
  onUploadComplete?: () => void
  variant?: 'default' | 'compact'
}

export function SelfieUpload({ workoutId, onUploadComplete, variant = 'default' }: SelfieUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [caption, setCaption] = useState('')
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic']
    if (!validTypes.includes(file.type)) {
      toast.error('Invalid file type', {
        description: 'Please select a JPEG, PNG, WebP, or HEIC image.',
      })
      return
    }

    // Validate file size (5MB)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      toast.error('File too large', {
        description: 'Please select an image smaller than 5MB.',
      })
      return
    }

    setSelectedFile(file)

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleClearFile = () => {
    setSelectedFile(null)
    setPreviewUrl(null)
    setCaption('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('No file selected', {
        description: 'Please select an image to upload.',
      })
      return
    }

    setUploading(true)

    try {
      const result = await uploadWorkoutSelfie(workoutId, selectedFile, caption)

      if (result.error) {
        toast.error('Upload failed', {
          description: result.error,
        })
      } else {
        toast.success('Selfie uploaded!', {
          description: 'Your workout selfie has been saved.',
        })
        handleClearFile()
        onUploadComplete?.()
      }
    } catch (error) {
      toast.error('Upload failed', {
        description: 'An unexpected error occurred.',
      })
    } finally {
      setUploading(false)
    }
  }

  const handleCameraClick = () => {
    fileInputRef.current?.click()
  }

  if (variant === 'compact') {
    return (
      <div className="space-y-4">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic"
          onChange={handleFileSelect}
          className="hidden"
          capture="environment"
        />

        {!selectedFile ? (
          <Button
            type="button"
            variant="outline"
            onClick={handleCameraClick}
            className="w-full"
            disabled={uploading}
          >
            <Camera className="mr-2 h-4 w-4" />
            Add Workout Selfie
          </Button>
        ) : (
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="relative">
                {previewUrl && (
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-48 object-cover rounded-lg"
                  />
                )}
                <button
                  type="button"
                  onClick={handleClearFile}
                  className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90"
                  disabled={uploading}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="caption">Caption (optional)</Label>
                <Textarea
                  id="caption"
                  placeholder="How are you feeling? Add a note..."
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  disabled={uploading}
                  rows={2}
                />
              </div>

              <Button
                type="button"
                onClick={handleUpload}
                disabled={uploading}
                className="w-full"
              >
                <Upload className="mr-2 h-4 w-4" />
                {uploading ? 'Uploading...' : 'Upload Selfie'}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic"
        onChange={handleFileSelect}
        className="hidden"
        capture="environment"
      />

      {!selectedFile ? (
        <div className="space-y-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleCameraClick}
            className="w-full h-32 border-2 border-dashed"
            disabled={uploading}
          >
            <div className="flex flex-col items-center gap-2">
              <ImageIcon className="h-8 w-8 text-muted-foreground" />
              <span className="text-sm font-medium">Click to select photo</span>
              <span className="text-xs text-muted-foreground">
                JPEG, PNG, WebP, or HEIC (max 5MB)
              </span>
            </div>
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="relative">
            {previewUrl && (
              <img
                src={previewUrl}
                alt="Preview"
                className="w-full h-64 object-cover rounded-lg"
              />
            )}
            <button
              type="button"
              onClick={handleClearFile}
              className="absolute top-2 right-2 p-2 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90"
              disabled={uploading}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="caption-full">Caption (optional)</Label>
            <Textarea
              id="caption-full"
              placeholder="How are you feeling? Add a note about your progress..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              disabled={uploading}
              rows={3}
            />
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              onClick={handleUpload}
              disabled={uploading}
              className="flex-1"
            >
              <Upload className="mr-2 h-4 w-4" />
              {uploading ? 'Uploading...' : 'Upload Selfie'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleClearFile}
              disabled={uploading}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
