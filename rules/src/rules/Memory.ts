export enum Memory {
  /** The Panorama Tile previewed in the active player's Panorama: kept on their side only, until they validate */
  PreviewTile = 1
}

/** A previewed tile, and the stack it was taken from */
export type PreviewTile = { tile: number; stack: number }
