import { css } from '@emotion/react'
import { Landscape, terrains } from '@gamepark/panorama/material/Landscape'
import { Picture } from '@gamepark/react-game'
import { animalImages, flowerImages, hotAirBalloonImages, Sun } from '../images/Images'
import { tutorialPlayer } from './TutorialSetup'

/**
 * The icons the tutorial drops inside its sentences, as `<sun/>`-style tags of a `<Trans>`: the very images the table
 * is drawn with, or the icons of the rulebook for the animals and flowers.
 */

/** A word-sized icon: it sits on the line of text rather than beside it */
const inlineIcon = css`
  display: inline-block;
  height: 1.3em;
  width: auto;
  vertical-align: -0.3em;
  margin: 0 0.06em;
`

/** The Sun token image is a square: its corners are cut like on the round token */
const sunIcon = css`
  ${inlineIcon};
  border-radius: 50%;
`

/** The 4 animals, or the 4 flowers, one per terrain */
const terrainIcons = (images: Partial<Record<Landscape, string>>) => (
  <span css={css`white-space: nowrap;`}>
    {terrains.map((terrain) => (
      <Picture key={terrain} src={images[terrain]!} css={inlineIcon} />
    ))}
  </span>
)

export const tutorialComponents = {
  strong: <strong />,
  b: <strong />,
  em: <em />,
  br: <br />,
  balloon: <Picture src={hotAirBalloonImages[tutorialPlayer]} css={inlineIcon} />,
  sun: <Picture src={Sun} css={sunIcon} />,
  flowers: terrainIcons(flowerImages),
  animals: terrainIcons(animalImages),
  fox: <Picture src={animalImages[Landscape.Forest]!} css={inlineIcon} />,
  flower: <Picture src={flowerImages[Landscape.Forest]!} css={inlineIcon} />,
  crow: <Picture src={animalImages[Landscape.Fields]!} css={inlineIcon} />
}
