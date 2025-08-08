"use client"

import TopNav from "@/components/top-nav"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useEffect, useMemo, useState } from "react"
import { actorById } from "@/data/graph"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

type Row = {
  id: string
  username: string
  steps: number
  time_ms: number
  start_actor_id: string
  end_actor_id: string
  kind: "daily" | "group"
}

function usePersonName(id: string) {
  const [name, setName] = useState<string>(actorById(id)?.name || "")
  useEffect(() => {
    if (!name) {
      fetch(`/api/tmdb/person/${id}`).then(r => r.json()).then(d => setName(d?.name || id))
    }
  }, [id])
  return name || id
}

export default function LeaderboardsPage() {
  const supabase = getSupabaseBrowserClient()
  const [rows, setRows] = useState<Row[]>([])

  async function load() {
    const d = await supabase.from("daily_results_with_usernames").select("*").limit(50)
    const g = await supabase.from("group_results_with_usernames").select("*").limit(50)
    const dailyRows =
      d.data?.map((r: any) => ({
        id: `d-${r.date_key}-${r.user_id}`,
        username: r.username,
        steps: r.steps,
        time_ms: r.time_ms,
        start_actor_id: r.start_actor_id,
        end_actor_id: r.end_actor_id,
        kind: "daily" as const,
      })) ?? []
    const groupRows =
      g.data?.map((r: any) => ({
        id: `g-${r.id}`,
        username: r.username,
        steps: r.steps,
        time_ms: r.time_ms,
        start_actor_id: r.start_actor_id,
        end_actor_id: r.end_actor_id,
        kind: "group" as const,
      })) ?? []
    setRows([...dailyRows, ...groupRows])
  }

  useEffect(() => {
    load()
    // Realtime updates
    const chan = supabase
      .channel("leaderboards")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "daily_results" }, load)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "group_round_results" }, load)
      .subscribe()
    return () => {
      supabase.removeChannel(chan)
    }
  }, [])

  const top = useMemo(
    () =>
      [...rows].sort((a, b) => (a.steps === b.steps ? a.time_ms - b.time_ms : a.steps - b.steps)).slice(0, 20),
    [rows]
  )

  return (
    <main className="min-h-[100dvh] bg-background">
      <TopNav />
      <section className="container mx-auto px-4 py-8 grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Global Leaderboard</CardTitle>
            <CardDescription>Live, across Daily and Group games. Sorted by steps, then time.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kind</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Pair</TableHead>
                  <TableHead className="text-right">Steps</TableHead>
                  <TableHead className="text-right">Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {top.map((r) => {
                  const aName = usePersonName(r.start_actor_id)
                  const bName = usePersonName(r.end_actor_id)
                  return (
                    <TableRow key={r.id}>
                      <TableCell className="text-xs">{r.kind}</TableCell>
                      <TableCell>{r.username}</TableCell>
                      <TableCell className="text-sm">
                        {aName} → {bName}
                      </TableCell>
                      <TableCell className="text-right">{r.steps}</TableCell>
                      <TableCell className="text-right">{formatMs(r.time_ms)}</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>
    </main>
  )
}

function formatMs(ms: number) {
  const s = Math.floor(ms / 1000)
  const m = Math.floor(s / 60)
  const sec = s % 60
  const cs = Math.floor((ms % 1000) / 10)
  return `${m}:${sec.toString().padStart(2, "0")}.${cs.toString().padStart(2, "0")}`
}
