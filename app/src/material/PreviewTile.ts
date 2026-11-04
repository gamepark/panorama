import { LocationType } from '@gamepark/panorama/material/LocationType'
import { MaterialType } from '@gamepark/panorama/material/MaterialType'
import { PlayerColor } from '@gamepark/panorama/PlayerColor'
import { Memory, PreviewTile } from '@gamepark/panorama/rules/Memory'
import { MaterialMove, MaterialRules } from '@gamepark/rules-api'

type Move = MaterialMove<PlayerColor, MaterialType, LocationType>

/**
 * The tile the active player has laid in their Panorama but not validated yet (a local preview, see
 * PanoramaRules.previewMove), with what ends the preview:
 * - validate: the moves sent to the server. If the tile was taken before moving the Hot-Air Balloon, the balloon first
 *   moves to the stack of the tile, then the tile is sent to the place where it already is.
 * - cancel: the tile goes back on top of its stack (local).
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
