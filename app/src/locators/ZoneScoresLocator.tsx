import { css } from '@emotion/react'
import { LocationType } from '@gamepark/panorama/material/LocationType'
import { MaterialType } from '@gamepark/panorama/material/MaterialType'
import { PlayerColor } from '@gamepark/panorama/PlayerColor'
import { LocationDescription, Locator, MaterialContext } from '@gamepark/react-game'
import { Location, MaterialRules } from '@gamepark/rules-api'
import { PanoramaLayout } from './PanoramaLayout'
import { drawingSize } from './ZoneScores'
import { ZoneScoresDrawing } from './ZoneScoresDrawing'

type PanoramaRules = MaterialRules<PlayerColor, MaterialType, LocationType>

class ZoneScoresDescription extends LocationDescription<PlayerColor, MaterialType, LocationType> {
  content = ZoneScoresDrawing
  extraCss = css`
    pointer-events: none;
  `

  getLocationSize(location: Location<PlayerColor, LocationType>, { rules }: MaterialContext<PlayerColor, MaterialType, LocationType>) {
    return drawingSize(rules as PanoramaRules, location.player!)
  }
}

/** Once the game is over, over each Panorama: its Zones of terrain that score, and how much (rulebook page 10) */
class ZoneScoresLocator extends Locator<PlayerColor, MaterialType, LocationType> {
  locationDescription = new ZoneScoresDescription()

  getLocations({ rules }: MaterialContext<PlayerColor, MaterialType, LocationType>): Location<PlayerColor, LocationType>[] {
    if (!rules.isOver()) return []
    return rules.players.map((player) => ({ type: LocationType.ZoneScores, player }))
  }

  getPositionDependencies(_location: Location<PlayerColor, LocationType>, { rules, player }: MaterialContext<PlayerColor, MaterialType, LocationType>) {
    return PanoramaLayout.of(rules as PanoramaRules, player).frames
  }

  getCoordinates(location: Location<PlayerColor, LocationType>, { rules, player }: MaterialContext<PlayerColor, MaterialType, LocationType>) {
    return { ...PanoramaLayout.of(rules as PanoramaRules, player).tileCenter(location.player!, 0, 0), z: 1 }
  }
}

export const zoneScoresLocator = new ZoneScoresLocator()
