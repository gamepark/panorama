export enum LocationType {
  /** Middle of the table: the Centrepiece matching the player count */
  Centrepiece = 1,
  /**
   * A stack of Panorama Tiles around the Centrepiece. id: the stack, clockwise from the sunrise icon; x: height in the
   * stack, 0 being the bottom tile (the top tile has the highest x, as in a deck); rotation: the tile is revealed
   */
  Stack,
  /**
   * The space at the end of a stack, where a Hot-Air Balloon and the Sun/Moon token stand. id: the stack; rotation: the
   * balloon is deflated (its flight is over), or the token shows the Moon
   */
  StackSpace,
  /** A player's Panorama. x: column, 0 being the Starting Tile; y: vertical offset, in waves of the tile edges (positive is lower) */
  Panorama,
  /** The 3 Objective tokens of the game, visible to everyone */
  Objectives,
  /**
   * Drawn only, nothing goes there: at the end of the game, the Zones of terrain of a player's Panorama that score
   * points, outlined, with their score. player: the owner of the Panorama
   */
  ZoneScores
}
