"use client"

import { useEffect, useMemo, useState } from "react"
import TopNav from "@/components/top-nav"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import ConnectGame, { type GameResult } from "@/components/game/connect-game"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

export default function DailyPage() {
  const supabase = getSupabaseBrowserClient()
  const [dateKey, setDateKey] = useState<string>("")
  const [existing, setExisting] = useState<GameResult | null>(null)
  const [authed, setAuthed] = useState(false)
  const [pair, setPair] = useState<{ startId: string; endId: string; startName: string; endName: string } | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setAuthed(Boolean(data.user?.id)))
  }, [])

  useEffect(() => {
    const today = new Date()
    const k = `${today.getUTCFullYear()}-${today.getUTCMonth() + 1}-${today.getUTCDate()}`
    setDateKey(k)
    fetch(`/api/tmdb/daily-pair?date=${k}`).then(r => r.json()).then((d) => {
      if (d?.start && d?.end) {
        setPair({ startId: d.start.id, endId: d.end.id, startName: d.start.name, endName: d.end.name })
      }
    }).catch(() => {
      // fallback: simple deterministic pair from local dataset
      setPair({ startId: "leo", endId: "zooey", startName: "Leonardo DiCaprio", endName: "Zooey Deschanel" })
    })
  }, [])

  useEffect(() => {
    if (!dateKey) return
    ;(async () => {
      const { data } = await supabase
        .from("daily_results")
        .select("*")
        .eq("date_key", dateKey)
        .maybeSingle()
      setExisting((data as any) ?? null)
    })()
  }, [dateKey])

  async function handleComplete(r: GameResult) {
    const payload = {
      date_key: dateKey,
      start_actor_id: r.startActorId,
      end_actor_id: r.endActorId,
      steps: r.steps,
      time_ms: r.timeMs,
      path: r.path,
      pretty_path: r.prettyPath,
    }
    const { error } = await supabase.from("daily_results").upsert(payload)
    if (error) alert(error.message)
    setExisting(r)
  }

  return (
    <main className="min-h-[100dvh] bg-background">
      <TopNav />
      <section className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Daily Challenge</CardTitle>
            <CardDescription className="flex flex-wrap gap-2 items-center">
              Connect{" "}
              <span className="bg-secondary text-white font-semibold px-2 py-1 rounded">
                {pair?.startName}
              </span>{" "}
              to{" "}
              <span className="bg-secondary text-white font-semibold px-2 py-1 rounded">
                {pair?.endName}
              </span>{" "}
              using shared movies and co-stars. One try per day. Sign in to save and join leaderboards.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!authed ? (
              <div className="text-sm text-muted-foreground">
                Please sign in to play today’s challenge and save your result.
              </div>
            ) : existing ? (
              <div className="text-sm">
                You already played today. Result: {existing.steps} steps in {formatMs(existing.timeMs)}.
                <div className="mt-2 text-muted-foreground">{existing.prettyPath}</div>
              </div>
            ) : (
              pair && (
                <ConnectGame
                  mode="daily"
                  dataSource="tmdb"
                  startActorId={pair.startId}
                  endActorId={pair.endId}
                  seed={dateKey}
                  onComplete={handleComplete}
                />
              )
            )}
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
