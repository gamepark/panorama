import { LocationType } from '@gamepark/panorama/material/LocationType'
import { MaterialType } from '@gamepark/panorama/material/MaterialType'
import { PanoramaRules } from '@gamepark/panorama/PanoramaRules'
import { PlayerColor } from '@gamepark/panorama/PlayerColor'
import { ListLocator, MaterialContext } from '@gamepark/react-game'
import { Location } from '@gamepark/rules-api'
import { PanoramaLayout } from './PanoramaLayout'
import { firstObjectivePosition, objectiveGap } from './TableLayout'

/** The 3 Objectives, side by side in the bottom left corner of the table, which grows with the Panoramas */
class ObjectivesLocator extends ListLocator<PlayerColor, MaterialType, LocationType> {
  gap = { x: objectiveGap }

  getPositionDependencies(_location: Location<PlayerColor, LocationType>, { rules, player }: MaterialContext<PlayerColor, MaterialType, LocationType>) {
    return PanoramaLayout.of(rules as PanoramaRules, player).tableBounds()
  }

  getCoordinates(_location: unknown, { rules, player }: MaterialContext<PlayerColor, MaterialType, LocationType>) {
    return firstObjectivePosition(PanoramaLayout.of(rules as PanoramaRules, player).tableBounds())
  }
}

export const objectivesLocator = new ObjectivesLocator()
