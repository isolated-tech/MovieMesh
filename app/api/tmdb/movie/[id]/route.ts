import { NextResponse } from "next/server"
import { movieDetails } from "@/lib/tmdb"

export async function GET(_: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params
    const d = await movieDetails(params.id)
    return NextResponse.json({ id: String(d.id), title: d.title })
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : 'An error occurred'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
