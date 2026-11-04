export enum LocationType {
  /** Middle of the table: the Centrepiece matching the player count */
  Centrepiece = 1,
  /** A stack of Panorama Tiles around the Centrepiece. id: the stack, clockwise from the sunrise icon; x: depth, 0 being the top tile */
  Stack,
  /** The space at the end of a stack, where a Hot-Air Balloon and the Sun/Moon token stand. id: the stack */
  StackSpace,
  /** A player's Panorama. x: column, 0 being the Starting Tile; y: vertical offset, in waves of the tile edges (positive is lower) */
  Panorama,
  /** The 3 Objective tokens of the game, visible to everyone */
  Objectives
}
