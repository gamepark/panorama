/** What a tile shows, from the top down: the sky, then the 4 terrains, always in this order */
export enum Landscape {
  Sky = 1,
  Mountain,
  Forest,
  Hills,
  Fields
}

/** The 4 terrains: zones of terrain are scored, the sky is not a terrain */
export const terrains = [Landscape.Mountain, Landscape.Forest, Landscape.Hills, Landscape.Fields]
