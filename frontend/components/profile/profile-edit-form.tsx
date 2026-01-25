'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import type { User } from '@supabase/supabase-js'
import { getProfile, updateProfile, type ProfileData } from '@/lib/profile/actions'

interface ProfileEditFormProps {
  readonly user: User
}

export function ProfileEditForm({ user }: ProfileEditFormProps) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  const [formData, setFormData] = useState<ProfileData>({
    full_name: '',
    date_of_birth: '',
    gender: undefined,
    height_cm: undefined,
    fitness_level: undefined,
    medical_conditions: '',
    injuries: '',
  })

  useEffect(() => {
    let mounted = true

    async function loadProfile() {
      setLoading(true)
      const { profile, error } = await getProfile()

      if (!mounted) return

      if (error) {
        toast.error('Failed to load profile', { description: error })
      } else if (profile) {
        setFormData({
          full_name: profile.full_name || '',
          date_of_birth: profile.date_of_birth || '',
          gender: (profile.gender || undefined) as ProfileData['gender'],
          height_cm: profile.height_cm || undefined,
          fitness_level: (profile.fitness_level || undefined) as ProfileData['fitness_level'],
          medical_conditions: profile.medical_conditions || '',
          injuries: profile.injuries || '',
        })
      }
      setLoading(false)
    }

    loadProfile()

    return () => {
      mounted = false
    }
  }, [])

  async function handleSave() {
    setSaving(true)

    const { error } = await updateProfile(formData)

    if (error) {
      toast.error('Failed to update profile', { description: error })
    } else {
      toast.success('Profile updated!', {
        description: 'Your profile information has been saved successfully.'
      })
      setEditing(false)
    }

    setSaving(false)
  }

  function handleCancel() {
    setEditing(false)
    // Reload profile data on cancel
    setLoading(true)
    getProfile().then(({ profile, error }) => {
      if (error) {
        toast.error('Failed to reload profile', { description: error })
      } else if (profile) {
        setFormData({
          full_name: profile.full_name || '',
          date_of_birth: profile.date_of_birth || '',
          gender: (profile.gender || undefined) as ProfileData['gender'],
          height_cm: profile.height_cm || undefined,
          fitness_level: (profile.fitness_level || undefined) as ProfileData['fitness_level'],
          medical_conditions: profile.medical_conditions || '',
          injuries: profile.injuries || '',
        })
      }
      setLoading(false)
    })
  }

  if (loading) {
    return <div className="py-4">Loading profile...</div>
  }

  return (
    <div className="space-y-4 pt-4 border-t">
      <div className="space-y-2">
        <Label htmlFor="email">Email Address</Label>
        <Input
          id="email"
          type="email"
          value={user.email || ''}
          disabled
          className="bg-muted"
        />
        <p className="text-xs text-muted-foreground">
          Email cannot be changed
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="fullName">Full Name</Label>
        <Input
          id="fullName"
          value={formData.full_name}
          onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
          disabled={!editing || saving}
          placeholder="Enter your full name"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="dateOfBirth">Date of Birth</Label>
          <Input
            id="dateOfBirth"
            type="date"
            value={formData.date_of_birth}
            onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
            disabled={!editing || saving}
          />
          <p className="text-xs text-muted-foreground">
            Used for age-based recommendations
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="gender">Gender</Label>
          <Select
            value={formData.gender}
            onValueChange={(value) => setFormData({ ...formData, gender: value as ProfileData['gender'] })}
            disabled={!editing || saving}
          >
            <SelectTrigger id="gender">
              <SelectValue placeholder="Select gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
              <SelectItem value="other">Other</SelectItem>
              <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="height">Height (cm)</Label>
          <Input
            id="height"
            type="number"
            min="50"
            max="300"
            step="0.1"
            value={formData.height_cm || ''}
            onChange={(e) => setFormData({ ...formData, height_cm: e.target.value ? Number.parseFloat(e.target.value) : undefined })}
            disabled={!editing || saving}
            placeholder="e.g., 175"
          />
          <p className="text-xs text-muted-foreground">
            Used for BMI calculations
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="fitnessLevel">Fitness Level</Label>
          <Select
            value={formData.fitness_level}
            onValueChange={(value) => setFormData({ ...formData, fitness_level: value as ProfileData['fitness_level'] })}
            disabled={!editing || saving}
          >
            <SelectTrigger id="fitnessLevel">
              <SelectValue placeholder="Select fitness level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="beginner">Beginner</SelectItem>
              <SelectItem value="intermediate">Intermediate</SelectItem>
              <SelectItem value="advanced">Advanced</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="medicalConditions">Medical Conditions</Label>
        <Textarea
          id="medicalConditions"
          value={formData.medical_conditions}
          onChange={(e) => setFormData({ ...formData, medical_conditions: e.target.value })}
          disabled={!editing || saving}
          placeholder="List any medical conditions (e.g., asthma, diabetes, heart condition)"
          rows={3}
        />
        <p className="text-xs text-muted-foreground">
          AI will consider these when generating workout plans
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="injuries">Injuries</Label>
        <Textarea
          id="injuries"
          value={formData.injuries}
          onChange={(e) => setFormData({ ...formData, injuries: e.target.value })}
          disabled={!editing || saving}
          placeholder="List any past or current injuries (e.g., knee injury, lower back pain, rotator cuff)"
          rows={3}
        />
        <p className="text-xs text-muted-foreground">
          AI will avoid exercises that may aggravate these injuries
        </p>
      </div>

      <div className="flex gap-4 pt-4">
        {editing ? (
          <>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={saving}
            >
              Cancel
            </Button>
          </>
        ) : (
          <Button onClick={() => setEditing(true)}>
            Edit Profile
          </Button>
        )}
      </div>
    </div>
  )
}
