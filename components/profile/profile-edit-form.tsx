'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import type { User } from '@supabase/supabase-js'

interface ProfileEditFormProps {
  user: User
}

export function ProfileEditForm({ user }: ProfileEditFormProps) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [fullName, setFullName] = useState(user.user_metadata?.full_name || '')

  async function handleSave() {
    setSaving(true)

    // TODO: Update profile in Supabase
    console.log('Saving profile:', { fullName })

    // Simulate API call
    setTimeout(() => {
      setSaving(false)
      setEditing(false)
      toast.success('Profile updated!', {
        description: 'Your profile information has been saved successfully.'
      })
    }, 1000)
  }

  function handleCancel() {
    setEditing(false)
    setFullName(user.user_metadata?.full_name || '')
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
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          disabled={!editing || saving}
        />
      </div>

      <div className="flex gap-4 pt-4">
        {!editing ? (
          <Button onClick={() => setEditing(true)}>
            Edit Profile
          </Button>
        ) : (
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
        )}
      </div>
    </div>
  )
}
