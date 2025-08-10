import { NextResponse } from "next/server"
import { personMovieCredits } from "@/lib/tmdb"

interface MovieCredit {
  id: number
  title: string
}

export async function GET(_: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params
    const d = await personMovieCredits(params.id)
    // normalize to { id, title }
    const results = (d.cast || []).map((m: MovieCredit) => ({ id: String(m.id), title: m.title }))
    return NextResponse.json({ results })
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : 'An error occurred'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
