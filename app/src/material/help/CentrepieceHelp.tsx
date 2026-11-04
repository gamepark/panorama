import { LocationType } from '@gamepark/panorama/material/LocationType'
import { MaterialType } from '@gamepark/panorama/material/MaterialType'
import { getStackCount, stackSize } from '@gamepark/panorama/material/PanoramaTile'
import { PanoramaRules } from '@gamepark/panorama/PanoramaRules'
import { MaterialHelpProps, useRules } from '@gamepark/react-game'
import { uniq } from 'es-toolkit'
import { FC } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { helpList, helpNote, helpSection, helpText, helpTitle } from './helpStyles'

const bold = { bold: <strong /> }

/**
 * The Centrepiece: one per player count, a stack of tiles in front of each of its sides, the Sun starting at the stack
 * of the sunrise icon (rulebook page 2). An empty stack triggers the end of the game (page 8).
 */
export const CentrepieceHelp: FC<MaterialHelpProps> = ({ item }) => {
  const { t } = useTranslation()
  const rules = useRules<PanoramaRules>()
  const players = (item.id as number | undefined) ?? rules?.players.length ?? 2
  const stacks = rules ? uniq(rules.material(MaterialType.PanoramaTile).location(LocationType.Stack).getItems().map((tile) => tile.location.id)).length : undefined
  const tiles = rules?.material(MaterialType.PanoramaTile).location(LocationType.Stack).length
  return (
    <>
      <h2 css={helpTitle}>{t('help.centrepiece.title')}</h2>
      <p css={helpText}>
        <Trans i18nKey="help.centrepiece.intro" values={{ players, stacks: getStackCount(players), size: stackSize }} components={bold} />
      </p>
      <h3 css={helpSection}>{t('help.centrepiece.stacks.title')}</h3>
      <ul css={helpList}>
        <li>
          <Trans i18nKey="help.centrepiece.stacks.top" components={bold} />
        </li>
        <li>
          <Trans i18nKey="help.centrepiece.stacks.sunrise" components={bold} />
        </li>
        <li>
          <Trans i18nKey="help.centrepiece.stacks.end" components={bold} />
        </li>
      </ul>
      {stacks !== undefined && tiles !== undefined && (
        <p css={helpNote}>
          <Trans i18nKey="help.centrepiece.left" values={{ stacks, tiles }} />
        </p>
      )}
    </>
  )
}
