import { NextResponse } from "next/server"
import { pickDailyPair } from "@/lib/tmdb"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const date = searchParams.get("date") || undefined
    const pair = await pickDailyPair(date)
    return NextResponse.json(pair)
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : 'An error occurred'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
