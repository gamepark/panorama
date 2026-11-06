import { LocationType } from '@gamepark/panorama/material/LocationType'
import { MaterialType } from '@gamepark/panorama/material/MaterialType'
import { stackSize } from '@gamepark/panorama/material/PanoramaTile'
import { PlayerColor } from '@gamepark/panorama/PlayerColor'
import { DropAreaDescription, ItemContext, LocationContext, Locator, MaterialContext } from '@gamepark/react-game'
import { Coordinates, isMoveItemType, Location, MaterialItem } from '@gamepark/rules-api'
import { balloonSpaceAwaitingCss, balloonSpaceCss, balloonSpaceDropCss } from './BalloonSpace'
import { BalloonSpaceContent } from './BalloonSpaceContent'
import { balloonPosition, hotAirBalloonSize, sunMoonSide, sunPosition } from './TableLayout'

/** Above the top tile of a full stack, below the items standing in the space */
const spaceLevel = 0.05 * (stackSize + 1) + 0.05

/**
 * Where a Hot-Air Balloon can go: a click on it moves the balloon there, as well as dropping the balloon on it, so it is
 * drawn as both a landing spot and a button (see {@link balloonSpaceCss}).
 */
class BalloonSpaceDescription extends DropAreaDescription<PlayerColor, MaterialType, LocationType> {
  /** A round button, as wide as the balloon is tall, so that the balloon landing on it fits inside */
  width = hotAirBalloonSize.height
  height = hotAirBalloonSize.height
  borderRadius = hotAirBalloonSize.height / 2
  placeOnShortClick = true
  content = BalloonSpaceContent

  /** The framework tells the space when the item being dragged can be dropped on it: it then calls for the balloon */
  getExtraCss(_location: Location<PlayerColor, LocationType>, { canDrop }: LocationContext<PlayerColor, MaterialType, LocationType>) {
    return [balloonSpaceCss, canDrop && balloonSpaceAwaitingCss]
  }

  /**
   * The framework lifts a drop area towards the player while an item can be dropped on it, which, seen through the
   * perspective of the table, slides it across the screen. A space is empty when the balloon may land on it, so it has
   * nothing to rise above: it stays where it is, and only its look calls for the balloon.
   */
  getLocationTransform(location: Location<PlayerColor, LocationType>, context: LocationContext<PlayerColor, MaterialType, LocationType>) {
    return super.getLocationTransform(location, { ...context, canDrop: false })
  }

  get dropHighlight() {
    return balloonSpaceDropCss
  }
}

/**
 * The space at the outer end of a stack: the Hot-Air Balloon stands on the axis of the stack, the Sun/Moon beside it.
 * A deflated balloon lies on its side.
 */
class StackSpaceLocator extends Locator<PlayerColor, MaterialType, LocationType> {
  locationDescription = new BalloonSpaceDescription()

  /**
   * Only the spaces the balloon of the player may fly to are drawn: a button that cannot be pressed has nothing to say.
   * The items standing in a space are placed by {@link getItemCoordinates}, without the space being drawn.
   */
  getLocations({ rules, player }: MaterialContext<PlayerColor, MaterialType, LocationType>): Location<PlayerColor, LocationType>[] {
    if (player === undefined || !rules.isTurnToPlay(player)) return []
    return rules
      .getLegalMoves(player)
      .filter(isMoveItemType(MaterialType.HotAirBalloon))
      .filter((move) => move.location.type === LocationType.StackSpace)
      .map((move) => ({ type: LocationType.StackSpace, id: move.location.id }))
  }

  /**
   * The space is drawn over the tiles of the stack, whose top one stands at 0.05 × {@link stackSize} (see StackLocator),
   * so that the button is never hidden behind it; the items it holds stand higher still (see getItemCoordinates).
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
