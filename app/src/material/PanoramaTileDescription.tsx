import { css } from '@emotion/react'
import { faCheck } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { LocationType } from '@gamepark/panorama/material/LocationType'
import { MaterialType } from '@gamepark/panorama/material/MaterialType'
import { PlayerColor } from '@gamepark/panorama/PlayerColor'
import { ItemContext, ItemMenuButton, TokenDescription } from '@gamepark/react-game'
import { MaterialItem } from '@gamepark/rules-api'
import { panoramaTileImages, TileBack } from '../images/Images'
import { panoramaTileSize } from '../locators/TableLayout'
import { itemValidateButtonCss } from '../theme'
import { PanoramaTileHelp } from './help/TileHelps'
import { CancelPreviewButton } from './CancelPreviewButton'
import { getPreviewTile } from './PreviewTile'

/**
 * A Panorama Tile. Once laid in the Panorama, it stays a preview until the player validates it, or puts it back on its
 * stack (which undoes the move of their balloon, if they moved it first). Both buttons stand on the outer side of the tile (left of the Starting Tile is x < 0), away from the rest of
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

  /** In a stack, each tile casts a stronger shadow on the one under it, so that the tiles left can be counted at a glance */
  getItemExtraCss(item: MaterialItem<PlayerColor, LocationType>, context: ItemContext<PlayerColor, MaterialType, LocationType>) {
    return item.location.type === LocationType.Stack && !context.isDragging ? stackTileCss : undefined
  }

  getItemMenu(item: MaterialItem<PlayerColor, LocationType>, context: ItemContext<PlayerColor, MaterialType, LocationType>) {
    if (item.location.type !== LocationType.Panorama) return
    const preview = getPreviewTile(context.rules)
    if (preview?.index !== context.index || preview.player !== context.player) return
    const x = (item.location.x! < 0 ? -1 : 1) * (this.width / 2 + 1.6)
    return (
      <>
        <ItemMenuButton moves={preview.validate} x={x} y={-1.8} css={itemValidateButtonCss}>
          <FontAwesomeIcon icon={faCheck} />
        </ItemMenuButton>
        <CancelPreviewButton x={x} y={1.8} />
      </>
    )
  }
}

/**
 * The tiles of a stack step up towards the top left (see StackLocator), so the shadow falls towards the bottom right.
 * It is set on the faces, which hold the image: a filter on the item itself would flatten its 3D faces.
 */
const stackTileCss = css`
  > * > * {
    filter: drop-shadow(0.12em 0.12em 0.14em rgba(0, 0, 0, 0.95));
  }
`
