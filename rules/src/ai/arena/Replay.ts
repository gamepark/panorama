import { applyAutomaticMoves, isMoveItemType } from '@gamepark/rules-api'
import { terrains } from '../../material/Landscape'
import { LocationType } from '../../material/LocationType'
import { MaterialType } from '../../material/MaterialType'
import { PanoramaRules } from '../../PanoramaRules'
import { PlayerColor } from '../../PlayerColor'
import { Scoring } from '../../Scoring'
import { tileData } from '../Model'
import { chooseTurn } from '../PanoramaAI'
import { freeStacks, PanoramaGame, readState } from '../State'

/** A game recorded on a table: its deal, and every tile laid, in order */
export type RecordedGame = { game: PanoramaGame; tiles: { itemIndex: number; player: PlayerColor; x: number; y: number }[] }

export type ReplayedTurn = {
  player: PlayerColor
  tile: number
  stack: number
  /** Free stacks flown over clockwise to reach the stack */
  holes: number
  clouds: number
  /** The player plays again */
  again: boolean
  /** What the bot would have played there: stack, side, offset */
  bot?: { stack: number; side: number; y: number; tile: number }
}

/** Plays a recorded game again, and sets every turn against the move the bot would have played */
export const replay = ({ game: setup, tiles }: RecordedGame) => {
  const game: PanoramaGame = JSON.parse(JSON.stringify(setup))
  const turns: ReplayedTurn[] = []
  for (const laid of tiles) {
    const rules = new PanoramaRules(game)
    const player = rules.getActivePlayer()!
    if (player !== laid.player) throw new Error(`Player ${laid.player} lays a tile on the turn of ${player}`)
    const state = readState(game)
    const item = rules.material(MaterialType.PanoramaTile).getItem(laid.itemIndex)
    const stack = item.location.id as number
    const stacks = state.stacks.length
    const from = state.balloons.get(player)!.stack
    const free = new Set(freeStacks(state, player))
    let holes = 0
    for (let step = 1; step < (stack - from + stacks) % stacks; step++) if (free.has((from + step) % stacks)) holes++
    const choice = chooseTurn(game, player)
    const move = rules
      .getLegalMoves(player)
      .find(
        (move) =>
          isMoveItemType(MaterialType.PanoramaTile)(move) &&
          move.itemIndex === laid.itemIndex &&
          move.location.type === LocationType.Panorama &&
          move.location.x === laid.x &&
          (move.location.y ?? 0) === laid.y
      )
    if (!move) throw new Error(`Tile ${laid.itemIndex} cannot be laid at ${laid.x}, ${laid.y}`)
    applyAutomaticMoves(rules, [move])
    turns.push({
      player,
      tile: item.id as number,
      stack,
      holes,
      clouds: tileData[item.id as number].clouds,
      again: game.rule?.player === player,
      bot: choice && { ...choice, tile: state.stacks[choice.stack].top! }
    })
  }
  const scoring = new Scoring(new PanoramaRules(game))
  const players = game.players.map((player) => ({
    player,
    score: scoring.score(player),
    terrains: terrains.map((terrain) => scoring.terrainScore(player, terrain)),
    objectives: scoring.objectives.map((objective) => [scoring.objectiveValue(player, objective), scoring.objectiveScore(player, objective)]),
    tiles: scoring.panoramas.get(player)!.tiles.length - 1
  }))
  return { turns, players, objectives: scoring.objectives }
}
