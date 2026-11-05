/** A small seeded generator (mulberry32): the same seed always draws the same numbers */
export type Random = () => number

export const seededRandom = (seed: number): Random => {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Runs a function with Math.random drawn from a seed, so that what it deals can be dealt again */
export const withSeed = <T>(seed: number, run: () => T): T => {
  const random = Math.random
  Math.random = seededRandom(seed)
  try {
    return run()
  } finally {
    Math.random = random
  }
}

export const shuffled = <T>(values: T[], random: Random): T[] => {
  const copy = [...values]
  for (let index = copy.length - 1; index > 0; index--) {
    const other = Math.floor(random() * (index + 1))
    ;[copy[index], copy[other]] = [copy[other], copy[index]]
  }
  return copy
}
