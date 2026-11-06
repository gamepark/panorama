import { css } from '@emotion/react'
import { LocationType } from '@gamepark/panorama/material/LocationType'
import { MaterialType } from '@gamepark/panorama/material/MaterialType'
import { PanoramaRules } from '@gamepark/panorama/PanoramaRules'
import { useRules } from '@gamepark/react-game'
import { Location } from '@gamepark/rules-api'

/** How many tiles are left in the stack, in a disc of the ink of the sky, outlined in cloud white */
export const StackCount = ({ location }: { location: Location }) => {
  const rules = useRules<PanoramaRules>()
  const count = rules?.material(MaterialType.PanoramaTile).location(LocationType.Stack).locationId(location.id).length ?? 0
  return <span css={countCss}>{count}</span>
}

const countCss = css`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 0.75em;
  font-weight: bold;
  line-height: 1;
`
