import { isMoveItemType, MaterialMove } from '@gamepark/rules-api'
import { LocationType } from '../material/LocationType'
import { MaterialType } from '../material/MaterialType'
import { PanoramaRules } from '../PanoramaRules'
import { PlayerColor } from '../PlayerColor'
import { RuleId } from '../rules/RuleId'
import { BotState, freeStacks, PanoramaGame, Turn } from './State'

export type PanoramaMove = MaterialMove<PlayerColor, MaterialType, LocationType>

/** Every turn the player can play: a stack, then a side and an offset in their Panorama */
export const candidateTurns = (game: PanoramaGame, state: BotState, player: PlayerColor): Turn[] => {
  const stacks = game.rule?.id === RuleId.PlaceTile ? [state.balloons.get(player)!.stack] : freeStacks(state, player)
  const panorama = state.panoramas.get(player)!
  const turns: Turn[] = []
  for (const stack of stacks) {
    if (state.stacks[stack].top === undefined) continue
    for (const side of [-1, 1] as const) for (const y of panorama.offsets(side)) turns.push({ stack, side, y })
  }
  return turns
}

/** The legal move that plays the turn: the top tile of the stack laid directly in the Panorama (the balloon follows) */
export const turnMove = (game: PanoramaGame, player: PlayerColor, turn: Turn): PanoramaMove | undefined => {
  const rules = new PanoramaRules(game)
  const tiles = rules.material(MaterialType.PanoramaTile)
  const columns = tiles
    .location(LocationType.Panorama)
    .player(player)
    .getItems()
    .map((item) => item.location.x!)
  const x = turn.side === -1 ? Math.min(0, ...columns) - 1 : Math.max(0, ...columns) + 1
  return rules
    .getLegalMoves(player)
    .find(
      (move) =>
        isMoveItemType(MaterialType.PanoramaTile)(move) &&
        move.location.type === LocationType.Panorama &&
        move.location.x === x &&
        (move.location.y ?? 0) === turn.y &&
        tiles.getItem(move.itemIndex).location.id === turn.stack
    )
}

/**
 * The moves that play the turn as a player does at the table: the balloon flies to the stack first, then the top tile
 * of the stack is laid in the Panorama. If the balloon has already moved (PlaceTile), only the tile is laid.
 */
export const turnMoves = (game: PanoramaGame, player: PlayerColor, turn: Turn): PanoramaMove[] => {
  const tile = turnMove(game, player, turn)
  if (!tile) return []
  if (game.rule?.id !== RuleId.MoveBalloon) return [tile]
  const balloon = new PanoramaRules(game)
    .material(MaterialType.HotAirBalloon)
    .id(player)
    .moveItem({ type: LocationType.StackSpace, id: turn.stack })
  return [balloon, tile]
}
