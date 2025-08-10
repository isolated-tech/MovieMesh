import { NextResponse } from "next/server"
import { personDetails } from "@/lib/tmdb"

export async function GET(_: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params
    const d = await personDetails(params.id)
    return NextResponse.json({ id: String(d.id), name: d.name })
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : 'An error occurred'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
