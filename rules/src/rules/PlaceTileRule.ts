import { Material, MaterialMove } from '@gamepark/rules-api'
import { LocationType } from '../material/LocationType'
import { MaterialType } from '../material/MaterialType'
import { PlayerColor } from '../PlayerColor'
import { PanoramaTurnRule } from './PanoramaTurnRule'

/**
 * The player adds the top tile of the stack where their Hot-Air Balloon stands to the left or to the right of their
 * Panorama, with any vertical offset that keeps it interlocked with its neighbour (see PanoramaTurnRule).
 */
export class PlaceTileRule extends PanoramaTurnRule {
  /** The tile to lay: the one previewed in the Panorama, or else the top tile of the stack */
  get tile(): Material<PlayerColor, MaterialType, LocationType> {
    const preview = this.preview
    if (preview) return this.material(MaterialType.PanoramaTile).index(preview.tile)
    return this.topTile(this.balloon.getItem()!.location.id as number)
  }

  getPlayerMoves(): MaterialMove<PlayerColor, MaterialType, LocationType>[] {
    const tile = this.tile
    return tile.length ? this.placeTile(tile) : []
  }
}
