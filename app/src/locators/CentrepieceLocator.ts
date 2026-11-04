import { LocationType } from '@gamepark/panorama/material/LocationType'
import { MaterialType } from '@gamepark/panorama/material/MaterialType'
import { PlayerColor } from '@gamepark/panorama/PlayerColor'
import { Locator, MaterialContext } from '@gamepark/react-game'
import { centrepiecePosition } from './TableLayout'

class CentrepieceLocator extends Locator<PlayerColor, MaterialType, LocationType> {
  getCoordinates(_location: unknown, { rules }: MaterialContext<PlayerColor, MaterialType, LocationType>) {
    return centrepiecePosition(rules.players.length)
  }
}

export const centrepieceLocator = new CentrepieceLocator()
