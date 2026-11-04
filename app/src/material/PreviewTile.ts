import { LocationType } from '@gamepark/panorama/material/LocationType'
import { MaterialType } from '@gamepark/panorama/material/MaterialType'
import { PlayerColor } from '@gamepark/panorama/PlayerColor'
import { Memory } from '@gamepark/panorama/rules/Memory'
import { MaterialMove, MaterialRules } from '@gamepark/rules-api'

/**
 * The tile the active player has laid in their Panorama but not validated yet (a local preview, see
 * PanoramaRules.previewMove), with the 2 moves that end the preview: validate it where it is (sent to the server), or
 * put it back on top of its stack (local).
 */
export function getPreviewTile(rules: MaterialRules<PlayerColor, MaterialType, LocationType>) {
  const index = rules.remind<number | undefined>(Memory.PreviewTile)
  const player = rules.getActivePlayer()
  if (index === undefined || player === undefined) return undefined
  const tile = rules.material(MaterialType.PanoramaTile).index(index)
  const item = tile.getItem()
  const balloon = rules.material(MaterialType.HotAirBalloon).id(player).getItem()
  if (!item || !balloon) return undefined
  const validate: MaterialMove<PlayerColor, MaterialType, LocationType> = tile.moveItem(item.location)
  const cancel: MaterialMove<PlayerColor, MaterialType, LocationType> = tile.moveItem({
    type: LocationType.Stack,
    id: balloon.location.id,
    rotation: true
  })
  return { index, player, validate, cancel }
}
