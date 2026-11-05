import { Landscape, terrains } from '../material/Landscape'
import { Objective } from '../material/Objective'
import { objectivePoints } from '../Scoring'
import { PlayerColor } from '../PlayerColor'
import { Analysis, Panorama, tileData, ZoneInfo } from './Model'
import { isLowestWins, objectiveValue } from './Objectives'
import { BotState } from './State'

/** The weights of the evaluation: tuned in the arena (see arena/Contenders.ts) */
export type Params = {
  /** How many tiles a player has to choose from on a turn, in the forecast of their terrains */
  choice: number
  /** Chances that a tile laid at an end joins a zone of the same terrain there: the rows do not always meet */
  feed: number
  /** Spread of the forecast of an Objective, per tile left to lay */
  spread: number
  /** Weight of the opponents' prospects, subtracted from the player's own */
  opponents: number
  /** The same at 2 players, where the game is all about the gap between the players */
  duel: number
  /** Tiles left in the stacks when the game ends */
  leftover: number
  /**
   * Tiles gained for each stack a player stands behind the others. The turn order is a race around the Centrepiece: the
   * balloon furthest behind the Sun clockwise plays, so a tile taken close by costs less time than a tile far away.
   * Divided by the number of opponents: the more balloons around the Centrepiece, the less a stack is worth.
   */
  tempo: number
  /** Tiles left to each player below which the stacks of advance are worth less and less: at the end, a hole costs nothing */
  tempoFade: number
  /** Points lost for each flower and animal of a zone that a tile closes for good (see closedRichness) */
  cut: number
  /** Weight of the points of the Objectives against the points of the terrains, at 4 players */
  objectiveWeight: number
  /** The same at 3 players */
  trioObjectives: number
  /**
   * The same at 2 players: an Objective is raced against a single opponent, and the human games showed the bot giving
   * them up too easily for terrain and tempo
   */
  duelObjectives: number
}

export const defaultParams: Params = {
  choice: 2,
  feed: 0.85,
  spread: 0.7,
  opponents: 0.5,
  duel: 1,
  leftover: 4.4,
  tempo: 0.6,
  tempoFade: 0,
  cut: 1,
  objectiveWeight: 1,
  trioObjectives: 1.2,
  duelObjectives: 1.5
}

/** What the tiles still to be laid hold on average: the unseen tiles and the tops of the stacks */
export type Pool = {
  /** The tiles still to be laid: the unseen tiles and the tops of the stacks */
  tiles: number[]
  /** For each of these tiles and each terrain (tile × 4 + terrain), its flowers, its animals, and whether it shows it */
  terrains?: { flowers: Float64Array; animals: Float64Array; has: Uint8Array }
  flowers: number[]
  animals: number[]
  clouds: number
  crows: number
  river: number
  riverAnimals: number
  waterfalls: number
}

export const readPool = (state: BotState): Pool => {
  const tiles = [...state.unseen, ...state.stacks.flatMap((stack) => (stack.top !== undefined ? [stack.top] : []))]
  const pool: Pool = { tiles, flowers: [0, 0, 0, 0, 0, 0], animals: [0, 0, 0, 0, 0, 0], clouds: 0, crows: 0, river: 0, riverAnimals: 0, waterfalls: 0 }
  for (const tile of tiles) {
    const data = tileData[tile]
    for (const terrain of terrains) {
      pool.flowers[terrain] += data.flowers[terrain]
      pool.animals[terrain] += data.animals[terrain]
    }
    pool.clouds += data.clouds
    pool.crows += data.crows
    if (data.river) {
      pool.river++
      pool.riverAnimals += data.river.animals
      if (data.river.waterfall) pool.waterfalls++
    }
  }
  const count = Math.max(1, tiles.length)
  for (const terrain of terrains) {
    pool.flowers[terrain] /= count
    pool.animals[terrain] /= count
  }
  pool.clouds /= count
  pool.crows /= count
  pool.river /= count
  pool.riverAnimals /= count
  pool.waterfalls /= count
  return pool
}

/**
 * How many tiles each player will still lay. Under the Moon, every balloon still flying lays one last tile. Before, the
 * table takes the stacks about evenly, so that the game ends with a few tiles left in them. The turn order is a race:
 * each player is as many stacks ahead as their balloon stands clockwise from the Sun, and the players behind will lay
 * more tiles than the players ahead before the end.
 */
export const remainingTiles = (state: BotState, params: Params): Map<PlayerColor, number> => {
  const result = new Map<PlayerColor, number>()
  if (state.sun.moon) {
    for (const player of state.players) result.set(player, state.balloons.get(player)!.deflated ? 0 : 1)
    return result
  }
  const players = state.players.length
  const stacks = state.stacks.length
  const total = state.stacks.reduce((sum, stack) => sum + stack.count, 0)
  const share = Math.max(players, total - params.leftover) / players
  const ahead = new Map(state.players.map((player) => [player, player === state.active ? 0 : (state.balloons.get(player)!.stack - state.sun.stack + stacks) % stacks]))
  const fade = params.tempoFade ? Math.min(1, (share - 1) / params.tempoFade) : 1
  let mean = 0
  for (const value of ahead.values()) mean += value / players
  for (const player of state.players) result.set(player, Math.max(0, share + (mean - ahead.get(player)!) * (params.tempo / (players - 1)) * fade))
  return result
}

type OpenZone = { flowers: number; animals: number }

const poolTerrains = (pool: Pool) => {
  const flowers = new Float64Array(pool.tiles.length * 4)
  const animals = new Float64Array(pool.tiles.length * 4)
  const has = new Uint8Array(pool.tiles.length * 4)
  pool.tiles.forEach((tile, index) => {
    const data = tileData[tile]
    terrains.forEach((terrain, rank) => {
      flowers[index * 4 + rank] = data.flowers[terrain]
      animals[index * 4 + rank] = data.animals[terrain]
      has[index * 4 + rank] = data.landscapes.includes(terrain) ? 1 : 0
    })
  })
  return { flowers, animals, has }
}

/**
 * The points the terrains of a Panorama can still bring, for every number of tiles still to be laid: `values[k]` for k
 * more tiles.
 *
 * The future is played out on the zones open at both ends. Each tile goes where it brings the most: on the side where it
 * extends the richest zones of its terrains (a zone of x flowers and y animals gains x × the animals of the tile + y ×
 * its flowers). The player chooses among a few tiles: the gain of a turn is the best of `choice` tiles drawn from the
 * pool. The tile laid ends the zones of the terrains it does not show on that side: a strong zone kept open on a side,
 * and better on both, keeps paying, while a zone cut has no future left.
 */
const terrainPotentials = (analysis: Analysis, count: number, pool: Pool, params: Params): number[] => {
  // The open zones on each side (side × 4 + terrain), and the chances they are still open; a zone open on both sides is
  // the same object on both, fed from either
  const zones: (OpenZone | undefined)[] = []
  const open = new Float64Array(8)
  for (const zone of analysis.zones) {
    if (zone.landscape === Landscape.Sky) continue
    const shared: OpenZone = { flowers: zone.flowers, animals: zone.animals }
    const terrain = terrains.indexOf(zone.landscape)
    if (zone.openLeft) {
      zones[terrain] = shared
      open[terrain] = 1
    }
    if (zone.openRight) {
      zones[4 + terrain] = shared
      open[4 + terrain] = 1
    }
  }
  const { flowers, animals, has } = (pool.terrains ??= poolTerrains(pool))
  const n = pool.tiles.length
  const values = [0]
  if (!n) return values
  const gains = new Float64Array(n)
  const bestSides = new Int8Array(n)
  const chances = new Float64Array(n)
  const order = Int32Array.from({ length: n }, (_, index) => index)
  const reach = new Float64Array(8)
  const reachAnimals = new Float64Array(8)
  const laid = [0, 0]
  const shown = new Float64Array(8)
  const addedFlowers = new Float64Array(8)
  const addedAnimals = new Float64Array(8)
  const shares = new Float64Array(n)
  for (let rank = 0; rank < n; rank++) shares[rank] = ((rank + 1) / n) ** params.choice - (rank / n) ** params.choice
  let total = 0
  for (let step = 1; step <= count; step++) {
    // What a tile brings to a zone: the flowers and animals of the zone, as far as it is still open there
    for (let key = 0; key < 8; key++) {
      const zone = zones[key]
      reach[key] = zone ? params.feed * open[key] * zone.flowers : 0
      reachAnimals[key] = zone ? params.feed * open[key] * zone.animals : 0
    }
    for (let index = 0; index < n; index++) {
      let left = 0
      let right = 0
      for (let terrain = 0; terrain < 4; terrain++) {
        const key = index * 4 + terrain
        const f = flowers[key]
        const a = animals[key]
        if (!f && !a) continue
        left += f * a
        right += f * a
        if (!has[key]) continue
        left += reach[terrain] * a + reachAnimals[terrain] * f
        right += reach[4 + terrain] * a + reachAnimals[4 + terrain] * f
      }
      gains[index] = left >= right ? left : right
      bestSides[index] = left >= right ? 0 : 1
    }
    // The player keeps the best of `choice` tiles drawn from the pool: the chances of each tile to be the one
    // Insertion sort: the order of the previous step is almost right already
    for (let i = 1; i < n; i++) {
      const index = order[i]
      const gain = gains[index]
      let j = i - 1
      while (j >= 0 && gains[order[j]] > gain) {
        order[j + 1] = order[j]
        j--
      }
      order[j + 1] = index
    }
    let expected = 0
    for (let rank = 0; rank < n; rank++) {
      chances[order[rank]] = shares[rank]
      expected += gains[order[rank]] * shares[rank]
    }
    total += expected
    values.push(total)
    // The zones grow by what the tile laid on their side is expected to bring, and stay open as far as it shows them
    laid[0] = laid[1] = 0
    shown.fill(0)
    addedFlowers.fill(0)
    addedAnimals.fill(0)
    for (let index = 0; index < n; index++) {
      const side = bestSides[index]
      const chance = chances[index]
      laid[side] += chance
      for (let terrain = 0; terrain < 4; terrain++) {
        const key = index * 4 + terrain
        if (!has[key]) continue
        shown[side * 4 + terrain] += chance
        addedFlowers[side * 4 + terrain] += chance * flowers[key]
        addedAnimals[side * 4 + terrain] += chance * animals[key]
      }
    }
    for (let key = 0; key < 8; key++) {
      const zone = zones[key]
      if (!zone || !open[key]) continue
      zone.flowers += open[key] * addedFlowers[key]
      zone.animals += open[key] * addedAnimals[key]
      open[key] *= 1 - laid[key < 4 ? 0 : 1] + shown[key]
    }
  }
  return values
}

/** How many tiles ahead the terrains are played out, the next ones being extrapolated */
const horizon = 5

const potentials = new WeakMap<Panorama, { pool: Pool; params: Params; values: number[] }>()

/**
 * The potential of a Panorama, computed once for each whole number of tiles and interpolated in between: the
 * Panoramas of the opponents are weighed again and again while the bot looks for its move, with slightly different
 * numbers of tiles left as its balloon moves around.
 */
const cachedPotential = (panorama: Panorama, tiles: number, pool: Pool, params: Params): number => {
  if (tiles <= 0) return 0
  let entry = potentials.get(panorama)
  if (!entry || entry.pool !== pool || entry.params !== params) {
    entry = { pool, params, values: terrainPotentials(panorama.analysis, horizon, pool, params) }
    potentials.set(panorama, entry)
  }
  const floor = Math.floor(tiles)
  const fraction = tiles - floor
  const values = entry.values
  // Past the horizon, every tile is expected to bring as much as the last one
  const last = values.length - 1
  const at = (count: number) => (count <= last ? values[count] : values[last] + (count - last) * (values[last] - values[last - 1]))
  return fraction ? at(floor) * (1 - fraction) + at(floor + 1) * fraction : at(floor)
}

/**
 * The forecast of an Objective for one player: its expected value at the end, and how uncertain that is. The value
 * grows with the tiles the player will still lay, at a rate measured on games of the bot (arena --calibrate).
 *
 * For the Objectives about the largest of something (sky, river), only what is still open at an end of the Panorama
 * can grow: a zone or a river that a tile has closed keeps its value for good, so breaking it gives up its future.
 */
type Forecast = { mean: number; spread: number }

const openBest = <T extends { openLeft: boolean; openRight: boolean }>(items: T[], value: (item: T) => number, tiles: number, rate: number) => {
  let best = 0
  for (const item of items) {
    const open = item.openLeft && item.openRight ? 1 : item.openLeft || item.openRight ? 0.6 : 0
    best = Math.max(best, value(item) + open * tiles * rate)
  }
  return best
}

const forecast = (objective: Objective, panorama: Panorama, tiles: number, pool: Pool, params: Params): Forecast => {
  const analysis = panorama.analysis
  const now = objectiveValue(objective, panorama, analysis)
  const spread = params.spread * Math.sqrt(tiles)
  switch (objective) {
    case Objective.FewestClouds:
      return { mean: now + tiles * pool.clouds * 0.8, spread }
    case Objective.MostCloudsOneSide:
      return { mean: now + tiles * pool.clouds * 0.8, spread: spread * 1.3 }
    case Objective.LargestSky:
      return { mean: Math.max(now, openBest(analysis.zones.filter((zone) => zone.landscape === Landscape.Sky), (zone) => zone.tiles, tiles, 0.8)), spread }
    case Objective.MostTilesOneSide:
      return { mean: now + tiles * 0.7, spread }
    case Objective.LongestRiver:
      return { mean: Math.max(now, openBest(analysis.rivers, (river) => river.tiles, tiles, pool.river * 0.55)), spread }
    case Objective.MostAnimalsSameRiver:
      return { mean: Math.max(now, openBest(analysis.rivers, (river) => river.animals, tiles, pool.riverAnimals * 0.6)), spread: spread * 1.2 }
    case Objective.MostSeparateRivers:
      return { mean: now + tiles * 0.25, spread: spread * 0.7 }
    case Objective.MostWaterfallsSameRiver:
      return { mean: Math.max(now, openBest(analysis.rivers, (river) => river.waterfalls, tiles, pool.waterfalls * 0.45)), spread }
    case Objective.MostCrows:
      return { mean: now + tiles * pool.crows, spread }
    case Objective.FewestTiles:
      return { mean: now + tiles, spread: spread * 0.5 }
    case Objective.MostZonesWithAnimal:
      return { mean: now + tiles * 0.8, spread }
    case Objective.FewestZones:
      return { mean: now + tiles * 0.5, spread }
  }
}

/** Standard normal cumulative distribution */
const phi = (x: number) => {
  // Abramowitz and Stegun 7.1.26
  const t = 1 / (1 + 0.3275911 * Math.abs(x / Math.SQRT2))
  const y = 1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-(x * x) / 2)
  return x >= 0 ? (1 + y) / 2 : (1 - y) / 2
}

/**
 * The chances of each player to meet an Objective best (ties share the points). Each forecast is read as a normal law:
 * in a close race, a tile shifts the chances a lot and the Objective is worth fighting for; when a player is well ahead,
 * the chances hardly move, whoever is ahead, and the tiles are better spent on the terrains.
 */
const objectiveChances = (forecasts: Forecast[], lowest: boolean): number[] =>
  forecasts.map((mine, index) => {
    let chance = 1
    forecasts.forEach((other, otherIndex) => {
      if (otherIndex === index) return
      const difference = lowest ? other.mean - mine.mean : mine.mean - other.mean
      const spread = Math.sqrt(mine.spread ** 2 + other.spread ** 2 + 0.04)
      chance *= phi((difference + 0.5) / spread)
    })
    return chance
  })

/** What the evaluation expects of a player, part by part */
export type Assessment = {
  tiles: number
  terrain: number
  potential: number
  objectives: { objective: Objective; mean: number; spread: number; chance: number }[]
}

export const assess = (state: BotState, params: Params, pool: Pool = readPool(state)): Map<PlayerColor, Assessment> => {
  const remaining = remainingTiles(state, params)
  const result = new Map<PlayerColor, Assessment>()
  for (const player of state.players) {
    const analysis = state.panoramas.get(player)!.analysis
    const tiles = remaining.get(player)!
    result.set(player, { tiles, terrain: analysis.terrainScore, potential: cachedPotential(state.panoramas.get(player)!, tiles, pool, params), objectives: [] })
  }
  for (const objective of state.objectives) {
    const forecasts = state.players.map((player) => forecast(objective, state.panoramas.get(player)!, remaining.get(player)!, pool, params))
    const chances = objectiveChances(forecasts, isLowestWins(objective))
    state.players.forEach((player, index) => result.get(player)!.objectives.push({ objective, ...forecasts[index], chance: chances[index] }))
  }
  return result
}

/** The final score each player can expect from this position */
export const prospects = (state: BotState, params: Params, pool: Pool = readPool(state)): Map<PlayerColor, number> => {
  const result = new Map<PlayerColor, number>()
  const weight = [params.duelObjectives, params.trioObjectives, params.objectiveWeight][Math.min(state.players.length, 4) - 2]
  for (const [player, assessment] of assess(state, params, pool)) {
    let value = assessment.terrain + assessment.potential
    for (const { chance } of assessment.objectives) value += objectivePoints * weight * chance
    result.set(player, value)
  }
  return result
}

/** How good the position is for the player: their prospects, against those of the others */
export const evaluate = (state: BotState, player: PlayerColor, params: Params, pool?: Pool): number => {
  const values = prospects(state, params, pool)
  const mine = values.get(player)!
  const weight = state.players.length === 2 ? params.duel : params.opponents
  if (!weight) return mine
  let best = -Infinity
  let sum = 0
  for (const [other, value] of values) {
    if (other === player) continue
    sum += value
    if (value > best) best = value
  }
  const others = state.players.length - 1
  return mine - weight * (0.5 * best + (0.5 * sum) / others)
}

/**
 * The flowers and animals of the zones that laying a tile closes for good: open at an end of the Panorama before, open
 * at neither end after. A zone that grows, or stays open on the other side, is not closed.
 */
export const closedRichness = (before: Panorama, after: Panorama): number => {
  const open = (zone: ZoneInfo) => zone.openLeft || zone.openRight
  const stillOpen = after.analysis.zones.filter(open)
  let closed = 0
  for (const zone of before.analysis.zones) {
    if (zone.landscape === Landscape.Sky || !open(zone)) continue
    const kept = stillOpen.some(
      (other) => other.landscape === zone.landscape && other.flowers >= zone.flowers && other.animals >= zone.animals && other.tiles >= zone.tiles
    )
    if (!kept) closed += zone.flowers + zone.animals
  }
  return closed
}
