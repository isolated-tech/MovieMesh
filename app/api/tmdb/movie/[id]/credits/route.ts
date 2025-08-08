import { NextResponse } from "next/server"
import { movieCredits } from "@/lib/tmdb"

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const d = await movieCredits(params.id)
    // normalize to { id, name }
    const results = (d.cast || []).map((p: any) => ({ id: String(p.id), name: p.name }))
    return NextResponse.json({ results })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
