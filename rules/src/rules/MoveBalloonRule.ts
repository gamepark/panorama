import { isMoveItemType, ItemMove, MaterialMove, PlayMoveContext } from '@gamepark/rules-api'
import { uniq } from 'es-toolkit'
import { LocationType } from '../material/LocationType'
import { MaterialType } from '../material/MaterialType'
import { PlayerColor } from '../PlayerColor'
import { PanoramaTurnRule } from './PanoramaTurnRule'
import { RuleId } from './RuleId'

/**
 * The player whose Hot-Air Balloon stands with the Sun (or the Moon) moves it to any unoccupied stack: one with tiles
 * left, and no Hot-Air Balloon in its space (a deflated balloon still occupies its space). The Sun always stands with the
 * balloon of the active player, so it never occupies another space.
 *
 * The player can also lay the top tile of an unoccupied stack in their Panorama first, as a preview: validating it then
 * sends the move of the balloon to that stack, followed by the move of the tile. Played as a single move (by a bot), the
 * tile is laid and the balloon follows it.
 */
export class MoveBalloonRule extends PanoramaTurnRule {
  /** The stacks the balloon can move to */
  get freeStacks(): number[] {
    const occupied = this.material(MaterialType.HotAirBalloon)
      .getItems()
      .map((item) => item.location.id as number)
    const stacks = uniq(
      this.material(MaterialType.PanoramaTile)
        .location(LocationType.Stack)
        .getItems()
        .map((item) => item.location.id as number)
    )
    return stacks.filter((stack) => !occupied.includes(stack))
  }

  getPlayerMoves(): MaterialMove<PlayerColor, MaterialType, LocationType>[] {
    const preview = this.preview
    if (preview) {
      // A tile is previewed: it can be moved in the Panorama, and the balloon can join its stack (the validation)
      return [
        ...this.placeTile(this.material(MaterialType.PanoramaTile).index(preview.tile)),
        this.balloon.moveItem({ type: LocationType.StackSpace, id: preview.stack })
      ]
    }
    return this.freeStacks.flatMap((stack) => [this.balloon.moveItem({ type: LocationType.StackSpace, id: stack }), ...this.placeTile(this.topTile(stack))])
  }

  afterItemMove(move: ItemMove<PlayerColor, MaterialType, LocationType>, context?: PlayMoveContext): MaterialMove<PlayerColor, MaterialType, LocationType>[] {
    if (isMoveItemType(MaterialType.HotAirBalloon)(move)) return [this.startRule(RuleId.PlaceTile)]
    if (isMoveItemType(MaterialType.PanoramaTile)(move) && move.location.type === LocationType.Panorama && !context?.local) {
      // A tile laid directly, without moving the balloon first: the turn goes on as if it had been laid in PlaceTile
      return [this.startRule(RuleId.PlaceTile), ...super.afterItemMove(move, context)]
    }
    return super.afterItemMove(move, context)
  }
}
