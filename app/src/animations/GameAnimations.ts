import { LocationType } from '@gamepark/panorama/material/LocationType'
import { MaterialType } from '@gamepark/panorama/material/MaterialType'
import { getStackCount } from '@gamepark/panorama/material/PanoramaTile'
import { PlayerColor } from '@gamepark/panorama/PlayerColor'
import { RuleId } from '@gamepark/panorama/rules/RuleId'
import { MaterialGameAnimations, Waypoint } from '@gamepark/react-game'
import { isMoveItemType, MaterialMove, XYCoordinates } from '@gamepark/rules-api'
import { balloonPosition, sunTokenPosition } from '../locators/TableLayout'

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

/** The pieces that fly round the Centrepiece from one stack space to another, and where they stand at a stack */
const flyingPieces: [MaterialType, (stack: number, players: number) => XYCoordinates][] = [
  [MaterialType.HotAirBalloon, balloonPosition],
  [MaterialType.SunMoonToken, sunTokenPosition]
]

/** The number of stacks a piece passes, flying clockwise from its stack to the stack of the move, or 0 when it stays */
function flightLength(move: MaterialMove<PlayerColor, MaterialType, LocationType>, type: MaterialType, players: number, from: number) {
  if (!isMoveItemType(type)(move) || move.location.type !== LocationType.StackSpace) return 0
  const stacks = getStackCount(players)
  return ((move.location.id as number) - from + stacks) % stacks
}

/**
 * A Hot-Air Balloon, or the Sun/Moon token, that flies to another stack goes round the Centrepiece clockwise, at the
 * distance of its spaces, instead of crossing the star, rising along the default arc. Only its place follows the arc:
 * it keeps facing the player, and the token only turns over when the Moon comes out. The keyframes are spread evenly in
 * time (linear easing between them, which would otherwise ease every chord), the ease of the whole flight lying in the
 * angle reached at each of them.
 */
for (const [type, position] of flyingPieces) {
  for (let length = 1; length < getStackCount(4); length++) {
    gameAnimations
      .configure((move, { rules }) => {
        if (!isMoveItemType(type)(move)) return false
        const from = rules.material(type).getItem(move.itemIndex).location.id as number
        return flightLength(move, type, rules.players.length, from) === length
      })
      .duration(flightBaseDuration + length * flightDurationPerStack)
      .trajectory(({ rules }, move) => {
        const players = rules.players.length
        const from = rules.material(type).getItem((move as { itemIndex: number }).itemIndex).location.id as number
        const waypoints: Waypoint<PlayerColor, MaterialType, LocationType>[] = []
        for (let step = 1; step < flightSteps; step++) {
          const at = step / flightSteps
          waypoints.push({ at, coordinates: position(from + length * easeInOut(at), players) })
        }
        return { easing: 'linear', waypoints }
      })
  }
}
