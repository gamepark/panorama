import { LocationType } from '@gamepark/panorama/material/LocationType'
import { MaterialType } from '@gamepark/panorama/material/MaterialType'
import { PlayerColor } from '@gamepark/panorama/PlayerColor'
import { ItemContext, Locator, MaterialContext } from '@gamepark/react-game'
import { Coordinates, Location, MaterialItem } from '@gamepark/rules-api'
import { stackAngle, stackPosition } from './TableLayout'

/** Each tile sits a little higher than the one under it, so that the thickness of the stack shows */
const depthShift = 0.06

/**
 * A stack of Panorama Tiles, in front of its side of the Centrepiece, its sky pointing outwards.
 * Its bottom tile is x = 0, and each tile is drawn above the ones under it.
 */
class StackLocator extends Locator<PlayerColor, MaterialType, LocationType> {
  getItemCoordinates(item: MaterialItem<PlayerColor, LocationType>, context: ItemContext<PlayerColor, MaterialType, LocationType>): Partial<Coordinates> {
    const { x, y } = stackPosition(item.location.id, context.rules.players.length)
    const height = item.location.x ?? 0
    return { x: x - height * depthShift, y: y - height * depthShift, z: 0.05 * (height + 1) }
  }

  getRotateZ(location: Location<PlayerColor, LocationType>, { rules }: MaterialContext<PlayerColor, MaterialType, LocationType>) {
    return stackAngle(location.id, rules.players.length)
  }

  /** A tile taken from a stack straightens up as soon as it is dragged, as it will stand in the Panorama */
  getItemRotateZ(item: MaterialItem<PlayerColor, LocationType>, context: ItemContext<PlayerColor, MaterialType, LocationType>) {
    return context.isDragging ? 0 : super.getItemRotateZ(item, context)
  }
}

export const stackLocator = new StackLocator()
