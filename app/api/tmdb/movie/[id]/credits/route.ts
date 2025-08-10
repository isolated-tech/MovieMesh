import { NextResponse } from "next/server"
import { movieCredits } from "@/lib/tmdb"

interface CastMember {
  id: number
  name: string
}

export async function GET(_: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params
    const d = await movieCredits(params.id)
    // normalize to { id, name }
    const results = (d.cast || []).map((p: CastMember) => ({ id: String(p.id), name: p.name }))
    return NextResponse.json({ results })
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : 'An error occurred'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
