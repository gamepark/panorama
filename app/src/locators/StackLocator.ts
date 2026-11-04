import { LocationType } from '@gamepark/panorama/material/LocationType'
import { MaterialType } from '@gamepark/panorama/material/MaterialType'
import { PlayerColor } from '@gamepark/panorama/PlayerColor'
import { ItemContext, Locator, MaterialContext } from '@gamepark/react-game'
import { Coordinates, Location, MaterialItem } from '@gamepark/rules-api'
import { stackAngle, stackPosition } from './TableLayout'

/** Each tile under the top one sits a little lower, so that the thickness of the stack shows */
const depthShift = 0.06

/**
 * A stack of Panorama Tiles, in front of its side of the Centrepiece, its sky pointing outwards.
 * Its top tile is x = 0, so it is drawn above the others.
 */
class StackLocator extends Locator<PlayerColor, MaterialType, LocationType> {
  getItemCoordinates(item: MaterialItem<PlayerColor, LocationType>, context: ItemContext<PlayerColor, MaterialType, LocationType>): Partial<Coordinates> {
    const { x, y } = stackPosition(item.location.id, context.rules.players.length)
    const depth = item.location.x ?? 0
    return { x: x + depth * depthShift, y: y + depth * depthShift, z: 0.05 * (4 - depth) }
  }

  getRotateZ(location: Location<PlayerColor, LocationType>, { rules }: MaterialContext<PlayerColor, MaterialType, LocationType>) {
    return stackAngle(location.id, rules.players.length)
  }
}

export const stackLocator = new StackLocator()
