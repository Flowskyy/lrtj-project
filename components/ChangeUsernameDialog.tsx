"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"

interface ChangeUsernameDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onUsernameChanged: () => void
}

export default function ChangeUsernameDialog({ open, onOpenChange, onUsernameChanged }: ChangeUsernameDialogProps) {
  const [newUsername, setNewUsername] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!newUsername.trim()) {
      setError("Username is required")
      return
    }

    if (newUsername.length < 3) {
      setError("Username must be at least 3 characters")
      return
    }

    setIsSubmitting(true)

    try {
      const res = await fetch('/api/user/change-username', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: newUsername })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to change username')
        return
      }

      onUsernameChanged()
      onOpenChange(false)
      setNewUsername("")
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Change Username</DialogTitle>
          <DialogDescription>
            Enter your new username. This will be displayed across the application.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="username">New Username</Label>
              <Input
                id="username"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                placeholder="Enter new username"
                disabled={isSubmitting}
              />
              {error && <p className="text-sm text-red-600">{error}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Change Username
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
