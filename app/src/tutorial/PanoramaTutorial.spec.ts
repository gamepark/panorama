/**
 * @vitest-environment jsdom
 *
 * The tutorial wrapper is pure rules, but it is reached through packages that touch `document` and `localStorage` as
 * they load. Nothing here uses the DOM: it is only there to let them import.
 */
import { LocationType } from '@gamepark/panorama/material/LocationType'
import { MaterialType } from '@gamepark/panorama/material/MaterialType'
import { PanoramaRules } from '@gamepark/panorama/PanoramaRules'
import { wrapRulesWithTutorial } from '@gamepark/react-game/dist/components/tutorial/TutorialRulesWrapper'
import { applyAutomaticMoves, isMoveItemType, Material, MaterialGame, MaterialMove, MoveKind } from '@gamepark/rules-api'
import { describe, expect, it } from 'vitest'
import { PanoramaTutorial } from './PanoramaTutorial'
import { firstTile, firstTilePlace, isSkippedTile, isTakenTile, scriptedStacks, tutorialOpponent, tutorialPlayer } from './TutorialSetup'

type Game = MaterialGame<number, MaterialType, LocationType>

/** Enough to walk the whole script several times over: a run that needs more is a run that loops */
const MOVE_LIMIT = 200

/**
 * The tutorial played through the way a reader plays it, without a browser: at every step, one of the moves the
 * framework offers is played, the step's popup being closed only when there is nothing else to do. A step whose filter
 * matches no legal move, or an interrupt that never fires, leaves the reader stuck on a popup with nothing to click.
 */
const playTutorial = (): { game: Game; steps: number } => {
  const tutorial = new PanoramaTutorial()
  wrapRulesWithTutorial(tutorial as never, PanoramaRules as never)
  const [game] = tutorial.setupTutorial()
  const rules = new PanoramaRules(game)
  let played = 0
  while (game.tutorial!.step < tutorial.steps.length) {
    const step = tutorial.steps[game.tutorial!.step]
    const player = step?.move?.player ?? game.players[0]
    const moves = rules.getLegalMoves(player) as MaterialMove[]
    expect(moves, `no legal move at step ${game.tutorial!.step}`).not.toHaveLength(0)
    // As the interface does: a tile taken before the balloon has moved is only a preview, validated by the move of the
    // balloon then the move of the tile. So the balloon always moves first.
    const actions = moves.filter((candidate) => candidate.kind !== MoveKind.LocalMove)
    const move = actions.find(isMoveItemType(MaterialType.HotAirBalloon)) ?? actions[0] ?? moves[0]
    applyAutomaticMoves(rules, [move] as never)
    expect(++played, 'the tutorial did not reach its last step').toBeLessThan(MOVE_LIMIT)
  }
  return { game, steps: tutorial.steps.length }
}

const material = (game: Game, type: MaterialType) => new Material(type, game.items[type])

const panoramaTiles = (game: Game, player: number) => material(game, MaterialType.PanoramaTile).location(LocationType.Panorama).player(player)

describe('The Panorama tutorial', () => {
  it('can be played from the first popup to the last', () => {
    for (let run = 0; run < 10; run++) {
      const { game, steps } = playTutorial()
      expect(game.tutorial!.step).toBe(steps)
    }
  })

  it('opens with the reader on the Sun, and the scripted tile on top of the stack they fly to', () => {
    const [game] = new PanoramaTutorial().setupTutorial()
    expect(game.rule?.player).toBe(tutorialPlayer)
    const balloons = material(game, MaterialType.HotAirBalloon)
    expect(balloons.id(tutorialPlayer).getItem()!.location.id).toBe(0)
    expect(balloons.id(tutorialOpponent).getItem()!.location.id).toBe(1)
    const top = material(game, MaterialType.PanoramaTile).location(LocationType.Stack).locationId(scriptedStacks.first).maxBy((item) => item.location.x!)
    expect(top.getItem()!.id).toBe(firstTile)
  })

  it('puts on top of the 3 scripted stacks the tiles the Objectives of a first game are explained with', () => {
    expect(isTakenTile(firstTile)).toBe(true)
    for (let run = 0; run < 20; run++) {
      const [game] = new PanoramaTutorial().setupTutorial()
      const top = (stack: number) =>
        material(game, MaterialType.PanoramaTile).location(LocationType.Stack).locationId(stack).maxBy((item) => item.location.x!).getItem<number>()!.id
      expect(top(scriptedStacks.first)).toBe(firstTile)
      expect(isSkippedTile(top(scriptedStacks.gap))).toBe(true)
      expect(isTakenTile(top(scriptedStacks.opponent))).toBe(true)
      expect(material(game, MaterialType.PanoramaTile).length).toBe(6 * 4)
    }
  })

  it('leaves the reader with 2 tiles, the first one where the script lays it, and the opponent with 1', () => {
    const { game } = playTutorial()
    const tiles = panoramaTiles(game, tutorialPlayer)
    expect(tiles.length).toBe(2)
    expect(tiles.id(firstTile).getItem()!.location).toMatchObject(firstTilePlace)
    expect(panoramaTiles(game, tutorialOpponent).length).toBe(1)
    expect(material(game, MaterialType.HotAirBalloon).id(tutorialOpponent).getItem()!.location.id).toBe(scriptedStacks.opponent)
  })
})
