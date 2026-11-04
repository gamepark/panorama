import { isMoveItemType, ItemMove, MaterialMove, PlayerTurnRule } from '@gamepark/rules-api'
import { uniq } from 'es-toolkit'
import { LocationType } from '../material/LocationType'
import { MaterialType } from '../material/MaterialType'
import { PlayerColor } from '../PlayerColor'
import { RuleId } from './RuleId'

/**
 * The player whose Hot-Air Balloon stands with the Sun (or the Moon) moves it to any unoccupied stack: one with tiles
 * left, and no Hot-Air Balloon in its space (a deflated balloon still occupies its space). The Sun always stands with the
 * balloon of the active player, so it never occupies another space.
 */
export class MoveBalloonRule extends PlayerTurnRule<PlayerColor, MaterialType, LocationType> {
  getPlayerMoves(): MaterialMove<PlayerColor, MaterialType, LocationType>[] {
    const occupied = this.material(MaterialType.HotAirBalloon)
      .getItems()
      .map((item) => item.location.id as number)
    const stacks = uniq(
      this.material(MaterialType.PanoramaTile)
        .location(LocationType.Stack)
        .getItems()
        .map((item) => item.location.id as number)
    )
    const balloon = this.material(MaterialType.HotAirBalloon).id(this.player)
    return stacks.filter((stack) => !occupied.includes(stack)).map((stack) => balloon.moveItem({ type: LocationType.StackSpace, id: stack }))
  }

  afterItemMove(move: ItemMove<PlayerColor, MaterialType, LocationType>): MaterialMove<PlayerColor, MaterialType, LocationType>[] {
    if (isMoveItemType(MaterialType.HotAirBalloon)(move)) return [this.startRule(RuleId.PlaceTile)]
    return []
  }
}
