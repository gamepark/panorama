import { describe, expect, it } from 'vitest'
import { LocationType } from '../material/LocationType'
import { MaterialType } from '../material/MaterialType'
import { PanoramaSetup } from '../PanoramaSetup'
import { playMatch } from './arena/Match'
import { applyAutomaticMoves, isMoveItemType } from '@gamepark/rules-api'
import { PanoramaRules } from '../PanoramaRules'
import { RuleId } from '../rules/RuleId'
import { chooseTurn, PanoramaAI } from './PanoramaAI'
import { withSeed } from './Random'
import { PanoramaGame } from './State'

describe('The automatic player', () => {
  it('plays whole games against itself to the end, at 2, 3 and 4 players', { timeout: 120_000 }, () => {
    for (const players of [2, 3, 4]) {
      const record = playMatch({ seed: players, rotation: 0, lineup: Array(players).fill('bot') })
      expect(record.error).toBeUndefined()
      for (const seat of record.seats) expect(seat.tiles).toBeGreaterThan(3)
    }
  })

  it('beats a player who lays the tile scoring the most right now', { timeout: 120_000 }, () => {
    let margin = 0
    for (let seed = 1; seed <= 4; seed++) {
      for (const rotation of [0, 1]) {
        const record = playMatch({ seed, rotation, lineup: ['bot', 'greedy'] })
        expect(record.error).toBeUndefined()
        const [bot, greedy] = ['bot', 'greedy'].map((name) => record.seats.find((seat) => seat.contender === name)!)
        margin += bot.score - greedy.score
      }
    }
    expect(margin / 8).toBeGreaterThan(10)
  })

  it('never reads the tiles nobody can see', { timeout: 60_000 }, () => {
    for (let seed = 1; seed <= 5; seed++) {
      const game = withSeed(seed, () => new PanoramaSetup().setup({ players: [{ id: 1 }, { id: 2 }, { id: 3 }] })) as PanoramaGame
      const hidden = game.items[MaterialType.PanoramaTile]!.filter((item) => item.location.type === LocationType.Stack && !item.location.rotation)
      const before = chooseTurn(game, game.rule!.player!)
      // Deal the hidden tiles again, among themselves
      const ids = hidden.map((item) => item.id).reverse()
      hidden.forEach((item, index) => (item.id = ids[index]))
      expect(chooseTurn(game, game.rule!.player!)).toEqual(before)
    }
  })

  it('moves its balloon before laying the tile, as a player does', { timeout: 60_000 }, async () => {
    const game = withSeed(3, () => new PanoramaSetup().setup({ players: [{ id: 1 }, { id: 2 }] })) as PanoramaGame
    const player = game.rule!.player!
    const turn = chooseTurn(game, player)!
    const moves = await PanoramaAI(game, player)
    expect(moves).toHaveLength(2)
    expect(isMoveItemType(MaterialType.HotAirBalloon)(moves[0])).toBe(true)
    applyAutomaticMoves(new PanoramaRules(game), [moves[0]])
    expect(game.rule?.id).toBe(RuleId.PlaceTile)
    expect(new PanoramaRules(game).getLegalMoves(player)).toContainEqual(moves[1])
    applyAutomaticMoves(new PanoramaRules(game), [moves[1]])
    const tiles = game.items[MaterialType.PanoramaTile]!.filter((item) => item.location.type === LocationType.Panorama && item.location.player === player)
    expect(tiles).toHaveLength(1)
    expect(tiles[0].location.y ?? 0).toBe(turn.y)
    expect(game.rule?.id).toBe(RuleId.MoveBalloon)
  })
})
