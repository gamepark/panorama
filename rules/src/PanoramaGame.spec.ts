import { applyAutomaticMoves, MaterialGame, MaterialMove } from '@gamepark/rules-api'
import { describe, expect, it } from 'vitest'
import { LocationType } from './material/LocationType'
import { MaterialType } from './material/MaterialType'
import { getStackCount, stackSize } from './material/PanoramaTile'
import { PanoramaRules } from './PanoramaRules'
import { PanoramaSetup } from './PanoramaSetup'
import { PlayerColor } from './PlayerColor'
import { RuleId } from './rules/RuleId'
import { objectivePoints, Scoring } from './Scoring'

type Game = MaterialGame<PlayerColor, MaterialType, LocationType, RuleId>

/**
 * Whole games played at random, as the server plays them (no preview): the rules must always offer a legal move, the
 * material must stay where it belongs, and every game must end with all the Hot-Air Balloons deflated.
 */
const newGame = (players: number): Game =>
  new PanoramaSetup().setup({ players: Array.from({ length: players }, (_, index) => ({ id: index + 1 })) }) as Game

const playRandomGame = (players: number, seed: number) => {
  const game = newGame(players)
  let random = seed + 1
  let moves = 0
  while (game.rule && moves < 1000) {
    const rules = new PanoramaRules(game)
    const player = rules.getActivePlayer()!
    const legal = rules.getLegalMoves(player)
    expect(legal, `no legal move for player ${player} on rule ${game.rule.id}`).not.toHaveLength(0)
    random = (random * 1103515245 + 12345) % 2147483648
    applyAutomaticMoves(rules, [legal[random % legal.length] as MaterialMove<PlayerColor, MaterialType, LocationType>])
    moves++
    check(game)
  }
  return game
}

const check = (game: Game) => {
  const rules = new PanoramaRules(game)
  const tiles = rules.material(MaterialType.PanoramaTile)
  expect(tiles.length).toBe(getStackCount(game.players.length) * stackSize)
  // The top tile of every stack is revealed, the others are not
  const stacks = tiles.location(LocationType.Stack)
  for (const item of stacks.getItems()) {
    const top = stacks.locationId(item.location.id).maxBy((other) => other.location.x!).getItem()!
    expect(!!item.location.rotation).toBe(item === top)
  }
  // A Panorama is a row of columns with no gap
  for (const player of game.players) {
    const columns = tiles.location(LocationType.Panorama).player(player).getItems().map((item) => item.location.x!).concat(0).sort((a, b) => a - b)
    columns.forEach((column, index) => expect(column).toBe(columns[0] + index))
  }
}

describe('Random games', () => {
  for (const players of [2, 3, 4]) {
    it(`end with every Hot-Air Balloon deflated at ${players} players`, () => {
      for (let seed = 0; seed < 20; seed++) {
        const game = playRandomGame(players, seed)
        expect(game.rule).toBeUndefined()
        const rules = new PanoramaRules(game)
        for (const item of rules.material(MaterialType.HotAirBalloon).getItems()) expect(item.location.rotation).toBe(true)
        expect(rules.material(MaterialType.SunMoonToken).getItem()!.location.rotation).toBe(true)
        // Every player has a score, and each of the 3 Objectives is won by at least one player
        expect(game.players.every((player) => Number.isInteger(rules.getScore(player)) && rules.getScore(player) >= 0)).toBe(true)
        const scoring = new Scoring(rules)
        expect(scoring.objectives).toHaveLength(3)
        for (const objective of scoring.objectives) {
          expect(game.players.some((player) => scoring.objectiveScore(player, objective) === objectivePoints)).toBe(true)
        }
        // At least one stack has been emptied
        const stacks = new Set(rules.material(MaterialType.PanoramaTile).location(LocationType.Stack).getItems().map((item) => item.location.id))
        expect(stacks.size).toBeLessThan(getStackCount(players))
      }
    })
  }
})
