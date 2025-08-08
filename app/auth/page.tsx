"use client"

import { useState } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import TopNav from "@/components/top-nav"

export default function AuthPage() {
  const supabase = getSupabaseBrowserClient()
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function sendMagicLink(e: React.FormEvent) {
    e.preventDefault()
    setPending(true)
    setStatus(null)
    const { error } = await supabase.auth.signInWithOtp({ email })
    setPending(false)
    if (error) setStatus(error.message)
    else setStatus("Check your inbox for the sign-in link.")
  }

  async function signInWith(provider: "github" | "google") {
    setPending(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: typeof window !== "undefined" ? window.location.origin : undefined },
    })
    if (error) {
      setPending(false)
      setStatus(error.message)
    }
  }

  return (
    <main className="min-h-[100dvh] bg-background">
      <TopNav />
      <section className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Sign in</CardTitle>
            <CardDescription>Use a magic link or OAuth to create your account.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={sendMagicLink} className="space-y-2">
              <Input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Button type="submit" disabled={pending} className="w-full">
                {pending ? "Sending..." : "Send magic link"}
              </Button>
            </form>
            <div className="text-center text-xs text-muted-foreground">or</div>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={() => signInWith("github")} disabled={pending}>
                GitHub
              </Button>
              <Button variant="outline" onClick={() => signInWith("google")} disabled={pending}>
                Google
              </Button>
            </div>
            {status && <div className="text-sm text-muted-foreground">{status}</div>}
          </CardContent>
        </Card>
      </section>
    </main>
  )
}
