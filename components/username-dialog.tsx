"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

export default function UsernameDialog({
  open = false,
  onOpenChange = () => {},
}: {
  open?: boolean
  onOpenChange?: (o: boolean) => void
}) {
  const supabase = getSupabaseBrowserClient()
  const [value, setValue] = React.useState("")
  const [userId, setUserId] = React.useState<string | null>(null)

  React.useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null)
    })
    if (open) {
      supabase.from("profiles").select("username").single().then(({ data }) => {
        setValue(data?.username ?? "")
      })
    }
  }, [open, supabase])

  async function save() {
    if (!userId || !value.trim()) return
    const { error } = await supabase.from("profiles").upsert({ id: userId, username: value.trim() })
    if (error) {
      alert(error.message)
      return
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Choose a username</DialogTitle>
          <DialogDescription>Friends can add you using this name.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-2 py-2">
          <Input
            autoFocus
            placeholder="e.g. cinephile_42"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            maxLength={24}
          />
          <div className="text-xs text-muted-foreground text-right">{value.length}/24</div>
        </div>
        <DialogFooter>
          <Button onClick={save} type="button" disabled={!value.trim()}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
