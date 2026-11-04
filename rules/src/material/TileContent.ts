import { Landscape } from './Landscape'

/**
 * What is drawn on a tile, row by row. A row is one wave high: tiles side by side, offset by whole waves, have their rows
 * level with each other. Rows are numbered from the top of a Panorama Tile (row 0 is its top row, of sky); a Starting
 * Tile is one wave taller, at the top, so its rows start at -1.
 *
 * Inside a tile, each landscape is one connected area: the tile goes down from the sky to the fields.
 */
export type TileContent = {
  /** Number of the first row: 0, or -1 for a Starting Tile */
  top?: number
  /** What touches the left edge, row by row from the top */
  left: Landscape[]
  /** What touches the right edge, row by row from the top */
  right: Landscape[]
  /**
   * The river crossing the tile, if any. It reaches each edge at a row boundary: boundary b runs between rows b - 1 and
   * b. A river with a waterfall goes down one row from the left edge to the right edge.
   */
  river?: { left: number; right: number; waterfall: boolean; animals: number }
  /** Number of clouds in the sky */
  clouds: number
  /** The landscape of each animal (each terrain has its own animal: bear, fox, sheep, crow) */
  animals: Landscape[]
  /** The landscape of each flower */
  flowers: Landscape[]
}
