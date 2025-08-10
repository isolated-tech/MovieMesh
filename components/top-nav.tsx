"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Film, User, Wand2, LogOut } from 'lucide-react'
import UsernameDialog from "./username-dialog"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

export default function TopNav() {
  const supabase = getSupabaseBrowserClient()
  const [open, setOpen] = useState(false)
  const [username, setUsername] = useState<string | null>(null)
  const [authed, setAuthed] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      const u = data.user
      setAuthed(Boolean(u?.id))
      if (u?.id) {
        const { data: profile } = await supabase.from("profiles").select("username").single()
        setUsername(profile?.username ?? null)
      }
    })
    const { data: sub } = supabase.auth.onAuthStateChange(async (_e, session) => {
      const id = session?.user?.id
      setAuthed(Boolean(id))
      if (id) {
        const { data: profile } = await supabase.from("profiles").select("username").single()
        setUsername(profile?.username ?? null)
      } else {
        setUsername(null)
      }
    })
    return () => {
      sub.subscription.unsubscribe()
    }
  }, [supabase])

  async function signOut() {
    await supabase.auth.signOut()
  }

  return (
    <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <Film className="h-5 w-5" />
          Reel Relay
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm">
          <Link href="/daily" className="hover:underline underline-offset-4">
            Daily
          </Link>
          <Link href="/groups" className="hover:underline underline-offset-4">
            Groups
          </Link>
          <Link href="/leaderboards" className="hover:underline underline-offset-4">
            Leaderboards
          </Link>
          <Link href="/how-to-play" className="hover:underline underline-offset-4">
            How to Play
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          <Button asChild variant="secondary" size="sm" className="md:hidden">
            <Link href="/daily" className="flex items-center gap-1">
              <Wand2 className="h-4 w-4" /> Play
            </Link>
          </Button>
          {!authed ? (
            <Button asChild size="sm">
              <Link href="/auth">Sign in</Link>
            </Button>
          ) : (
            <>
              <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
                <User className="h-4 w-4 mr-1" />
                {username || "Set Username"}
              </Button>
              <Button variant="ghost" size="icon" onClick={signOut} title="Sign out">
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>
      <UsernameDialog open={open} onOpenChange={setOpen} />
    </header>
  )
}
