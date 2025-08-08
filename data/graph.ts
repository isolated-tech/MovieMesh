export type Actor = { id: string; name: string }
export type Movie = { id: string; title: string; year?: number }
export type GraphNode = Actor | Movie

// Small demo dataset (expand or replace with TMDB later)
const actors: Actor[] = [
  { id: "leo", name: "Leonardo DiCaprio" },
  { id: "kate", name: "Kate Winslet" },
  { id: "jgl", name: "Joseph Gordon-Levitt" },
  { id: "zooey", name: "Zooey Deschanel" },
  { id: "will", name: "Will Ferrell" },
  { id: "tom", name: "Tom Hardy" },
  { id: "margot", name: "Margot Robbie" },
  { id: "ryan", name: "Ryan Gosling" },
  { id: "emma", name: "Emma Stone" },
  { id: "steve", name: "Steve Carell" },
  { id: "anne", name: "Anne Hathaway" },
  { id: "bale", name: "Christian Bale" },
  { id: "damon", name: "Matt Damon" },
]

const movies: Movie[] = [
  { id: "titanic", title: "Titanic", year: 1997 },
  { id: "inception", title: "Inception", year: 2010 },
  { id: "500days", title: "500 Days of Summer", year: 2009 },
  { id: "elf", title: "Elf", year: 2003 },
  { id: "wolf", title: "The Wolf of Wall Street", year: 2013 },
  { id: "barbie", title: "Barbie", year: 2023 },
  { id: "lalaland", title: "La La Land", year: 2016 },
  { id: "csl", title: "Crazy, Stupid, Love", year: 2011 },
  { id: "tdkr", title: "The Dark Knight Rises", year: 2012 },
  { id: "interstellar", title: "Interstellar", year: 2014 },
  { id: "martian", title: "The Martian", year: 2015 },
]

// Movie -> actors
const casts: Record<string, string[]> = {
  titanic: ["leo", "kate"],
  inception: ["leo", "jgl", "tom"],
  "500days": ["jgl", "zooey"],
  elf: ["will", "zooey"],
  wolf: ["leo", "margot"],
  barbie: ["margot", "ryan"],
  lalaland: ["ryan", "emma"],
  csl: ["ryan", "emma", "steve"],
  tdkr: ["tom", "anne", "bale"],
  interstellar: ["anne", "damon"],
  martian: ["damon"],
}

// Build actor -> movies index
const filmography: Record<string, string[]> = {}
for (const m of movies) {
  for (const a of casts[m.id] || []) {
    if (!filmography[a]) filmography[a] = []
    filmography[a].push(m.id)
  }
}

export function actorById(id: string) {
  return actors.find((a) => a.id === id)
}
export function movieById(id: string) {
  return movies.find((m) => m.id === id)
}

export function neighborsForActor(actorId: string): Movie[] {
  return (filmography[actorId] || []).map((id) => movieById(id)!).filter(Boolean)
}
export function neighborsForMovie(movieId: string): Actor[] {
  return (casts[movieId] || []).map((id) => actorById(id)!).filter(Boolean)
}
export function isAdjacentMovieToActor(movieId: string, actorId: string) {
  return (filmography[actorId] || []).includes(movieId)
}
export function isAdjacentActorToMovie(actorId: string, movieId: string) {
  return (casts[movieId] || []).includes(actorId)
}

export function shortestPathBetweenActors(startActorId: string, endActorId: string) {
  // BFS over bipartite graph Actor <-> Movie
  if (startActorId === endActorId) return { path: [startActorId] }

  const queue: { id: string; type: "actor" | "movie"; prev?: number }[] = []
  const nodes: { id: string; type: "actor" | "movie"; prev?: number }[] = []
  const seen = new Set<string>()

  nodes.push({ id: startActorId, type: "actor", prev: undefined })
  queue.push({ id: startActorId, type: "actor", prev: undefined })
  seen.add("actor:" + startActorId)

  while (queue.length) {
    const cur = queue.shift()!
    if (cur.type === "actor") {
      for (const m of neighborsForActor(cur.id)) {
        const key = "movie:" + m.id
        if (seen.has(key)) continue
        seen.add(key)
        nodes.push({ id: m.id, type: "movie", prev: nodes.indexOf(cur) })
        queue.push(nodes[nodes.length - 1])
      }
    } else {
      for (const a of neighborsForMovie(cur.id)) {
        const key = "actor:" + a.id
        if (seen.has(key)) continue
        seen.add(key)
        nodes.push({ id: a.id, type: "actor", prev: nodes.indexOf(cur) })
        if (a.id === endActorId) {
          // reconstruct
          const idx = nodes.length - 1
          const pathIds: string[] = []
          let p: number | undefined = idx
          while (p !== undefined) {
            pathIds.push(nodes[p].id)
            p = nodes[p].prev
          }
          pathIds.reverse()
          return { path: pathIds }
        }
        queue.push(nodes[nodes.length - 1])
      }
    }
  }
  return null
}

// Deterministic daily pair
export function getDailyPair(date = new Date()) {
  const seed = Number(
    `${date.getUTCFullYear()}${(date.getUTCMonth() + 1).toString().padStart(2, "0")}${date
      .getUTCDate()
      .toString()
      .padStart(2, "0")}`
  )
  const connectedPairs = allConnectedActorPairs()
  const pick = connectedPairs[seed % connectedPairs.length]
  return { startActorId: pick[0], endActorId: pick[1] }
}

export function getRandomPairConnected() {
  const pairs = allConnectedActorPairs()
  const idx = Math.floor(Math.random() * pairs.length)
  return { startActorId: pairs[idx][0], endActorId: pairs[idx][1] }
}

let cachedPairs: [string, string][] | null = null
function allConnectedActorPairs(): [string, string][] {
  if (cachedPairs) return cachedPairs
  const ids = actors.map((a) => a.id)
  const pairs: [string, string][] = []
  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      const sp = shortestPathBetweenActors(ids[i], ids[j])
      if (sp && sp.path.length > 1) pairs.push([ids[i], ids[j]])
    }
  }
  cachedPairs = pairs
  return pairs
}
