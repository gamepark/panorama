import { LocationType } from '@gamepark/panorama/material/LocationType'
import { MaterialType } from '@gamepark/panorama/material/MaterialType'
import { PlayerColor } from '@gamepark/panorama/PlayerColor'
import { Memory, PreviewTile } from '@gamepark/panorama/rules/Memory'
import { RuleId } from '@gamepark/panorama/rules/RuleId'
import { useActions, usePlay, useRules, useUndo } from '@gamepark/react-game'
import { isMoveItemType, MaterialMove, MaterialRules } from '@gamepark/rules-api'
import { findLastIndex } from 'es-toolkit/compat'
import { useCallback } from 'react'

type Move = MaterialMove<PlayerColor, MaterialType, LocationType>

/**
 * The tile the active player has laid in their Panorama but not validated yet (a local preview, see
 * PanoramaRules.previewMove), with what ends the preview:
 * - validate: the moves sent to the server. If the tile was taken before moving the Hot-Air Balloon, the balloon first
 *   moves to the stack of the tile, then the tile is sent to the place where it already is.
 * - cancel: the tile goes back on top of its stack (local). See useCancelPreviewTile when the balloon moved first.
 */
export function getPreviewTile(rules: MaterialRules<PlayerColor, MaterialType, LocationType>) {
  const preview = rules.remind<PreviewTile | undefined>(Memory.PreviewTile)
  const player = rules.getActivePlayer()
  if (!preview || player === undefined) return undefined
  const tile = rules.material(MaterialType.PanoramaTile).index(preview.tile)
  const item = tile.getItem()
  const balloon = rules.material(MaterialType.HotAirBalloon).id(player)
  if (!item || !balloon.length) return undefined
  const validate: Move[] = []
  if (balloon.getItem()!.location.id !== preview.stack) {
    validate.push(balloon.moveItem({ type: LocationType.StackSpace, id: preview.stack }))
  }
  validate.push(tile.moveItem(item.location))
  const cancel: Move = tile.moveItem({ type: LocationType.Stack, id: preview.stack, rotation: true })
  return { index: preview.tile, player, validate, cancel }
}

/**
 * Cancelling the previewed tile. If the player moved their Hot-Air Balloon before laying it (PlaceTile step), the move of
 * the balloon is undone as well, with the local moves of the preview that followed it: the turn starts over. Otherwise,
 * the tile just goes back on top of its stack.
 */
export function useCancelPreviewTile() {
  const rules = useRules<MaterialRules<PlayerColor, MaterialType, LocationType>>()
  const actions = useActions<Move, PlayerColor>()
  const play = usePlay()
  const [undo] = useUndo()
  const preview = rules ? getPreviewTile(rules) : undefined
  let undoCount = 0
  if (preview && rules?.game.rule?.id === RuleId.PlaceTile && actions) {
    const own = actions.filter((action) => action.playerId === preview.player && !action.cancelled)
    const balloonMove = findLastIndex(own, (action) => !action.local && isMoveItemType(MaterialType.HotAirBalloon)(action.move))
    if (balloonMove !== -1) undoCount = own.length - balloonMove
  }
  const cancel = preview?.cancel
  return useCallback(() => {
    if (undoCount) undo(undoCount)
    else if (cancel) play(cancel, { local: true })
  }, [undoCount, cancel, undo, play])
}
