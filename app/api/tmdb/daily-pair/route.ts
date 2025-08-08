import { NextResponse } from "next/server"
import { pickDailyPair } from "@/lib/tmdb"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const date = searchParams.get("date") || undefined
    const pair = await pickDailyPair(date)
    return NextResponse.json(pair)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
