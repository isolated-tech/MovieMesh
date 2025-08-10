"use client"

import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import SearchCombobox, { type SearchItem } from "./search-combobox"
import {
  actorById,
  movieById,
  neighborsForActor,
  neighborsForMovie,
  isAdjacentActorToMovie,
  isAdjacentMovieToActor,
  shortestPathBetweenActors,
} from "@/data/graph"
import { Undo2, RotateCcw, Send, Timer, Sparkles } from 'lucide-react'
import { Separator } from "@/components/ui/separator"

export type GameMode = "daily" | "group" | "practice"
export type GameResult = {
  steps: number
  timeMs: number
  path: string[] // node ids
  prettyPath: string
  startActorId: string
  endActorId: string
  seed: string
  mode: GameMode
}

export default function ConnectGame({
  mode = "practice",
  startActorId = "leo",
  endActorId = "zooey",
  seed = "demo",
  dataSource = "local",
  onComplete = () => {},
}: {
  mode?: GameMode
  startActorId?: string
  endActorId?: string
  seed?: string
  dataSource?: "local" | "tmdb"
  onComplete?: (result: GameResult) => void
}) {
  const nameCache = React.useRef(new Map<string, string>()) // id -> name/title
  interface Credit {
    id: string | number
    name?: string
    title?: string
  }
  const creditCache = React.useRef(new Map<string, Credit[]>()) // id -> neighbors
  const [, setTick] = React.useState(0)

  const startActor = actorById(startActorId)

  const [path, setPath] = React.useState<string[]>([startActorId]) // alternates actor->movie->actor...
  const [running, setRunning] = React.useState(false)
  const [startAt, setStartAt] = React.useState<number | null>(null)
  const [elapsed, setElapsed] = React.useState(0)
  const [submitted, setSubmitted] = React.useState<GameResult | null>(null)

  const expectType: "movie" | "actor" = path.length % 2 === 1 ? "movie" : "actor"
  const lastId = path[path.length - 1]

  React.useEffect(() => {
    if (!running) return
    const t = setInterval(() => {
      setElapsed((e) => {
        const now = Date.now()
        return startAt ? now - startAt : e
      })
    }, 50)
    return () => clearInterval(t)
  }, [running, startAt])

  async function getActorName(id: string) {
    if (dataSource === "local") return actorById(id)?.name || id
    const key = `person:${id}`
    if (nameCache.current.has(key)) return nameCache.current.get(key)!
    const res = await fetch(`/api/tmdb/person/${id}`)
    const json = await res.json()
    const name = json.name || id
    nameCache.current.set(key, name)
    return name
  }
  async function getMovieTitle(id: string) {
    if (dataSource === "local") return movieById(id)?.title || id
    const key = `movie:${id}`
    if (nameCache.current.has(key)) return nameCache.current.get(key)!
    const res = await fetch(`/api/tmdb/movie/${id}`)
    const json = await res.json()
    const title = json.title || id
    nameCache.current.set(key, title)
    return title
  }

  function availableItems(): SearchItem[] {
    if (dataSource === "local") {
      if (expectType === "movie") {
        return neighborsForActor(lastId).map((m) => ({ id: m.id, label: m.title, meta: "Movie" }))
      }
      return neighborsForMovie(lastId).map((a) => ({ id: a.id, label: a.name, meta: "Actor" }))
    } else {
      // TMDB
      // Use cached credits to avoid repeated calls
      if (expectType === "movie") {
        const cacheKey = `person:${lastId}:movies`
        const cached = creditCache.current.get(cacheKey)
        if (!cached) {
          // Kick off fetch in background; UI will re-render when state changes via setTick
          fetch(`/api/tmdb/person/${lastId}/credits`).then(async (r) => {
            const j = await r.json()
            creditCache.current.set(cacheKey, j.results || [])
            setTick((t) => t + 1)
          })
          return []
        }
        return (cached as Credit[]).map((m) => ({ id: String(m.id), label: m.title || "", meta: "Movie" }))
      } else {
        const cacheKey = `movie:${lastId}:cast`
        const cached = creditCache.current.get(cacheKey)
        if (!cached) {
          fetch(`/api/tmdb/movie/${lastId}/credits`).then(async (r) => {
            const j = await r.json()
            creditCache.current.set(cacheKey, j.results || [])
            setTick((t) => t + 1)
          })
          return []
        }
        return (cached as Credit[]).map((a) => ({ id: String(a.id), label: a.name || "", meta: "Actor" }))
      }
    }
  }

  function addNode(nextId: string) {
    if (!running) {
      setRunning(true)
      setStartAt(Date.now())
    }
    const nextType = expectType
    // Validate adjacency
    if (dataSource === "local") {
      // Validate adjacency
      if (nextType === "movie") {
        if (!isAdjacentMovieToActor(nextId, lastId)) return
      } else {
        if (!isAdjacentActorToMovie(nextId, lastId)) return
      }
    } else {
      if (nextType === "movie") {
        const cacheKey = `person:${lastId}:movies`
        const list = (creditCache.current.get(cacheKey) || []) as Credit[]
        if (!list.find((m) => String(m.id) === String(nextId))) return
      } else {
        const cacheKey = `movie:${lastId}:cast`
        const list = (creditCache.current.get(cacheKey) || []) as Credit[]
        if (!list.find((a) => String(a.id) === String(nextId))) return
      }
    }
    // Avoid repeats
    if (path.includes(nextId)) return
    const newPath = [...path, nextId]
    setPath(newPath)
  }

  function undo() {
    if (path.length > 1) setPath(path.slice(0, -1))
  }

  function reset() {
    setPath([startActorId])
    setRunning(false)
    setStartAt(null)
    setElapsed(0)
    setSubmitted(null)
  }

  const canSubmit = path.length >= 3 && expectType === "movie" && path[path.length - 1] === endActorId

  async function finish() {
    if (!canSubmit) return
    setRunning(false)
    const ms = elapsed
    const pretty = await toPrettyPathAsync(path)
    const result: GameResult = {
      steps: path.length - 1, // edges
      timeMs: ms,
      path,
      prettyPath: pretty,
      startActorId,
      endActorId,
      seed,
      mode,
    }
    setSubmitted(result)
    persistResult(result)
    onComplete(result)
  }

  const sp = React.useMemo(() => {
    if (dataSource === "local") {
      return shortestPathBetweenActors(startActorId, endActorId)
    }
    return null
  }, [startActorId, endActorId, dataSource])

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <Badge variant="secondary" className="font-semibold">{startActor?.name}</Badge>
        <span>→</span>
        <Badge variant="secondary" className="font-semibold">{actorById(endActorId)?.name}</Badge>
        <Separator className="mx-2 h-5" orientation="vertical" />
        <span className="inline-flex items-center gap-1 text-muted-foreground">
          <Timer className="h-4 w-4" />
          {formatMs(elapsed)}
        </span>
        {sp && (
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Sparkles className="h-3 w-3" /> Shortest known: {sp.path.length - 1} steps
          </span>
        )}
      </div>

      <div className="grid gap-3">
        <PathViewer ids={path} endActorId={endActorId} dataSource={dataSource} getActorName={getActorName} getMovieTitle={getMovieTitle} />
        <div className="grid sm:grid-cols-[1fr_auto_auto_auto] gap-2">
          <SearchCombobox
            items={availableItems()}
            buttonLabel={expectType === "movie" ? "Choose a movie..." : "Choose an actor..."}
            placeholder="Type to search…"
            onSelect={(item) => addNode(item.id)}
          />
          <Button variant="secondary" onClick={undo} type="button" disabled={path.length <= 1} className="shrink-0">
            <Undo2 className="h-4 w-4 mr-2" />
            Undo
          </Button>
          <Button variant="outline" onClick={reset} type="button" className="shrink-0">
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button onClick={() => finish()} disabled={!canSubmit} className="shrink-0">
            <Send className="h-4 w-4 mr-2" />
            Submit
          </Button>
        </div>
      </div>

      {submitted && (
        <Card className="border-green-600/30">
          <CardContent className="pt-4 space-y-2">
            <div className="font-medium">Nice! You finished.</div>
            <div className="text-sm text-muted-foreground">
              Time {formatMs(submitted.timeMs)} • Steps {submitted.steps}{" "}
              {sp && (
                <span className="ml-2">
                  (Shortest path is {sp.path.length - 1}{submitted.steps === sp.path.length - 1 ? " — you matched it!" : ""})
                </span>
              )}
            </div>
            <div className="text-sm break-words">{submitted.prettyPath}</div>
            <div className="flex gap-2 pt-2">
              <Button variant="secondary" size="sm" type="button" onClick={() => copySummary(submitted)}>
                Copy summary
              </Button>
              <Button variant="outline" size="sm" type="button" onClick={reset}>
                Try again
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function PathViewer({ ids = [], endActorId = "", dataSource, getActorName, getMovieTitle }:{
  ids?: string[]
  endActorId?: string
  dataSource: "local" | "tmdb"
  getActorName: (id: string) => Promise<string>
  getMovieTitle: (id: string) => Promise<string>
}) {
  const [labels, setLabels] = React.useState<string[]>([])
  React.useEffect(() => {
    let cancelled = false
    ;(async () => {
      const arr: string[] = []
      for (let i = 0; i < ids.length; i++) {
        const id = ids[i]
        if (i % 2 === 0) {
          arr.push(dataSource === "local" ? (actorById(id)?.name || id) : await getActorName(id))
        } else {
          arr.push(dataSource === "local" ? (movieById(id)?.title || id) : await getMovieTitle(id))
        }
      }
      if (!cancelled) setLabels(arr)
    })()
    return () => { cancelled = true }
  }, [ids, dataSource, getActorName, getMovieTitle])
  const [endName, setEndName] = React.useState("")
  React.useEffect(() => {
    let c = false
    ;(async () => {
      const n = dataSource === "local" ? (actorById(endActorId)?.name || endActorId) : await getActorName(endActorId)
      if (!c) setEndName(n)
    })()
    return () => { c = true }
  }, [endActorId, dataSource, getActorName])
  return (
    <div className="flex flex-wrap items-center gap-2">
      {labels.map((label, idx) => (
        <React.Fragment key={`${ids[idx]}-${idx}`}>
          <Badge variant={idx % 2 === 0 ? "default" : "outline"}>{label}</Badge>
          {idx < labels.length - 1 && <span className="text-muted-foreground">→</span>}
        </React.Fragment>
      ))}
      {ids[ids.length - 1] !== endActorId && (
        <>
          <span className="text-muted-foreground">→</span>
          <Badge variant="secondary">{endName}</Badge>
        </>
      )}
    </div>
  )
}

async function toPrettyPathAsync(ids: string[]) {
  const parts: string[] = []
  for (let i = 0; i < ids.length; i++) {
    if (i % 2 === 0) {
      // Actor
      const res = await fetch(`/api/tmdb/person/${ids[i]}`).then(r => r.json())
      parts.push(res.name || ids[i])
    } else {
      // Movie
      const res = await fetch(`/api/tmdb/movie/${ids[i]}`).then(r => r.json())
      parts.push(res.title || ids[i])
    }
  }
  return parts.join(" → ")
}


function persistResult(r: GameResult) {
  if (r.mode === "daily") {
    const all = JSON.parse(localStorage.getItem("reely:dailyResults") || "{}") as Record<string, GameResult & { dateKey?: string }>
    // Use seed as date key for demo
    all[r.seed] = r
    localStorage.setItem("reely:dailyResults", JSON.stringify(all))
  }
}

function copySummary(r: GameResult) {
  const a = actorById(r.startActorId)?.name
  const b = actorById(r.endActorId)?.name
  const text = `Reel Relay ${r.mode} • ${a} → ${b}\n${r.steps} steps • ${formatMs(r.timeMs)}\n${r.prettyPath}`
  navigator.clipboard.writeText(text)
}

function formatMs(ms: number) {
  const s = Math.floor(ms / 1000)
  const m = Math.floor(s / 60)
  const sec = s % 60
  const cs = Math.floor((ms % 1000) / 10)
  return `${m}:${sec.toString().padStart(2, "0")}.${cs.toString().padStart(2, "0")}`
}
