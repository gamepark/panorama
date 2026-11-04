import { LocationType } from '@gamepark/panorama/material/LocationType'
import { MaterialType } from '@gamepark/panorama/material/MaterialType'
import { Objective } from '@gamepark/panorama/material/Objective'
import { PlayerColor } from '@gamepark/panorama/PlayerColor'
import { TokenDescription } from '@gamepark/react-game'
import { centrepieceImages, objectiveImages, startingTileImages } from '../images/Images'
import { centrepieceSizes, objectiveSize, startingTileSize } from '../locators/TableLayout'

/**
 * Cardboard pieces, cut out along their die line: their images carry the shadow, so they are declared with the full
 * size of the image.
 */

export class CentrepieceDescription extends TokenDescription<PlayerColor, MaterialType, LocationType, number> {
  transparency = true
  images = centrepieceImages

  getSize(players: number) {
    return centrepieceSizes[players]
  }
}

export class StartingTileDescription extends TokenDescription<PlayerColor, MaterialType, LocationType, PlayerColor> {
  width = startingTileSize.width
  height = startingTileSize.height
  transparency = true
  images = startingTileImages
}

export class ObjectiveTokenDescription extends TokenDescription<PlayerColor, MaterialType, LocationType, Objective> {
  width = objectiveSize.width
  height = objectiveSize.height
  transparency = true
  images = objectiveImages
}
