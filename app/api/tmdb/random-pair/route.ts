import { NextResponse } from "next/server"
import { pickRandomPair } from "@/lib/tmdb"

export async function GET() {
  try {
    const pair = await pickRandomPair()
    return NextResponse.json(pair)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
