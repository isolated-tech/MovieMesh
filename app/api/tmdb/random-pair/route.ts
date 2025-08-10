import { NextResponse } from "next/server"
import { pickRandomPair } from "@/lib/tmdb"

export async function GET() {
  try {
    const pair = await pickRandomPair()
    return NextResponse.json(pair)
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : 'An error occurred'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
