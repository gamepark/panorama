/** The 36 Panorama Tiles, numbered like the backs of the printed tiles (01 to 36) */
export const panoramaTiles = Array.from({ length: 36 }, (_, index) => index + 1)

/** Tiles per stack at setup */
export const stackSize = 4

/** The Centrepiece has one side per stack: 6 at 2 players, 7 at 3, 8 at 4 */
export const getStackCount = (players: number) => players + 4

/**
 * The wavy edges of a Panorama Tile are 6 waves long. Tiles side by side interlock with any whole number of waves of
 * offset, as long as their edges still share at least one wave. The Starting Tile is one wave taller, at the top.
 */
export const tileWaves = 6
export const startingTileRise = 1
