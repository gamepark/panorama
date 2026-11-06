import { css } from '@emotion/react'
import { LocationType } from '@gamepark/panorama/material/LocationType'
import { MaterialType } from '@gamepark/panorama/material/MaterialType'
import { getStackCount, stackSize } from '@gamepark/panorama/material/PanoramaTile'
import { PlayerColor } from '@gamepark/panorama/PlayerColor'
import { ItemContext, LocationDescription, Locator, MaterialContext } from '@gamepark/react-game'
import { Coordinates, Location, MaterialItem } from '@gamepark/rules-api'
import { StackCount } from './StackCount'
import { stackAngle, stackCountPosition, stackPosition } from './TableLayout'

/** Each tile sits a little higher than the one under it, so that the thickness of the stack shows */
const depthShift = 0.06

/** The size of the disc showing how many tiles are left in a stack, in cm */
const stackCountDiameter = 1.2

const stackCountCss = css`
  background: rgba(31, 62, 99, 0.9);
  border: 0.08em solid rgba(255, 255, 255, 0.9);
  box-sizing: border-box;
  box-shadow: 0 0.05em 0.15em rgba(0, 0, 0, 0.5);
  pointer-events: none;
`

/** The count of tiles left: a disc above the top tile of a full stack */
class StackCountDescription extends LocationDescription<PlayerColor, MaterialType, LocationType> {
  width = stackCountDiameter
  height = stackCountDiameter
  borderRadius = stackCountDiameter / 2
  extraCss = stackCountCss
  content = StackCount
}

/**
 * A stack of Panorama Tiles, in front of its side of the Centrepiece, its sky pointing outwards.
 * Its bottom tile is x = 0, and each tile is drawn above the ones under it.
 * The location of each stack that still holds tiles is drawn as the count of its tiles, at its inner end.
 */
class StackLocator extends Locator<PlayerColor, MaterialType, LocationType> {
  locationDescription = new StackCountDescription()

  getLocations({ rules }: MaterialContext<PlayerColor, MaterialType, LocationType>): Location<PlayerColor, LocationType>[] {
    const stacks = Array.from({ length: getStackCount(rules.players.length) }, (_, id) => id)
    const tiles = rules.material(MaterialType.PanoramaTile).location(LocationType.Stack)
    return stacks.filter((id) => tiles.locationId(id).length > 0).map((id) => ({ type: LocationType.Stack, id }))
  }

  getCoordinates(location: Location<PlayerColor, LocationType>, { rules }: MaterialContext<PlayerColor, MaterialType, LocationType>): Partial<Coordinates> {
    return { ...stackCountPosition(location.id, rules.players.length), z: 0.05 * (stackSize + 1) + 0.05 }
  }

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
