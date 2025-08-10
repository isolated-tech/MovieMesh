const TMDB_BASE = "https://api.themoviedb.org/3"

function getAuthHeader() {
  const token = process.env.TMDB_API_READ_ACCESS_TOKEN
  const apiKey = process.env.TMDB_API_KEY
  if (!token && !apiKey) {
    throw new Error(
      "TMDB not configured. Set TMDB_API_READ_ACCESS_TOKEN or TMDB_API_KEY in your environment."
    )
  }
  // Prefer v4 bearer token; fallback to api_key query if needed
  return token
    ? { type: "bearer", header: { Authorization: `Bearer ${token}` } }
    : { type: "key", header: {} as Record<string, string>, apiKey }
}

export async function tmdbFetch(path: string, params?: Record<string, string | number | boolean | undefined | null>) {
  const auth = getAuthHeader()
  const url = new URL(TMDB_BASE + path)
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null) url.searchParams.set(k, String(v))
    }
  }
  if (auth.type === "key" && "apiKey" in auth && auth.apiKey) {
    url.searchParams.set("api_key", auth.apiKey)
  }
  const res = await fetch(url.toString(), {
    headers: {
      accept: "application/json",
      ...(auth.type === "bearer" ? auth.header : {}),
    },
    // Avoid Next cache for freshness (search/credits are dynamic)
    cache: "no-store",
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`TMDB error ${res.status}: ${text}`)
  }
  return res.json()
}

export async function searchMulti(query: string, type: "person" | "movie", page = 1) {
  if (type === "person") {
    return tmdbFetch("/search/person", { query, page, include_adult: false })
  }
  return tmdbFetch("/search/movie", { query, page, include_adult: false })
}

export async function personDetails(id: string) {
  return tmdbFetch(`/person/${id}`)
}
export async function movieDetails(id: string) {
  return tmdbFetch(`/movie/${id}`)
}
export async function personMovieCredits(id: string) {
  return tmdbFetch(`/person/${id}/movie_credits`)
}
export async function movieCredits(id: string) {
  return tmdbFetch(`/movie/${id}/credits`)
}

function seededRandom(seed: number) {
  // simple LCG
  let s = seed % 2147483647
  return () => (s = (s * 48271) % 2147483647) / 2147483647
}

export async function pickDailyPair(dateStr?: string) {
  const date = dateStr ? new Date(dateStr) : new Date()
  const seed = Number(
    `${date.getUTCFullYear()}${(date.getUTCMonth() + 1).toString().padStart(2, "0")}${date
      .getUTCDate()
      .toString()
      .padStart(2, "0")}`
  )
  const rand = seededRandom(seed)
  // Use popular persons for stability
  const page = Math.max(1, Math.floor(rand() * 5) + 1)
  const popular = await tmdbFetch("/person/popular", { page })
  const list = popular.results || []
  if (list.length < 2) throw new Error("Not enough popular persons from TMDB.")
  const a = list[Math.floor(rand() * list.length)]
  let b = list[Math.floor(rand() * list.length)]
  if (b.id === a.id) {
    b = list[(Math.floor(rand() * list.length) + 1) % list.length]
  }
  return {
    start: { id: String(a.id), name: a.name },
    end: { id: String(b.id), name: b.name },
  }
}

export async function pickRandomPair() {
  const popular = await tmdbFetch("/person/popular", { page: Math.floor(Math.random() * 20) + 1 })
  const list = popular.results || []
  if (list.length < 2) throw new Error("Not enough popular persons from TMDB.")
  const a = list[Math.floor(Math.random() * list.length)]
  let b = list[Math.floor(Math.random() * list.length)]
  if (b.id === a.id) {
    b = list[(Math.floor(Math.random() * list.length) + 1) % list.length]
  }
  return {
    start: { id: String(a.id), name: a.name },
    end: { id: String(b.id), name: b.name },
  }
}
