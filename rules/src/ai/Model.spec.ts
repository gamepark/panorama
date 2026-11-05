import { applyAutomaticMoves, isMoveItemType, MaterialMove } from '@gamepark/rules-api'
import { describe, expect, it } from 'vitest'
import { LocationType } from '../material/LocationType'
import { MaterialType } from '../material/MaterialType'
import { PanoramaView } from '../material/PanoramaView'
import { PanoramaRules } from '../PanoramaRules'
import { PanoramaSetup } from '../PanoramaSetup'
import { PlayerColor } from '../PlayerColor'
import { objectiveValues } from '../Scoring'
import { getEnumValues } from '@gamepark/rules-api'
import { Objective } from '../material/Objective'
import { objectiveValue } from './Objectives'
import { nextPlayer, PanoramaGame, readState } from './State'

type Move = MaterialMove<PlayerColor, MaterialType, LocationType>

const newGame = (players: number): PanoramaGame =>
  new PanoramaSetup().setup({ players: Array.from({ length: players }, (_, index) => ({ id: index + 1 })) }) as PanoramaGame

describe('The model of the bot', () => {
  it('reads the Panoramas, the Objectives and the turn order exactly as the rules do', { timeout: 60_000 }, () => {
    for (const players of [2, 3, 4]) {
      for (let seed = 0; seed < 15; seed++) {
        const game = newGame(players)
        let random = seed * 7 + players
        while (game.rule) {
          const rules = new PanoramaRules(game)
          const player = rules.getActivePlayer()!
          const legal = rules.getLegalMoves(player).filter(isMoveItemType(MaterialType.PanoramaTile)) as Move[]
          random = (random * 1103515245 + 12345) % 2147483648
          const move = legal[random % legal.length] as Move & { itemIndex: number; location: { type: LocationType } }
          const before = readState(game)
          const stack = rules.material(MaterialType.PanoramaTile).getItem(move.itemIndex).location.id as number
          const emptied = before.stacks[stack].count === 1
          applyAutomaticMoves(rules, [move])
          expect(game.rule?.player).toBe(nextPlayer(before, player, stack, emptied))
          const state = readState(game)
          for (const other of game.players) {
            const view = PanoramaView.of(new PanoramaRules(game), other)
            const panorama = state.panoramas.get(other)!
            expect(panorama.analysis.terrainScore).toBe(view.terrainZones.reduce((sum, zone) => sum + zone.flowers * zone.animals, 0))
            for (const objective of getEnumValues(Objective)) {
              expect(objectiveValue(objective, panorama), Objective[objective]).toBe(objectiveValues[objective](view))
            }
          }
        }
      }
    }
  })
})
