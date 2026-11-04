import { HeaderText, PlayMoveButton, useRules } from '@gamepark/react-game'
import { MaterialRules } from '@gamepark/rules-api'
import { getPreviewTile } from '../material/PreviewTile'

/** Once the tile is laid, the header offers to validate it too, besides the button under the tile */
export const PlaceTileHeader = () => {
  const rules = useRules<MaterialRules>()
  const preview = rules ? getPreviewTile(rules) : undefined
  if (preview) {
    return <HeaderText code="validate-tile" components={{ validate: <PlayMoveButton move={preview.validate} />, cancel: <PlayMoveButton move={preview.cancel} local /> }} />
  }
  return <HeaderText code="place-tile" />
}
