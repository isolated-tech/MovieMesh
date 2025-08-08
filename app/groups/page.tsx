"use client"

import { useEffect, useMemo, useState } from "react"
import TopNav from "@/components/top-nav"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Users, Play, Plus, ArrowRight } from 'lucide-react'
import ConnectGame, { type GameResult } from "@/components/game/connect-game"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

type Group = {
  id: string
  name: string
  owner_id: string
}

type GroupRound = {
  id: string
  group_id: string
  index: number
  start_actor_id: string
  end_actor_id: string
  created_at: string
}

export default function GroupsPage() {
  const supabase = getSupabaseBrowserClient()
  const [authed, setAuthed] = useState(false)
  const [username, setUsername] = useState<string>("")
  const [userId, setUserId] = useState<string>("")

  const [groups, setGroups] = useState<Group[]>([])
  const [memberships, setMemberships] = useState<Record<string, string[]>>({}) // group_id -> usernames
  const [selectedId, setSelectedId] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      const u = data.user
      setAuthed(Boolean(u?.id))
      if (!u?.id) return
      setUserId(u.id)
      const { data: p } = await supabase.from("profiles").select("username").single()
      setUsername(p?.username ?? "")
      await loadGroups()
    })
  }, [])

  async function loadGroups() {
    const { data: rows } = await supabase.from("group_members").select("group_id, groups(id, name, owner_id), profiles(username)")
    const gs: Group[] = []
    const mem: Record<string, string[]> = {}
    rows?.forEach((r: any) => {
      const g = r.groups as Group
      if (!gs.find((x) => x.id === g.id)) gs.push(g)
      if (!mem[g.id]) mem[g.id] = []
      mem[g.id].push(r.profiles?.username ?? "user")
    })
    setGroups(gs.sort((a, b) => a.name.localeCompare(b.name)))
    setMemberships(mem)
  }

  const selected = useMemo(() => groups.find((g) => g.id === selectedId) || null, [groups, selectedId])

  const [newGroupName, setNewGroupName] = useState("")

  async function createGroup() {
    if (!newGroupName.trim()) return
    const { data: g, error } = await supabase.from("groups").insert({ name: newGroupName.trim() }).select().single()
    if (error) return alert(error.message)
    await supabase.from("group_members").insert({ group_id: g.id })
    // Create first round
    const res = await fetch("/api/tmdb/random-pair")
    const pair = await res.json()
    await supabase.from("group_rounds").insert({
      group_id: g.id,
      index: 1,
      start_actor_id: pair.start.id,
      end_actor_id: pair.end.id,
    })
    setNewGroupName("")
    await loadGroups()
    setSelectedId(g.id)
  }

  const [memberInput, setMemberInput] = useState("")

  async function addMember(name: string) {
    if (!selected) return
    const trimmed = name.trim()
    if (!trimmed) return
    const { data: user } = await supabase.from("profiles").select("id").eq("username", trimmed).maybeSingle()
    if (!user?.id) {
      alert("No user with that username.")
      return
    }
    const { error } = await supabase.from("group_members").insert({ group_id: selected.id, user_id: user.id })
    if (error) {
      alert(error.message)
      return
    }
    setMemberInput("")
    await loadGroups()
  }

  return (
    <main className="min-h-[100dvh] bg-background">
      <TopNav />
      <section className="container mx-auto px-4 py-8 grid gap-6 md:grid-cols-[320px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Your Groups
            </CardTitle>
            <CardDescription>Create or open a group to start playing.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!authed ? (
              <div className="text-sm text-muted-foreground">Please sign in to use groups.</div>
            ) : (
              <>
                <div className="flex gap-2">
                  <Input
                    placeholder="New group name"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                  />
                  <Button onClick={createGroup} className="shrink-0">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <Separator />
                <div className="grid gap-2">
                  {groups.length === 0 && (
                    <div className="text-sm text-muted-foreground">No groups yet. Create one to play with friends.</div>
                  )}
                  {groups.map((g) => {
                    return (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => setSelectedId(g.id)}
                        className={`text-left rounded-md border p-3 hover:bg-accent ${
                          selectedId === g.id ? "bg-accent" : "bg-background"
                        }`}
                      >
                        <div className="font-medium">{g.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {memberships[g.id]?.length ?? 1} members
                        </div>
                      </button>
                    )
                  })}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <GroupPanel
          group={selected}
          currentUserId={userId}
          onAddMember={addMember}
          memberInput={memberInput}
          setMemberInput={setMemberInput}
        />
      </section>
    </main>
  )
}

function GroupPanel({
  group,
  currentUserId,
  onAddMember,
  memberInput,
  setMemberInput,
}: {
  group: Group | null
  currentUserId: string
  onAddMember: (name: string) => void
  memberInput: string
  setMemberInput: (s: string) => void
}) {
  const supabase = getSupabaseBrowserClient()
  const [round, setRound] = useState<GroupRound | null>(null)
  const [results, setResults] = useState<any[]>([])
  const [members, setMembers] = useState<{ id: string; username: string }[]>([])
  const [myResult, setMyResult] = useState<any | null>(null)

  const [startName, setStartName] = useState("")
  const [endName, setEndName] = useState("")

  useEffect(() => {
    if (!group) return
    ;(async () => {
      // members
      const { data: mem } = await supabase
        .from("group_members")
        .select("user_id, profiles(username)")
        .eq("group_id", group.id)
      setMembers(mem?.map((m: any) => ({ id: m.user_id, username: m.profiles?.username ?? "user" })) ?? [])

      // current round (highest index)
      const { data: r } = await supabase
        .from("group_rounds")
        .select("*")
        .eq("group_id", group.id)
        .order("index", { ascending: false })
        .limit(1)
        .maybeSingle()
      setRound((r as any) ?? null)

      if (r) {
        const { data: res } = await supabase
          .from("group_round_results")
          .select("*")
          .eq("round_id", r.id)
        setResults(res ?? [])
        setMyResult(res?.find((x: any) => x.user_id === currentUserId) ?? null)
      }
    })()

    // Realtime subscriptions
    const chan = supabase
      .channel(`group-${group.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "group_round_results" },
        (payload) => {
          const row = payload.new as any
          if (round && row.round_id === round.id) {
            setResults((prev) => {
              const map = new Map(prev.map((p) => [p.id, p]))
              map.set(row.id, row)
              return Array.from(map.values())
            })
            if (row.user_id === currentUserId) setMyResult(row)
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "group_rounds" },
        (payload) => {
          const r = payload.new as any
          if (r.group_id === group.id) {
            setRound(r)
            setResults([])
            setMyResult(null)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(chan)
    }
  }, [group, currentUserId])

  useEffect(() => {
    if (!round) return
    fetch(`/api/tmdb/person/${round.start_actor_id}`).then(r=>r.json()).then(d=>setStartName(d?.name || "Actor"))
    fetch(`/api/tmdb/person/${round.end_actor_id}`).then(r=>r.json()).then(d=>setEndName(d?.name || "Actor"))
  }, [round?.id])

  if (!group) {
    return (
      <Card className="min-h-[480px]">
        <div className="flex h-full items-center justify-center p-10 text-muted-foreground">
          Select a group or create a new one.
        </div>
      </Card>
    )
  }
  if (!round) {
    return (
      <Card className="min-h-[480px]">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{group.name}</span>
          </CardTitle>
          <CardDescription>Loading round…</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const everyoneDone = members.length > 0 && results.length >= members.length
  const completedCount = results.length

  async function onResult(r: GameResult) {
    // Upsert result for current user and round
    const payload = {
      round_id: round.id,
      steps: r.steps,
      time_ms: r.timeMs,
      path: r.path,
      pretty_path: r.prettyPath,
    }
    const { error } = await supabase.from("group_round_results").upsert(payload).select().single()
    if (error) {
      alert(error.message)
      return
    }
    // If everyone finished, create next round
    const { count } = await supabase
      .from("group_round_results")
      .select("*", { count: "exact", head: true })
      .eq("round_id", round.id)
    if ((count ?? 0) >= members.length) {
      const pair = await fetch("/api/tmdb/random-pair").then(r=>r.json())
      await supabase
        .from("group_rounds")
        .insert({
          group_id: group.id,
          index: round.index + 1,
          start_actor_id: pair.start.id,
          end_actor_id: pair.end.id,
        })
    }
  }

  return (
    <Card className="min-h-[480px]">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{group.name}</span>
          <Button variant="ghost" size="sm" onClick={() => location.reload()}>
            Refresh
            <ArrowRight className="ml-2 h-4 w-4 rotate-180" />
          </Button>
        </CardTitle>
        <CardDescription>Invite friends by username and finish rounds together.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <div className="font-medium">Members</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {members.map((m) => (
              <Badge key={m.id} variant="secondary">
                {m.username}
              </Badge>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <Input
              placeholder="Add member by username"
              value={memberInput}
              onChange={(e) => setMemberInput(e.target.value)}
            />
            <Button onClick={() => onAddMember(memberInput)} className="shrink-0">
              Add
            </Button>
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-muted-foreground">Round {round.index}</span>
            <Badge variant="secondary">{completedCount}/{members.length} completed</Badge>
          </div>
          <div className="text-sm">
            Connect{" "}
            <Badge variant="outline" className="font-semibold">
              {startName}
            </Badge>{" "}
            to{" "}
            <Badge variant="outline" className="font-semibold">
              {endName}
            </Badge>
          </div>

          {!myResult ? (
            <div className="rounded-md border p-4">
              <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
                <Play className="h-4 w-4" />
                Your attempt for this round
              </div>
              <ConnectGame
                mode="group"
                startActorId={round.start_actor_id}
                endActorId={round.end_actor_id}
                seed={`${group.id}:${round.id}`}
                onComplete={onResult}
                dataSource="tmdb"
              />
            </div>
          ) : (
            <div className="rounded-md border p-4 space-y-2">
              <div className="text-sm">You finished in {formatMs(myResult.time_ms)} with {myResult.steps} steps.</div>
              <div className="text-xs text-muted-foreground">Waiting for others...</div>
            </div>
          )}

          {everyoneDone && (
            <>
              <Separator />
              <div>
                <div className="font-medium mb-2">Step Reveal</div>
                <div className="grid gap-3">
                  {results.map((r) => (
                    <div key={r.id} className="rounded-md border p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <MemberName userId={r.user_id} />
                        <div className="text-xs text-muted-foreground">
                          {formatMs(r.time_ms)} • {r.steps} steps
                        </div>
                      </div>
                      <div className="mt-2 text-sm break-words">{r.pretty_path}</div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function MemberName({ userId }: { userId: string }) {
  const supabase = getSupabaseBrowserClient()
  const [name, setName] = useState("user")
  useEffect(() => {
    supabase.from("profiles").select("username").eq("id", userId).maybeSingle().then(({ data }) => {
      setName(data?.username ?? "user")
    })
  }, [userId])
  return <div className="text-sm font-medium">{name}</div>
}

function formatMs(ms: number) {
  const s = Math.floor(ms / 1000)
  const m = Math.floor(s / 60)
  const sec = s % 60
  const cs = Math.floor((ms % 1000) / 10)
  return `${m}:${sec.toString().padStart(2, "0")}.${cs.toString().padStart(2, "0")}`
}
