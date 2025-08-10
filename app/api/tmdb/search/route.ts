import { NextResponse } from "next/server"
import { searchMulti } from "@/lib/tmdb"

interface Person {
  id: number
  name: string
}

interface Movie {
  id: number
  title: string
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const query = searchParams.get("query") || ""
    const type = (searchParams.get("type") || "person") as "person" | "movie"
    if (!query) return NextResponse.json({ results: [] })
    const data = await searchMulti(query, type, 1)
    const results =
      type === "person"
        ? (data.results || []).map((p: Person) => ({ id: String(p.id), label: p.name }))
        : (data.results || []).map((m: Movie) => ({ id: String(m.id), label: m.title }))
    return NextResponse.json({ results })
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : 'An error occurred'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
