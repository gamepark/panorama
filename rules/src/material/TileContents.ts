/**
 * What is drawn on each tile, read from the publisher's files by tools/images/tiles_content.py: do not edit by hand.
 * Generated with: py -3.13 tools/images/tiles_content.py <publisher-dir> rules/src/material/TileContents.ts
 */
import { Landscape } from './Landscape'
import { TileContent } from './TileContent'

const { Sky: S, Mountain: M, Forest: W, Hills: H, Fields: F } = Landscape

/** The 36 Panorama Tiles, by number */
export const panoramaTileContents: Record<number, TileContent> = {
  1: { left: [S, M, H, H, H, F], right: [S, M, M, H, H, F], river: { left: 2, right: 3, waterfall: true, animals: 0 }, clouds: 1, animals: [], flowers: [F, H, M, M, M] },
  2: { left: [S, M, H, H, H, F], right: [S, M, M, H, H, F], river: { left: 2, right: 3, waterfall: true, animals: 1 }, clouds: 1, animals: [H], flowers: [F, M, M] },
  3: { left: [S, W, H, H, H, F], right: [S, W, W, H, H, F], river: { left: 2, right: 3, waterfall: true, animals: 0 }, clouds: 2, animals: [F], flowers: [W] },
  4: { left: [S, W, H, H, H, F], right: [S, W, W, H, H, F], river: { left: 2, right: 3, waterfall: true, animals: 0 }, clouds: 0, animals: [F], flowers: [H] },
  5: { left: [S, S, W, H, F, F], right: [S, S, W, H, F, F], clouds: 1, animals: [F, H], flowers: [] },
  6: { left: [S, W, W, H, F, F], right: [S, W, W, H, F, F], river: { left: 3, right: 3, waterfall: false, animals: 1 }, clouds: 0, animals: [F, W], flowers: [H, H] },
  7: { left: [S, S, W, H, H, F], right: [S, S, W, H, H, F], river: { left: 3, right: 3, waterfall: false, animals: 1 }, clouds: 1, animals: [H], flowers: [F, F, W] },
  8: { left: [S, S, W, H, F, F], right: [S, S, W, H, F, F], river: { left: 3, right: 3, waterfall: false, animals: 1 }, clouds: 0, animals: [H], flowers: [F] },
  9: { left: [S, M, M, H, H, F], right: [S, M, M, M, H, F], river: { left: 3, right: 4, waterfall: true, animals: 1 }, clouds: 0, animals: [H], flowers: [F] },
  10: { left: [S, M, M, H, H, F], right: [S, M, M, M, H, F], river: { left: 3, right: 4, waterfall: true, animals: 2 }, clouds: 0, animals: [H, M], flowers: [F] },
  11: { left: [S, M, W, F, F, F], right: [S, M, W, W, F, F], river: { left: 3, right: 4, waterfall: true, animals: 1 }, clouds: 0, animals: [F], flowers: [M, M] },
  12: { left: [S, M, W, F, F, F], right: [S, M, W, W, F, F], river: { left: 3, right: 4, waterfall: true, animals: 2 }, clouds: 0, animals: [F, M, W], flowers: [] },
  13: { left: [S, S, M, H, H, F], right: [S, S, M, M, H, F], river: { left: 3, right: 4, waterfall: true, animals: 1 }, clouds: 0, animals: [M], flowers: [F, H, H] },
  14: { left: [S, W, W, H, H, F], right: [S, W, W, W, H, F], river: { left: 3, right: 4, waterfall: true, animals: 2 }, clouds: 0, animals: [H, W], flowers: [F] },
  15: { left: [S, M, M, W, H, H], right: [S, M, M, W, H, H], river: { left: 4, right: 4, waterfall: false, animals: 1 }, clouds: 1, animals: [H, M], flowers: [] },
  16: { left: [S, S, M, H, H, F], right: [S, S, M, M, H, F], river: { left: 3, right: 4, waterfall: true, animals: 0 }, clouds: 1, animals: [], flowers: [F, F, H, H, M, M] },
  17: { left: [S, S, M, H, F, F], right: [S, S, M, H, F, F], clouds: 1, animals: [F, H], flowers: [M] },
  18: { left: [S, M, M, M, H, F], right: [S, M, M, M, H, F], river: { left: 4, right: 4, waterfall: false, animals: 0 }, clouds: 0, animals: [F, M], flowers: [] },
  19: { left: [S, M, W, W, H, H], right: [S, M, W, W, W, H], river: { left: 4, right: 5, waterfall: true, animals: 1 }, clouds: 2, animals: [M, W], flowers: [] },
  20: { left: [S, S, W, W, H, F], right: [S, S, W, W, H, F], river: { left: 4, right: 4, waterfall: false, animals: 0 }, clouds: 0, animals: [F], flowers: [H, H, H, W] },
  21: { left: [S, M, W, W, F, F], right: [S, M, W, W, W, F], river: { left: 4, right: 5, waterfall: true, animals: 2 }, clouds: 0, animals: [F, W], flowers: [] },
  22: { left: [S, M, W, W, F, F], right: [S, M, W, W, W, F], river: { left: 4, right: 5, waterfall: true, animals: 1 }, clouds: 0, animals: [W], flowers: [M, M] },
  23: { left: [S, S, M, W, F, F], right: [S, S, M, W, W, F], river: { left: 4, right: 5, waterfall: true, animals: 0 }, clouds: 2, animals: [], flowers: [F, W, W] },
  24: { left: [S, S, M, W, F, F], right: [S, S, M, W, W, F], river: { left: 4, right: 5, waterfall: true, animals: 1 }, clouds: 1, animals: [M, W], flowers: [] },
  25: { left: [S, M, M, M, W, F], right: [S, M, M, M, W, F], river: { left: 5, right: 5, waterfall: false, animals: 1 }, clouds: 1, animals: [F, M], flowers: [W, W] },
  26: { left: [S, M, M, M, W, H], right: [S, M, M, M, W, H], river: { left: 5, right: 5, waterfall: false, animals: 0 }, clouds: 0, animals: [], flowers: [H, M, M, W, W, W] },
  27: { left: [S, S, M, M, W, F], right: [S, S, M, M, W, F], river: { left: 5, right: 5, waterfall: false, animals: 1 }, clouds: 2, animals: [W], flowers: [F] },
  28: { left: [S, S, M, M, W, H], right: [S, S, M, M, W, H], river: { left: 5, right: 5, waterfall: false, animals: 2 }, clouds: 2, animals: [H, W], flowers: [M, M, M] },
  29: { left: [S, M, H, F, F, F], right: [S, M, H, F, F, F], clouds: 0, animals: [F], flowers: [M, M, M] },
  30: { left: [S, M, M, M, W, H], right: [S, M, M, M, W, H], clouds: 0, animals: [H, M, W], flowers: [] },
  31: { left: [S, W, W, W, H, F], right: [S, W, W, W, H, F], clouds: 1, animals: [W], flowers: [F, H] },
  32: { left: [S, W, W, W, H, F], right: [S, W, W, W, H, F], clouds: 1, animals: [F, H, W], flowers: [] },
  33: { left: [S, S, M, W, H, H], right: [S, S, M, W, H, H], river: { left: 4, right: 4, waterfall: false, animals: 1 }, clouds: 1, animals: [H], flowers: [W, W, W] },
  34: { left: [S, W, H, H, H, F], right: [S, W, H, H, H, F], clouds: 0, animals: [F], flowers: [H, W, W] },
  35: { left: [S, S, W, H, F, F], right: [S, S, W, H, F, F], clouds: 0, animals: [F], flowers: [H, W, W] },
  36: { left: [S, S, M, H, F, F], right: [S, S, M, H, F, F], river: { left: 3, right: 3, waterfall: false, animals: 2 }, clouds: 2, animals: [F, H, M], flowers: [] }
}

/** The 4 Starting Tiles are drawn alike */
export const startingTileContent: TileContent = { top: -1, left: [S, S, M, W, H, H, F], right: [S, S, M, W, W, H, F], river: { left: 3, right: 4, waterfall: true, animals: 0 }, clouds: 0, animals: [], flowers: [M, W, H, F] }
