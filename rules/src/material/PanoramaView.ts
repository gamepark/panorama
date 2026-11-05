import { MaterialRules, MaterialRulesPart } from '@gamepark/rules-api'
import { PlayerColor } from '../PlayerColor'
import { Landscape, terrains } from './Landscape'
import { LocationType } from './LocationType'
import { MaterialType } from './MaterialType'
import { TileContent } from './TileContent'
import { panoramaTileContents, startingTileContent } from './TileContents'

/** A tile of a Panorama: what is drawn on it, its column (the Starting Tile is 0) and its offset in waves */
export type PlacedTile = { content: TileContent; x: number; y: number }

/**
 * Connected areas of one landscape across the Panorama: a Zone of terrain, or a zone of sky. tileIndexes: the tiles it
 * spreads over, as indexes of PanoramaView.tiles (sorted from left to right)
 */
export type Zone = { landscape: Landscape; tiles: number; tileIndexes: number[]; animals: number; flowers: number }

/** A river, possibly crossing several tiles */
export type River = { tiles: number; waterfalls: number; animals: number }

/**
 * What a Panorama shows once its tiles are side by side: its zones of terrain and sky, and its rivers.
 *
 * Inside a tile, each landscape is one area. Two tiles side by side join their areas of the same landscape wherever these
 * touch the shared edge on the same row, and join their rivers if these reach the shared edge at the same row boundary.
 */
export class PanoramaView {
  /** The tiles from left to right */
  readonly tiles: PlacedTile[]

  constructor(tiles: PlacedTile[]) {
    this.tiles = [...tiles].sort((a, b) => a.x - b.x)
  }

  static of(rules: MaterialRules<PlayerColor, MaterialType, LocationType> | MaterialRulesPart<PlayerColor, MaterialType, LocationType>, player: PlayerColor) {
    const startingTile = rules.material(MaterialType.StartingTile).id(player).getItem()!
    const panoramaTiles = rules.material(MaterialType.PanoramaTile).location(LocationType.Panorama).player(player).getItems<number>()
    return new PanoramaView([
      { content: startingTileContent, x: startingTile.location.x!, y: startingTile.location.y ?? 0 },
      ...panoramaTiles.map((item) => ({ content: panoramaTileContents[item.id], x: item.location.x!, y: item.location.y ?? 0 }))
    ])
  }

  /** The tiles on the left of the Starting Tile, and on its right */
  get sides(): PlacedTile[][] {
    return [this.tiles.filter((tile) => tile.x < 0), this.tiles.filter((tile) => tile.x > 0)]
  }

  /** The zones of terrain and of sky */
  get zones(): Zone[] {
    const roots = new UnionFind()
    const area = (index: number, landscape: Landscape) => index * 10 + landscape
    this.tiles.forEach((tile, index) => {
      for (const landscape of [...tile.content.left, ...tile.content.right]) roots.add(area(index, landscape))
    })
    this.tiles.forEach((tile, index) => {
      const next = this.tiles[index + 1]
      if (!next) return
      tile.content.right.forEach((landscape, row) => {
        const absoluteRow = tile.y + (tile.content.top ?? 0) + row
        if (next.content.left[absoluteRow - next.y - (next.content.top ?? 0)] === landscape) {
          roots.union(area(index, landscape), area(index + 1, landscape))
        }
      })
    })
    return roots.groups().map((areas) => {
      const landscape = areas[0] % 10
      const tileIndexes = areas.map((key) => Math.floor(key / 10)).sort((a, b) => a - b)
      const tiles = tileIndexes.map((index) => this.tiles[index].content)
      return {
        landscape,
        tiles: tiles.length,
        tileIndexes,
        animals: tiles.reduce((sum, content) => sum + content.animals.filter((animal) => animal === landscape).length, 0),
        flowers: tiles.reduce((sum, content) => sum + content.flowers.filter((flower) => flower === landscape).length, 0)
      }
    })
  }

  get terrainZones(): Zone[] {
    return this.zones.filter((zone) => terrains.includes(zone.landscape))
  }

  /** The rivers: two tiles side by side join their rivers if these reach the shared edge at the same height */
  get rivers(): River[] {
    const roots = new UnionFind()
    this.tiles.forEach((tile, index) => {
      if (!tile.content.river) return
      roots.add(index)
      const next = this.tiles[index + 1]
      if (next?.content.river && tile.y + tile.content.river.right === next.y + next.content.river.left) {
        roots.add(index + 1)
        roots.union(index, index + 1)
      }
    })
    return roots.groups().map((indexes) => {
      const rivers = indexes.map((index) => this.tiles[index].content.river!)
      return {
        tiles: indexes.length,
        waterfalls: rivers.filter((river) => river.waterfall).length,
        animals: rivers.reduce((sum, river) => sum + river.animals, 0)
      }
    })
  }

  /** The points of a terrain: for each of its zones, its flowers times its animals */
  terrainScore(terrain: Landscape) {
    return this.terrainZones.filter((zone) => zone.landscape === terrain).reduce((sum, zone) => sum + zone.flowers * zone.animals, 0)
  }
}

/** Groups numbers that are joined together */
class UnionFind {
  parents = new Map<number, number>()

  add(key: number) {
    if (!this.parents.has(key)) this.parents.set(key, key)
  }

  find(key: number): number {
    const parent = this.parents.get(key)!
    if (parent === key) return key
    const root = this.find(parent)
    this.parents.set(key, root)
    return root
  }

  union(a: number, b: number) {
    this.parents.set(this.find(a), this.find(b))
  }

  groups(): number[][] {
    const groups = new Map<number, number[]>()
    for (const key of this.parents.keys()) {
      const root = this.find(key)
      groups.set(root, [...(groups.get(root) ?? []), key])
    }
    return [...groups.values()]
  }
}
