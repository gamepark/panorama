import { LocationType } from '@gamepark/panorama/material/LocationType'
import { MaterialType } from '@gamepark/panorama/material/MaterialType'
import { getStackCount } from '@gamepark/panorama/material/PanoramaTile'
import { PlayerColor } from '@gamepark/panorama/PlayerColor'
import { RuleId } from '@gamepark/panorama/rules/RuleId'
import { MaterialGameAnimations, Waypoint } from '@gamepark/react-game'
import { isMoveItemType, MaterialMove } from '@gamepark/rules-api'
import { balloonPosition } from '../locators/TableLayout'

export const gameAnimations = new MaterialGameAnimations<PlayerColor, MaterialType, LocationType, RuleId>()

/**
 * Keyframes along the flight of a balloon: enough for the chords between them to read as an arc. The framework rounds
 * keyframes to whole percents: 100 must be a multiple of this, or the steps would be uneven and the flight jerky.
 */
const flightSteps = 25
/** Duration of a flight: a take-off and a landing, then the time spent travelling past each stack */
const flightBaseDuration = 700
const flightDurationPerStack = 250

/** How far the balloon has flown along its arc at a point in time: it speeds up after take-off and slows down to land */
const easeInOut = (t: number) => (1 - Math.cos(Math.PI * t)) / 2

/** The number of stacks a balloon passes, flying clockwise from its stack to the stack of the move, or 0 when it stays */
function flightLength(move: MaterialMove<PlayerColor, MaterialType, LocationType>, players: number, from: number) {
  if (!isMoveItemType(MaterialType.HotAirBalloon)(move) || move.location.type !== LocationType.StackSpace) return 0
  const stacks = getStackCount(players)
  return ((move.location.id as number) - from + stacks) % stacks
}

/**
 * A Hot-Air Balloon that flies to another stack goes round the Centrepiece clockwise, at the distance of the spaces,
 * instead of crossing the star, rising along the default arc. The keyframes are spread evenly in time (linear easing
 * between them, which would otherwise ease every chord), the ease of the whole flight lying in the angle reached at
 * each of them.
 */
for (let length = 1; length < getStackCount(4); length++) {
  gameAnimations
    .configure((move, { rules }) => {
      if (!isMoveItemType(MaterialType.HotAirBalloon)(move)) return false
      const from = rules.material(MaterialType.HotAirBalloon).getItem(move.itemIndex).location.id as number
      return flightLength(move, rules.players.length, from) === length
    })
    .duration(flightBaseDuration + length * flightDurationPerStack)
    .trajectory(({ rules }, move) => {
      const players = rules.players.length
      const from = rules.material(MaterialType.HotAirBalloon).getItem((move as { itemIndex: number }).itemIndex).location.id as number
      const waypoints: Waypoint<PlayerColor, MaterialType, LocationType>[] = []
      for (let step = 1; step < flightSteps; step++) {
        const at = step / flightSteps
        waypoints.push({ at, coordinates: balloonPosition(from + length * easeInOut(at), players) })
      }
      return { easing: 'linear', waypoints }
    })
}
