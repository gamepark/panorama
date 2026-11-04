import { panoramaColumns, panoramaWaves, tileWaves } from './TableLayout'

/** The part of a Panorama its box shows: its first column, and the wave level with the top of the box */
export type PanoramaWindow = { column: number; top: number }

/** A tile of the Panorama: its column, its offset, and the waves it rises above a Panorama Tile (1 for the Starting Tile) */
export type PanoramaSlot = { x: number; y: number; rise: number }

/** By default, the Starting Tile stands in the middle of its box */
export function defaultPanoramaWindow(players: number): PanoramaWindow {
  return { column: -Math.floor((panoramaColumns(players) - 1) / 2), top: -1 - (panoramaWaves - tileWaves - 1) / 2 }
}

/** The smallest shift of the window that brings the whole Panorama back inside it */
export function fitPanoramaWindow(window: PanoramaWindow, slots: PanoramaSlot[], players: number): PanoramaWindow {
  if (!slots.length) return window
  const columns = panoramaColumns(players)
  let { column, top } = window
  const minX = Math.min(...slots.map((slot) => slot.x))
  const maxX = Math.max(...slots.map((slot) => slot.x))
  if (minX < column) column = minX
  else if (maxX > column + columns - 1) column = maxX - columns + 1
  const contentTop = Math.min(...slots.map((slot) => slot.y - slot.rise))
  const contentBottom = Math.max(...slots.map((slot) => slot.y + tileWaves))
  if (contentTop < top) top = contentTop
  else if (contentBottom > top + panoramaWaves) top = contentBottom - panoramaWaves
  return { column, top }
}
