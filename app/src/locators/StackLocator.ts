import { LocationType } from '@gamepark/panorama/material/LocationType'
import { MaterialType } from '@gamepark/panorama/material/MaterialType'
import { PlayerColor } from '@gamepark/panorama/PlayerColor'
import { ItemContext, Locator } from '@gamepark/react-game'
import { Coordinates, MaterialItem } from '@gamepark/rules-api'
import { stackAngle, stackPosition } from './TableLayout'

/** Each tile sits higher than the one under it, far enough for the tiles left in the stack to be counted at a glance */
const depthShift = 0.18

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

  /** The tiles follow the axis of their stack; a tile taken from it straightens up as soon as it is dragged, as it will stand in the Panorama */
  getItemRotateZ(item: MaterialItem<PlayerColor, LocationType>, context: ItemContext<PlayerColor, MaterialType, LocationType>) {
    return context.isDragging ? 0 : stackAngle(item.location.id, context.rules.players.length)
  }
}

export const stackLocator = new StackLocator()
