import { panoramaColumns, panoramaWaves, tileWaves } from './TableLayout'

/**
 * The part of the grid of a Panorama that its box shows: its first column, the wave level with its top, and its size.
 * Columns are numbered from the Starting Tile (0), waves from the top of the Panorama Tiles at offset 0.
 */
export type PanoramaFrame = { column: number; top: number; columns: number; waves: number }

/** A tile of the Panorama: its column, its offset, and the waves it rises above a Panorama Tile (1 for the Starting Tile) */
export type PanoramaSlot = { x: number; y: number; rise: number }

/**
 * By default, a box has room for a Panorama a little longer than usual at this player count, and for 2 waves of offset
 * above and below the Starting Tile, which stands in its middle.
 */
export function defaultPanoramaFrame(players: number): PanoramaFrame {
  return {
    column: -Math.floor((panoramaColumns(players) - 1) / 2),
    top: -1 - (panoramaWaves - tileWaves - 1) / 2,
    columns: panoramaColumns(players),
    waves: panoramaWaves
  }
}

/**
 * The box of a Panorama, in each direction: the default one while the Panorama fits in it; shifted just enough to hold
 * the Panorama when it is not larger than the default box; and grown to the size of the Panorama when it is larger.
 * It only depends on the tiles of the Panorama, so the box never lags behind the game.
 */
export function panoramaFrame(players: number, slots: PanoramaSlot[]): PanoramaFrame {
  const frame = defaultPanoramaFrame(players)
  if (!slots.length) return frame
  const [column, columns] = fit(frame.column, frame.columns, Math.min(...slots.map((slot) => slot.x)), Math.max(...slots.map((slot) => slot.x)) + 1)
  const [top, waves] = fit(
    frame.top,
    frame.waves,
    Math.min(...slots.map((slot) => slot.y - slot.rise)),
    Math.max(...slots.map((slot) => slot.y + tileWaves))
  )
  return { column, top, columns, waves }
}

/** Where a box of this default start and size stands, and its size, to hold the content from start to end */
function fit(defaultStart: number, defaultSize: number, start: number, end: number): [number, number] {
  if (end - start > defaultSize) return [start, end - start]
  return [Math.min(Math.max(defaultStart, end - defaultSize), start), defaultSize]
}
