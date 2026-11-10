import { LocationType } from '@gamepark/panorama/material/LocationType'
import { MaterialType } from '@gamepark/panorama/material/MaterialType'
import { stackSize } from '@gamepark/panorama/material/PanoramaTile'
import { PlayerColor } from '@gamepark/panorama/PlayerColor'
import { DropAreaDescription, ItemContext, LocationContext, Locator, MaterialContext } from '@gamepark/react-game'
import { Coordinates, Location, MaterialItem } from '@gamepark/rules-api'
import { balloonPosition, hotAirBalloonSize, sunMoonSide, sunPosition } from './TableLayout'

/** Above the top tile of a full stack, below the items standing in the space */
const spaceLevel = 0.05 * (stackSize + 1) + 0.05

/** Where a Hot-Air Balloon can go: a round drop area, as wide as the balloon is tall, so that the balloon landing on it fits inside */
class BalloonSpaceDescription extends DropAreaDescription<PlayerColor, MaterialType, LocationType> {
  width = hotAirBalloonSize.height
  height = hotAirBalloonSize.height
  borderRadius = hotAirBalloonSize.height / 2

  /**
   * The framework lifts a drop area towards the player while an item can be dropped on it, which, seen through the
   * perspective of the table, slides it across the screen. A space is empty when the balloon may land on it, so it has
   * nothing to rise above: it stays where it is, and only its look calls for the balloon.
   */
  getLocationTransform(location: Location<PlayerColor, LocationType>, context: LocationContext<PlayerColor, MaterialType, LocationType>) {
    return super.getLocationTransform(location, { ...context, canDrop: false })
  }
}

/**
 * The space at the outer end of a stack: the Hot-Air Balloon stands on the axis of the stack, the Sun/Moon beside it.
 * A deflated balloon lies on its side.
 * The spaces the balloon may fly to are only drawn while it is dragged, as the framework does by default.
 */
class StackSpaceLocator extends Locator<PlayerColor, MaterialType, LocationType> {
  locationDescription = new BalloonSpaceDescription()

  /**
   * The space is drawn over the tiles of the stack, whose top one stands at 0.05 × {@link stackSize} (see StackLocator),
   * so that the drop area is never hidden behind it; the items it holds stand higher still (see getItemCoordinates).
   */
  getCoordinates(location: Location<PlayerColor, LocationType>, { rules }: MaterialContext<PlayerColor, MaterialType, LocationType>): Partial<Coordinates> {
    return { ...balloonPosition(location.id, rules.players.length), z: spaceLevel }
  }

  getItemCoordinates(item: MaterialItem<PlayerColor, LocationType>, context: ItemContext<PlayerColor, MaterialType, LocationType>): Partial<Coordinates> {
    if (context.type === MaterialType.SunMoonToken) {
      // The face of the token on its spot, its side hanging below
      const { x, y } = sunPosition(item.location.id, context.rules.players.length)
      return { x, y: y + sunMoonSide / 2, z: 0.5 }
    }
    return { ...balloonPosition(item.location.id, context.rules.players.length), z: 0.5 }
  }

  getItemRotateZ(item: MaterialItem<PlayerColor, LocationType>, context: ItemContext<PlayerColor, MaterialType, LocationType>) {
    return context.type === MaterialType.HotAirBalloon && item.location.rotation ? 90 : 0
  }
}

export const stackSpaceLocator = new StackSpaceLocator()
