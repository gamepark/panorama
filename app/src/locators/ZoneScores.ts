import { LocationType } from '@gamepark/panorama/material/LocationType'
import { MaterialType } from '@gamepark/panorama/material/MaterialType'
import { PanoramaView } from '@gamepark/panorama/material/PanoramaView'
import { PlayerColor } from '@gamepark/panorama/PlayerColor'
import { MaterialRules } from '@gamepark/rules-api'
import { panoramaTileIcons, startingTileIcons, TileIcon } from '../material/TileIcons'
import { columnWidth, startingTileRise, waveLength } from './TableLayout'

/**
 * The Zones of terrain of a Panorama that score points, as they are drawn at the end of the game: an outline, and the
 * score inside it.
 *
 * A tile is a stack of rows one wave high (see tools/images/tiles_content.py), each of one landscape, except the row of
 * a waterfall: the river crosses it from the top left corner to the bottom right corner, the lower terrain on its left,
 * the upper one on its right. So every cell (a row of a tile) is cut along that diagonal into 2 triangles, the upper
 * right one showing what touches the right edge, the lower left one what touches the left edge. A Zone is a set of such
 * triangles, and its outline is made of the sides that no triangle of the same Zone shares.
 *
 * Coordinates are in cm, from the middle of a Panorama Tile at column 0 and offset 0 (the origin of the Panorama grid),
 * y downwards. The corners of the cells stand on a lattice: column edges every half column, row boundaries every wave.
 */

type XY = { x: number; y: number }

/** A corner of a cell: column edge (2 per column, odd numbers), and row boundary (the top of absolute row n is n) */
type Corner = { c: number; n: number }

type Edge = { from: Corner; to: Corner }

export type ZoneScore = {
  /** The outline, slightly inside the Zone, as closed loops */
  loops: XY[][]
  /** Where the score stands: the place farthest from the animals, the flowers and the outline */
  label: XY
  score: number
}

/**
 * The boundary between rows 2 and 3 of a tile, from its middle, as it shows on the tile. The image of a terrain row
 * starts at -0.166 cm in the publisher's files, but the terrain drawn in it about 3 mm lower: measured along the edges of
 * the 36 tile images, every boundary between 2 landscapes lies 2.4 to 3.9 mm below the top of its row image. With this
 * value, the bottom of the last row (3 waves lower) is the bottom edge of the tile, at 4.79 cm.
 */
const rowBoundary3 = 0.14
/** How far inside its Zone the outline runs, so that the outlines of 2 neighbouring Zones do not overlap */
export const outlineInset = 0.15
/** The radius of the disc holding the score */
export const labelRadius = 0.6

const point = ({ c, n }: Corner): XY => ({ x: (c * columnWidth) / 2, y: rowBoundary3 + (n - 3) * waveLength })
const key = ({ c, n }: Corner) => `${c},${n}`

/** Room around the outlines and the scores, in cm */
const margin = 1

/**
 * The size of the drawing: centred on the origin of the Panorama grid (see ZoneScores), wide and high enough for every
 * outline and score of the Panorama.
 */
export function drawingSize(rules: MaterialRules<PlayerColor, MaterialType, LocationType>, player: PlayerColor) {
  const points = getZoneScores(rules, player).flatMap((zone) => [...zone.loops.flat(), zone.label])
  return {
    width: 2 * (Math.max(0, ...points.map((point) => Math.abs(point.x))) + labelRadius + margin),
    height: 2 * (Math.max(0, ...points.map((point) => Math.abs(point.y))) + labelRadius + margin)
  }
}

export function getZoneScores(rules: MaterialRules<PlayerColor, MaterialType, LocationType>, player: PlayerColor): ZoneScore[] {
  const view = PanoramaView.of(rules, player)
  const columns = new Map(view.tiles.map((tile, index) => [tile.x, index]))
  const icons = panoramaIcons(rules, player)

  /** The landscape of a triangle: the upper right one of the cell of absolute row n of the tile at column x, or the lower left one */
  const landscape = (x: number, n: number, upperRight: boolean) => {
    const index = columns.get(x)
    if (index === undefined) return undefined
    const { content, y } = view.tiles[index]
    const row = n - y - (content.top ?? 0)
    return { index, landscape: (upperRight ? content.right : content.left)[row] }
  }

  return view.terrainZones
    .filter((zone) => zone.flowers * zone.animals > 0)
    .map((zone) => {
      const inZone = (x: number, n: number, upperRight: boolean) => {
        const triangle = landscape(x, n, upperRight)
        return triangle !== undefined && triangle.landscape === zone.landscape && zone.tileIndexes.includes(triangle.index)
      }
      const triangles: { x: number; n: number; upperRight: boolean }[] = []
      const edges: Edge[] = []
      for (const index of zone.tileIndexes) {
        const { x, y, content } = view.tiles[index]
        content.left.forEach((_, row) => {
          const n = y + (content.top ?? 0) + row
          const tl = { c: 2 * x - 1, n }
          const tr = { c: 2 * x + 1, n }
          const br = { c: 2 * x + 1, n: n + 1 }
          const bl = { c: 2 * x - 1, n: n + 1 }
          // Each triangle goes clockwise on screen: its inside is on the right of every side
          if (inZone(x, n, true)) {
            triangles.push({ x, n, upperRight: true })
            if (!inZone(x, n - 1, false)) edges.push({ from: tl, to: tr })
            if (!inZone(x + 1, n, false)) edges.push({ from: tr, to: br })
            if (!inZone(x, n, false)) edges.push({ from: br, to: tl })
          }
          if (inZone(x, n, false)) {
            triangles.push({ x, n, upperRight: false })
            if (!inZone(x, n, true)) edges.push({ from: tl, to: br })
            if (!inZone(x, n + 1, true)) edges.push({ from: br, to: bl })
            if (!inZone(x - 1, n, true)) edges.push({ from: bl, to: tl })
          }
        })
      }
      const outline = loops(edges).map((loop) => loop.map(point))
      return {
        loops: outline.map((loop) => inset(loop, outlineInset)),
        label: labelPlace(triangles, outline, icons),
        score: zone.flowers * zone.animals
      }
    })
}

/** The animals and flowers of a Panorama, in the coordinates of its grid */
function panoramaIcons(rules: MaterialRules<PlayerColor, MaterialType, LocationType>, player: PlayerColor): TileIcon[] {
  const at = (icons: TileIcon[], x: number, y: number) => icons.map((icon) => ({ ...icon, x: icon.x + x, y: icon.y + y }))
  const startingTile = rules.material(MaterialType.StartingTile).id(player).getItem()!.location
  return [
    ...at(startingTileIcons, startingTile.x! * columnWidth, (startingTile.y ?? 0) * waveLength - startingTileRise),
    ...rules
      .material(MaterialType.PanoramaTile)
      .location(LocationType.Panorama)
      .player(player)
      .getItems<number>()
      .flatMap((item) => at(panoramaTileIcons[item.id], item.location.x! * columnWidth, (item.location.y ?? 0) * waveLength))
  ]
}

/** Chains the sides of the outline into closed loops, merging the sides that carry on in the same direction */
function loops(edges: Edge[]): Corner[][] {
  const starting = new Map<string, Edge[]>()
  for (const edge of edges) starting.set(key(edge.from), [...(starting.get(key(edge.from)) ?? []), edge])
  const used = new Set<Edge>()
  const result: Corner[][] = []
  for (const first of edges) {
    if (used.has(first)) continue
    const loop: Corner[] = []
    let edge: Edge | undefined = first
    while (edge && !used.has(edge)) {
      used.add(edge)
      loop.push(edge.from)
      edge = starting.get(key(edge.to))?.find((next) => !used.has(next))
    }
    result.push(loop.filter((corner, index) => !isStraight(loop[(index + loop.length - 1) % loop.length], corner, loop[(index + 1) % loop.length])))
  }
  return result
}

const isStraight = (a: Corner, b: Corner, c: Corner) => (b.c - a.c) * (c.n - b.n) === (b.n - a.n) * (c.c - b.c)

/** Moves every side of a clockwise loop inwards, its corners following the bisector of their 2 sides */
function inset(loop: XY[], distance: number): XY[] {
  const normal = (a: XY, b: XY) => {
    const length = Math.hypot(b.x - a.x, b.y - a.y)
    return { x: -(b.y - a.y) / length, y: (b.x - a.x) / length }
  }
  return loop.map((corner, index) => {
    const n1 = normal(loop[(index + loop.length - 1) % loop.length], corner)
    const n2 = normal(corner, loop[(index + 1) % loop.length])
    const scale = distance / Math.max(1 + n1.x * n2.x + n1.y * n2.y, 0.2)
    return { x: corner.x + (n1.x + n2.x) * scale, y: corner.y + (n1.y + n2.y) * scale }
  })
}

/**
 * The place of the score: among points spread over the cells of the Zone, the one whose disc keeps farthest from the
 * animals, the flowers and the outline.
 */
function labelPlace(triangles: { x: number; n: number; upperRight: boolean }[], outline: XY[][], icons: TileIcon[]): XY {
  const sides = outline.flatMap((loop) => loop.map((corner, index) => [corner, loop[(index + 1) % loop.length]] as const))
  let best: XY = { x: 0, y: 0 }
  let bestRoom = -Infinity
  for (const { x, n, upperRight } of triangles) {
    const topLeft = point({ c: 2 * x - 1, n })
    const bottomRight = point({ c: 2 * x + 1, n: n + 1 })
    for (let i = 1; i < 10; i++) {
      for (let j = 1; j < 6; j++) {
        const fx = i / 10
        const fy = j / 6
        if (fy < fx !== upperRight) continue
        const candidate = { x: topLeft.x + fx * (bottomRight.x - topLeft.x), y: topLeft.y + fy * (bottomRight.y - topLeft.y) }
        const room = Math.min(
          ...icons.map((icon) => Math.hypot(icon.x - candidate.x, icon.y - candidate.y) - icon.r),
          ...sides.map(([a, b]) => distanceToSegment(candidate, a, b) - outlineInset)
        )
        if (room > bestRoom) {
          bestRoom = room
          best = candidate
        }
      }
    }
  }
  return best
}

function distanceToSegment(p: XY, a: XY, b: XY) {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy)))
  return Math.hypot(p.x - a.x - t * dx, p.y - a.y - t * dy)
}
