"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight, CalendarDays, Users, Trophy, Info } from 'lucide-react'
import UsernameDialog from "@/components/username-dialog"
import TopNav from "@/components/top-nav"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

export default function HomePage() {
  const supabase = getSupabaseBrowserClient()
  const [showDialog, setShowDialog] = useState(false)
  const [hasUsername, setHasUsername] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      const uid = data.user?.id
      if (!uid) return
      const { data: p } = await supabase.from("profiles").select("username").single()
      setHasUsername(Boolean(p?.username))
      if (!p?.username) setShowDialog(true)
    })
  }, [])

  return (
    <main className="min-h-[100dvh] bg-background text-foreground">
      <TopNav />
      <section className="container mx-auto px-4 py-10">
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="col-span-full">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="text-3xl">Connect the actors through movies</CardTitle>
                <CardDescription>
                  A social, competitive twist on film connections. Build the smartest path. Beat your friends. Own the day.
                </CardDescription>
              </div>
              <div className="flex gap-3">
                <Button asChild size="lg">
                  <Link href="/daily" className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4" />
                    Play Daily
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="secondary" size="lg">
                  <Link href="/how-to-play" className="flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    How to Play
                  </Link>
                </Button>
              </div>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" /> Friend Groups
              </CardTitle>
              <CardDescription>New round unlocks once everyone finishes.</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">{hasUsername ? "You're set." : "Choose a username to get started."}</div>
              <Button asChild>
                <Link href="/groups" className="flex items-center gap-2">
                  Open Groups <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" /> Leaderboards & Stats
              </CardTitle>
              <CardDescription>Track shortest paths and fastest solves globally and within your groups.</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-end">
              <Button asChild variant="outline">
                <Link href="/leaderboards" className="flex items-center gap-2">
                  View Leaderboards <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      <UsernameDialog open={showDialog} onOpenChange={setShowDialog} />
    </main>
  )
}
