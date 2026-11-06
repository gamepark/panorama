import { MaterialType } from '@gamepark/panorama/material/MaterialType'
import { HeaderText, PlayMoveButton, ThemeButton, useRules } from '@gamepark/react-game'
import { MaterialRules } from '@gamepark/rules-api'
import { getPreviewTile, useCancelPreviewTile } from '../material/PreviewTile'

/**
 * Once a tile is previewed in the Panorama, the header offers to validate it or put it back (undoing the move of the balloon, if any), besides the buttons beside
 * the tile. Otherwise, it shows the header of the current step, which says it is a last turn once the Moon is out.
 */
export const PreviewTileHeader = ({ code }: { code: string }) => {
  const rules = useRules<MaterialRules>()
  const preview = rules ? getPreviewTile(rules) : undefined
  const cancel = useCancelPreviewTile()
  if (!preview) {
    const moon = !!rules?.material(MaterialType.SunMoonToken).getItem()?.location.rotation
    return <HeaderText code={moon ? `${code}-last` : code} />
  }
  return (
    <HeaderText
      code="validate-tile"
      components={{ validate: <PlayMoveButton move={preview.validate[0]} moves={preview.validate} />, cancel: <ThemeButton onClick={cancel} /> }}
    />
  )
}
