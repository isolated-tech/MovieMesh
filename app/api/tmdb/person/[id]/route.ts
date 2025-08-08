import { NextResponse } from "next/server"
import { personDetails } from "@/lib/tmdb"

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const d = await personDetails(params.id)
    return NextResponse.json({ id: String(d.id), name: d.name })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
