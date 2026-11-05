import { Landscape } from '../material/Landscape'
import { tileWaves, startingTileRise } from '../material/PanoramaTile'
import { TileContent } from '../material/TileContent'
import { panoramaTileContents, startingTileContent } from '../material/TileContents'

/**
 * The tiles as the bot reads them: what each edge shows row by row, and what each landscape of the tile holds. Index 0
 * is the Starting Tile, 1 to 36 the Panorama Tiles.
 */
export type TileData = {
  /** First row of the tile: 0, or -1 for the Starting Tile */
  top: number
  left: number[]
  right: number[]
  /** Flowers and animals by landscape (indexed by Landscape) */
  flowers: number[]
  animals: number[]
  clouds: number
  crows: number
  river?: { left: number; right: number; waterfall: boolean; animals: number }
  /** The landscapes of the tile, each being one area */
  landscapes: number[]
}

const toData = (content: TileContent): TileData => {
  const flowers = [0, 0, 0, 0, 0, 0]
  const animals = [0, 0, 0, 0, 0, 0]
  for (const flower of content.flowers) flowers[flower]++
  for (const animal of content.animals) animals[animal]++
  return {
    top: content.top ?? 0,
    left: content.left,
    right: content.right,
    flowers,
    animals,
    clouds: content.clouds,
    crows: animals[Landscape.Fields],
    river: content.river,
    landscapes: [...new Set([...content.left, ...content.right])]
  }
}

export const STARTING_TILE = 0
export const tileData: TileData[] = [toData(startingTileContent), ...Array.from({ length: 36 }, (_, index) => toData(panoramaTileContents[index + 1]))]

/** Left (-1) or right (1) of the Panorama */
export type Side = -1 | 1

/** A zone of one landscape, and whether it reaches the outer edge of the Panorama on the left or on the right */
export type ZoneInfo = { landscape: number; tiles: number; flowers: number; animals: number; openLeft: boolean; openRight: boolean }

/** A river, and whether it reaches the left or the right end of the Panorama, where it can still go on */
export type RiverInfo = { tiles: number; waterfalls: number; animals: number; openLeft: boolean; openRight: boolean }

/** Everything the evaluation reads on a Panorama */
export type Analysis = {
  zones: ZoneInfo[]
  rivers: RiverInfo[]
  /** Clouds and tiles on the left of the Starting Tile, and on its right */
  clouds: [number, number]
  sideTiles: [number, number]
  totalClouds: number
  crows: number
  terrainScore: number
}

/**
 * A Panorama as a row of tiles, from left to right. Immutable: laying a tile gives a new Panorama.
 */
export class Panorama {
  private analysisCache?: Analysis

  constructor(
    /** Tile numbers from left to right (0 is the Starting Tile) */
    readonly ids: number[],
    /** Offset of each tile, in waves */
    readonly ys: number[]
  ) {}

  static start(): Panorama {
    return new Panorama([STARTING_TILE], [0])
  }

  get size() {
    return this.ids.length
  }

  /** The index of the outermost tile on a side */
  endIndex(side: Side) {
    return side === -1 ? 0 : this.ids.length - 1
  }

  /** The offsets a tile can be laid at on a side (see PanoramaTurnRule.getPlacements) */
  offsets(side: Side): number[] {
    const end = this.endIndex(side)
    const y = this.ys[end]
    const top = this.ids[end] === STARTING_TILE ? y - startingTileRise : y
    const offsets: number[] = []
    for (let offset = top - tileWaves + 1; offset < y + tileWaves; offset++) offsets.push(offset)
    return offsets
  }

  place(tile: number, side: Side, y: number): Panorama {
    return side === -1 ? new Panorama([tile, ...this.ids], [y, ...this.ys]) : new Panorama([...this.ids, tile], [...this.ys, y])
  }

  /** The column of the Starting Tile in the row */
  get startIndex() {
    return this.ids.indexOf(STARTING_TILE)
  }

  get analysis(): Analysis {
    return (this.analysisCache ??= analyse(this))
  }
}

/** Areas are numbered tile * 6 + landscape */
const analyse = (panorama: Panorama): Analysis => {
  const { ids, ys } = panorama
  const count = ids.length
  const parent = new Int16Array(count * 6).fill(-1)
  for (let index = 0; index < count; index++) for (const landscape of tileData[ids[index]].landscapes) parent[index * 6 + landscape] = index * 6 + landscape
  const find = (key: number): number => {
    while (parent[key] !== key) {
      parent[key] = parent[parent[key]]
      key = parent[key]
    }
    return key
  }
  for (let index = 0; index + 1 < count; index++) {
    const tile = tileData[ids[index]]
    const next = tileData[ids[index + 1]]
    const shift = ys[index] + tile.top - ys[index + 1] - next.top
    for (let row = 0; row < tile.right.length; row++) {
      const landscape = tile.right[row]
      if (next.left[row + shift] === landscape) {
        const a = find(index * 6 + landscape)
        const b = find((index + 1) * 6 + landscape)
        if (a !== b) parent[a] = b
      }
    }
  }
  const zoneOf = new Map<number, ZoneInfo>()
  const zones: ZoneInfo[] = []
  for (let index = 0; index < count; index++) {
    const tile = tileData[ids[index]]
    for (const landscape of tile.landscapes) {
      const root = find(index * 6 + landscape)
      let zone = zoneOf.get(root)
      if (!zone) {
        zone = { landscape, tiles: 0, flowers: 0, animals: 0, openLeft: false, openRight: false }
        zoneOf.set(root, zone)
        zones.push(zone)
      }
      zone.tiles++
      zone.flowers += tile.flowers[landscape]
      zone.animals += tile.animals[landscape]
      if (index === 0 && tile.left.includes(landscape)) zone.openLeft = true
      if (index === count - 1 && tile.right.includes(landscape)) zone.openRight = true
    }
  }
  const rivers: RiverInfo[] = []
  let current: RiverInfo | undefined
  for (let index = 0; index < count; index++) {
    const river = tileData[ids[index]].river
    if (!river) {
      current = undefined
      continue
    }
    const previous = index > 0 ? tileData[ids[index - 1]].river : undefined
    if (!current || !previous || ys[index - 1] + previous.right !== ys[index] + river.left) {
      current = { tiles: 0, waterfalls: 0, animals: 0, openLeft: index === 0, openRight: false }
      rivers.push(current)
    }
    current.tiles++
    if (river.waterfall) current.waterfalls++
    current.animals += river.animals
    if (index === count - 1) current.openRight = true
  }
  const start = panorama.startIndex
  const clouds: [number, number] = [0, 0]
  let crows = 0
  for (let index = 0; index < count; index++) {
    const tile = tileData[ids[index]]
    if (index < start) clouds[0] += tile.clouds
    else if (index > start) clouds[1] += tile.clouds
    crows += tile.crows
  }
  let terrainScore = 0
  for (const zone of zones) if (zone.landscape !== Landscape.Sky) terrainScore += zone.flowers * zone.animals
  return {
    zones,
    rivers,
    clouds,
    sideTiles: [start, count - 1 - start],
    totalClouds: clouds[0] + clouds[1] + tileData[ids[start]].clouds,
    crows,
    terrainScore
  }
}
