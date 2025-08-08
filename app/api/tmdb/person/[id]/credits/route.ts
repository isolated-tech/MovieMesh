import { NextResponse } from "next/server"
import { personMovieCredits } from "@/lib/tmdb"

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const d = await personMovieCredits(params.id)
    // normalize to { id, title }
    const results = (d.cast || []).map((m: any) => ({ id: String(m.id), title: m.title }))
    return NextResponse.json({ results })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
