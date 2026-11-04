import { LocationType } from '@gamepark/panorama/material/LocationType'
import { MaterialType } from '@gamepark/panorama/material/MaterialType'
import { PlayerColor } from '@gamepark/panorama/PlayerColor'
import { MaterialRules, XYCoordinates } from '@gamepark/rules-api'
import { PanoramaFrame, panoramaFrame, PanoramaSlot } from './PanoramaWindow'
import {
  boxGap,
  cardboardShadow,
  cells,
  columnWidth,
  commonColumnHeight,
  displayIndex,
  panelRooms,
  panelShare,
  panoramaLeft,
  rowGap,
  starLeft,
  startingTileBalloon,
  tableEdge,
  tileWaves,
  waveLength
} from './TableLayout'

type PanoramaRules = MaterialRules<PlayerColor, MaterialType, LocationType>

/** The tiles of a player's Panorama */
function panoramaSlots(player: PlayerColor, rules: PanoramaRules): PanoramaSlot[] {
  return [MaterialType.StartingTile, MaterialType.PanoramaTile].flatMap((type) =>
    rules
      .material(type)
      .location(LocationType.Panorama)
      .player(player)
      .getItems()
      .map((item) => ({ x: item.location.x!, y: item.location.y ?? 0, rise: type === MaterialType.StartingTile ? 1 : 0 }))
  )
}

const layouts = new WeakMap<object, Map<PlayerColor | undefined, PanoramaLayout>>()

/**
 * Where the Panoramas stand, for one state of the game. The box of each Panorama has a default size: it shifts over the
 * Panorama when this one does not fit in it, and grows when the Panorama is larger (see PanoramaWindow). The boxes form a grid (see TableLayout.cells): each column of the
 * grid is as wide as its widest box, each row as high as its highest box, and the table follows.
 */
export class PanoramaLayout {
  readonly count: number
  readonly frames: Partial<Record<PlayerColor, PanoramaFrame>>

  constructor(
    readonly players: PlayerColor[],
    slots: (player: PlayerColor) => PanoramaSlot[],
    readonly me?: PlayerColor
  ) {
    this.count = players.length
    this.frames = Object.fromEntries(players.map((player) => [player, panoramaFrame(this.count, slots(player))]))
  }

  /** The layout of this state of the game, computed once */
  static of(rules: PanoramaRules, me?: PlayerColor) {
    let byReader = layouts.get(rules.game)
    if (!byReader) {
      byReader = new Map()
      layouts.set(rules.game, byReader)
    }
    let layout = byReader.get(me)
    if (!layout) {
      layout = new PanoramaLayout(rules.players, (player) => panoramaSlots(player, rules), me)
      byReader.set(me, layout)
    }
    return layout
  }

  frame(player: PlayerColor) {
    return this.frames[player]!
  }

  cell(player: PlayerColor) {
    return cells(this.count)[displayIndex(player, this.players, this.me)]
  }

  /** From the left edge of the first column to the right edge of the last one, shadows excluded */
  boxWidth(player: PlayerColor) {
    return this.frame(player).columns * columnWidth + 0.1
  }

  boxHeight(player: PlayerColor) {
    return this.frame(player).waves * waveLength
  }

  /** The width of a column of the grid, and the height of a row, for the largest box they hold */
  private gridSize(side: 'column' | 'row', index: number) {
    const players = this.players.filter((player) => this.cell(player)[side] === index)
    return side === 'column'
      ? Math.max(...players.map((player) => this.boxWidth(player) + 2 * cardboardShadow + boxGap))
      : Math.max(...players.map((player) => this.boxHeight(player) + rowGap))
  }

  private get gridColumns() {
    return Math.max(...cells(this.count).map((cell) => cell.column)) + 1
  }

  private get gridRows() {
    return Math.max(...cells(this.count).map((cell) => cell.row)) + 1
  }

  /** The height of the Panoramas and of the room kept for the panels above or under them */
  get height() {
    let rows = 0
    for (let row = 0; row < this.gridRows; row++) rows += this.gridSize('row', row)
    return rows / (1 - panelRooms(this.count).length * panelShare(this.count))
  }

  /** The top left corner of a player's box: the left edge of its first column, and the top of the box */
  box(player: PlayerColor): XYCoordinates {
    const cell = this.cell(player)
    const height = this.height
    const panelRoom = panelShare(this.count) * height
    const roomsAbove = panelRooms(this.count).filter((room) => room.row < cell.row || (room.row === cell.row && room.panel === 'above'))
    let x = panoramaLeft(this.count)
    for (let column = 0; column < cell.column; column++) x += this.gridSize('column', column)
    let y = -height / 2 + rowGap / 2 + roomsAbove.length * panelRoom
    for (let row = 0; row < cell.row; row++) y += this.gridSize('row', row)
    return { x, y }
  }

  /** The middle of a tile at this column and offset of a player's Panorama */
  tileCenter(player: PlayerColor, x: number, y: number): XYCoordinates {
    const box = this.box(player)
    const frame = this.frame(player)
    return {
      x: box.x + (x - frame.column + 0.5) * columnWidth,
      y: box.y + (y - frame.top + tileWaves / 2) * waveLength
    }
  }

  /** The right edge of the Panoramas */
  get right() {
    let right = panoramaLeft(this.count)
    for (let column = 0; column < this.gridColumns; column++) right += this.gridSize('column', column)
    return right - boxGap - cardboardShadow
  }

  /**
   * Where a player's panel stands when the table is fully zoomed out, in centimetres of table: level with the balloon of
   * the Starting Tile on the right of the screen or just right of the Panorama, or above or under the Panorama, centred
   * on the column of the Starting Tile.
   */
  panelAnchor(player: PlayerColor) {
    const box = this.box(player)
    const frame = this.frame(player)
    const place = this.cell(player).panel
    // The Starting Tile is in column 0 at offset 0: its top edge is one wave above the Panorama Tiles
    const balloon = box.y + (-1 - frame.top) * waveLength + startingTileBalloon
    const startingTile = box.x + (0.5 - frame.column) * columnWidth
    switch (place) {
      case 'right':
        return { y: balloon, place }
      case 'beside':
        return { x: box.x + this.boxWidth(player) + cardboardShadow + boxGap, y: balloon, place }
      case 'above':
        return { x: startingTile, y: box.y, place }
      case 'below':
        return { x: startingTile, y: box.y + this.boxHeight(player), place }
    }
  }

  tableBounds() {
    const halfHeight = Math.max(commonColumnHeight(this.count), this.height) / 2
    return {
      xMin: starLeft(this.count) - tableEdge,
      xMax: this.right + 0.2,
      yMin: -halfHeight,
      yMax: halfHeight
    }
  }
}
