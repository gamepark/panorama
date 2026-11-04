import { LocationType } from '@gamepark/panorama/material/LocationType'
import { MaterialType } from '@gamepark/panorama/material/MaterialType'
import { PlayerColor } from '@gamepark/panorama/PlayerColor'
import { ItemContext, Locator } from '@gamepark/react-game'
import { Coordinates, MaterialItem } from '@gamepark/rules-api'
import { balloonPosition, sunPosition } from './TableLayout'

/**
 * The space at the outer end of a stack: the Hot-Air Balloon stands next to the tiles, the Sun/Moon a little further.
 */
class StackSpaceLocator extends Locator<PlayerColor, MaterialType, LocationType> {
  getItemCoordinates(item: MaterialItem<PlayerColor, LocationType>, context: ItemContext<PlayerColor, MaterialType, LocationType>): Partial<Coordinates> {
    const players = context.rules.players.length
    const position = context.type === MaterialType.SunMoonToken ? sunPosition(item.location.id, players) : balloonPosition(item.location.id, players)
    return { ...position, z: 0.5 }
  }
}

export const stackSpaceLocator = new StackSpaceLocator()
