import { applyAutomaticMoves, isMoveItemType, MaterialGame, MaterialMove, MoveItem } from '@gamepark/rules-api'
import { describe, expect, it } from 'vitest'
import { LocationType } from '../material/LocationType'
import { MaterialType } from '../material/MaterialType'
import { PanoramaRules } from '../PanoramaRules'
import { PanoramaSetup } from '../PanoramaSetup'
import { PlayerColor } from '../PlayerColor'
import { Memory, PreviewTile } from './Memory'
import { RuleId } from './RuleId'

type Game = MaterialGame<PlayerColor, MaterialType, LocationType, RuleId>
type Move = MaterialMove<PlayerColor, MaterialType, LocationType>

const newGame = (): Game => new PanoramaSetup().setup({ players: [{ id: 1 }, { id: 2 }] }) as Game
const copy = (game: Game): Game => JSON.parse(JSON.stringify(game))
const legalMoves = (game: Game) => new PanoramaRules(game).getLegalMoves(new PanoramaRules(game).getActivePlayer()!)

/** Plays a move as the client does: kept local if the rules preview it, else played with its consequences */
const playOnClient = (game: Game, move: Move) => {
  const rules = new PanoramaRules(game)
  if (rules.previewMove(move)) rules.play(move, { local: true })
  else applyAutomaticMoves(rules, [move])
}

describe('Laying a tile before moving the Hot-Air Balloon', () => {
  it('previews the tile, then validates with the balloon move followed by the tile move', () => {
    const game = newGame()
    const tileMove = legalMoves(game).find(isMoveItemType(MaterialType.PanoramaTile)) as MoveItem<PlayerColor, MaterialType, LocationType>
    const stack = new PanoramaRules(game).material(MaterialType.PanoramaTile).getItem(tileMove.itemIndex).location.id
    const serverGame = copy(game)

    // The client previews the tile: the balloon has not moved, the rule has not changed
    playOnClient(game, tileMove)
    expect(game.rule?.id).toBe(RuleId.MoveBalloon)
    expect(new PanoramaRules(game).remind<PreviewTile>(Memory.PreviewTile)).toEqual({ tile: tileMove.itemIndex, stack })

    // The validation: the balloon joins the stack of the tile, then the tile is sent to the place where it already is
    const rules = new PanoramaRules(game)
    const balloonMove = rules.material(MaterialType.HotAirBalloon).id(game.rule!.player).moveItem({ type: LocationType.StackSpace, id: stack })
    expect(legalMoves(game)).toContainEqual(balloonMove)
    playOnClient(game, balloonMove)
    expect(new PanoramaRules(game).previewMove(tileMove)).toBe(false)
    playOnClient(game, tileMove)

    // The server receives the same 2 moves, without any preview, and ends in the same state
    applyAutomaticMoves(new PanoramaRules(serverGame), [balloonMove])
    applyAutomaticMoves(new PanoramaRules(serverGame), [tileMove])
    expect(game.items).toEqual(serverGame.items)
    expect(game.rule).toEqual(serverGame.rule)
    expect(game.memory).toEqual({})
    expect(game.rule?.id).toBe(RuleId.MoveBalloon)
  })

  it('lets a bot lay the tile directly: the balloon follows it', () => {
    const game = newGame()
    const player = game.rule!.player
    const tileMove = legalMoves(game).find(isMoveItemType(MaterialType.PanoramaTile)) as MoveItem<PlayerColor, MaterialType, LocationType>
    const stack = new PanoramaRules(game).material(MaterialType.PanoramaTile).getItem(tileMove.itemIndex).location.id
    applyAutomaticMoves(new PanoramaRules(game), [tileMove])
    const rules = new PanoramaRules(game)
    expect(rules.material(MaterialType.HotAirBalloon).id(player).getItem()!.location.id).toBe(stack)
    expect(rules.material(MaterialType.PanoramaTile).getItem(tileMove.itemIndex).location).toEqual(tileMove.location)
    expect(game.rule?.id).toBe(RuleId.MoveBalloon)
    expect(game.memory).toEqual({})
  })
})
