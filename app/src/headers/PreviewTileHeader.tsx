import { HeaderText, PlayMoveButton, useRules } from '@gamepark/react-game'
import { MaterialRules } from '@gamepark/rules-api'
import { getPreviewTile } from '../material/PreviewTile'

/**
 * Once a tile is previewed in the Panorama, the header offers to validate it or put it back, besides the buttons beside
 * the tile. Otherwise, it shows the header of the current step.
 */
export const PreviewTileHeader = ({ code }: { code: string }) => {
  const rules = useRules<MaterialRules>()
  const preview = rules ? getPreviewTile(rules) : undefined
  if (!preview) return <HeaderText code={code} />
  return (
    <HeaderText
      code="validate-tile"
      components={{ validate: <PlayMoveButton move={preview.validate[0]} moves={preview.validate} />, cancel: <PlayMoveButton move={preview.cancel} local /> }}
    />
  )
}
