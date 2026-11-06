import { faXmark } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { ItemMenuButton } from '@gamepark/react-game'
import { itemCancelButtonCss } from '../theme'
import { useCancelPreviewTile } from './PreviewTile'

/** Puts the previewed tile back, and undoes the move of the balloon if the player moved it first */
export const CancelPreviewButton = ({ x, y }: { x: number; y: number }) => {
  const cancel = useCancelPreviewTile()
  return (
    <ItemMenuButton onClick={cancel} x={x} y={y} css={itemCancelButtonCss}>
      <FontAwesomeIcon icon={faXmark} />
    </ItemMenuButton>
  )
}
