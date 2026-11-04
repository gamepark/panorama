import { LocationType } from '@gamepark/panorama/material/LocationType'
import { MaterialType } from '@gamepark/panorama/material/MaterialType'
import { PlayerColor } from '@gamepark/panorama/PlayerColor'
import { ListLocator, MaterialContext } from '@gamepark/react-game'
import { firstObjectivePosition, objectiveGap } from './TableLayout'

/** The 3 Objectives, side by side in the bottom right corner of the common elements */
class ObjectivesLocator extends ListLocator<PlayerColor, MaterialType, LocationType> {
  gap = { x: objectiveGap }

  getCoordinates(_location: unknown, { rules }: MaterialContext<PlayerColor, MaterialType, LocationType>) {
    return firstObjectivePosition(rules.players.length)
  }
}

export const objectivesLocator = new ObjectivesLocator()
