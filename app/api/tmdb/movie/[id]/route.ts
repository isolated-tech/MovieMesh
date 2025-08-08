import { NextResponse } from "next/server"
import { movieDetails } from "@/lib/tmdb"

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const d = await movieDetails(params.id)
    return NextResponse.json({ id: String(d.id), title: d.title })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
