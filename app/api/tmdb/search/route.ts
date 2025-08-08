import { NextResponse } from "next/server"
import { searchMulti } from "@/lib/tmdb"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const query = searchParams.get("query") || ""
    const type = (searchParams.get("type") || "person") as "person" | "movie"
    if (!query) return NextResponse.json({ results: [] })
    const data = await searchMulti(query, type, 1)
    const results =
      type === "person"
        ? (data.results || []).map((p: any) => ({ id: String(p.id), label: p.name }))
        : (data.results || []).map((m: any) => ({ id: String(m.id), label: m.title }))
    return NextResponse.json({ results })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
