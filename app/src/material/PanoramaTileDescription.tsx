import { css } from '@emotion/react'
import { faCheck, faXmark } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { LocationType } from '@gamepark/panorama/material/LocationType'
import { MaterialType } from '@gamepark/panorama/material/MaterialType'
import { PlayerColor } from '@gamepark/panorama/PlayerColor'
import { ItemContext, ItemMenuButton, TokenDescription } from '@gamepark/react-game'
import { MaterialItem } from '@gamepark/rules-api'
import { panoramaTileImages, TileBack } from '../images/Images'
import { panoramaTileSize } from '../locators/TableLayout'
import { PanoramaTileHelp } from './help/TileHelps'
import { getPreviewTile } from './PreviewTile'

/**
 * A Panorama Tile. Once laid in the Panorama, it stays a preview until the player validates it, or puts it back on its
 * stack. Both buttons stand on the outer side of the tile (left of the Starting Tile is x < 0), away from the rest of
 * the Panorama and from the header. The tile can also be dragged to another place meanwhile.
 */
export class PanoramaTileDescription extends TokenDescription<PlayerColor, MaterialType, LocationType, number> {
  width = panoramaTileSize.width
  height = panoramaTileSize.height
  borderRadius = 0.5
  transparency = true
  images = panoramaTileImages
  backImage = TileBack
  menuAlwaysVisible = true
  help = PanoramaTileHelp

  getItemMenu(item: MaterialItem<PlayerColor, LocationType>, context: ItemContext<PlayerColor, MaterialType, LocationType>) {
    if (item.location.type !== LocationType.Panorama) return
    const preview = getPreviewTile(context.rules)
    if (preview?.index !== context.index || preview.player !== context.player) return
    const x = (item.location.x! < 0 ? -1 : 1) * (this.width / 2 + 1)
    return (
      <>
        <ItemMenuButton moves={preview.validate} x={x} y={-1.5} css={validateCss}>
          <FontAwesomeIcon icon={faCheck} />
        </ItemMenuButton>
        <ItemMenuButton move={preview.cancel} options={{ local: true }} x={x} y={1.5} css={cancelCss}>
          <FontAwesomeIcon icon={faXmark} />
        </ItemMenuButton>
      </>
    )
  }
}

const validateCss = css`
  color: #1f7a1f !important;
`

const cancelCss = css`
  color: #c62828 !important;
`
