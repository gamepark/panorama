import { LocationType } from '@gamepark/panorama/material/LocationType'
import { MaterialType } from '@gamepark/panorama/material/MaterialType'
import { getStackCount } from '@gamepark/panorama/material/PanoramaTile'
import { PlayerColor } from '@gamepark/panorama/PlayerColor'
import { DropAreaDescription, ItemContext, Locator, MaterialContext } from '@gamepark/react-game'
import { Coordinates, Location, MaterialItem } from '@gamepark/rules-api'
import { balloonPosition, hotAirBalloonSize, sunPosition } from './TableLayout'

/**
 * Where a Hot-Air Balloon can go: a click on it moves the balloon there, as well as dropping the balloon on it.
 */
class BalloonSpaceDescription extends DropAreaDescription<PlayerColor, MaterialType, LocationType> {
  width = hotAirBalloonSize.width
  height = hotAirBalloonSize.height
  borderRadius = hotAirBalloonSize.width / 2
  placeOnShortClick = true
}

/**
 * The space at the outer end of a stack: the Hot-Air Balloon stands on the axis of the stack, the Sun/Moon beside it.
 * A deflated balloon lies on its side.
 */
class StackSpaceLocator extends Locator<PlayerColor, MaterialType, LocationType> {
  locationDescription = new BalloonSpaceDescription()

  getLocations({ rules }: MaterialContext<PlayerColor, MaterialType, LocationType>) {
    return Array.from({ length: getStackCount(rules.players.length) }, (_, id) => ({ type: LocationType.StackSpace, id }))
  }

  getCoordinates(location: Location<PlayerColor, LocationType>, { rules }: MaterialContext<PlayerColor, MaterialType, LocationType>) {
    return balloonPosition(location.id, rules.players.length)
  }

  getItemCoordinates(item: MaterialItem<PlayerColor, LocationType>, context: ItemContext<PlayerColor, MaterialType, LocationType>): Partial<Coordinates> {
    const position = context.type === MaterialType.SunMoonToken ? sunPosition(item.location.id, context.rules.players.length) : this.getCoordinates(item.location, context)
    return { ...position, z: 0.5 }
  }

  getItemRotateZ(item: MaterialItem<PlayerColor, LocationType>, context: ItemContext<PlayerColor, MaterialType, LocationType>) {
    return context.type === MaterialType.HotAirBalloon && item.location.rotation ? 90 : 0
  }
}

export const stackSpaceLocator = new StackSpaceLocator()
