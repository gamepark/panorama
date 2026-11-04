import { css } from '@emotion/react'
import { Landscape, terrains } from '@gamepark/panorama/material/Landscape'
import { LocationType } from '@gamepark/panorama/material/LocationType'
import { panoramaTileContents } from '@gamepark/panorama/material/TileContents'
import { MaterialHelpProps, usePlayerId, usePlayerName } from '@gamepark/react-game'
import { FC } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { animalImages, flowerImages } from '../../images/Images'
import { helpIcon, helpList, helpNote, helpSection, helpText, helpTitle } from './helpStyles'

/**
 * The help of the tiles: how a tile is laid in a Panorama (rulebook pages 4 and 5), how the Zones of terrain score
 * (pages 6 and 10), and how many animals and flowers the tiles hold (the Distribution box, page 16).
 */

const bold = { bold: <strong /> }

/** Laying a tile: left or right, never between, never moved, the waves interlocking */
export const PlacementSection: FC = () => {
  const { t } = useTranslation()
  return (
    <>
      <h3 css={helpSection}>{t('help.placement.title')}</h3>
      <ul css={helpList}>
        <li>
          <Trans i18nKey="help.placement.side" components={bold} />
        </li>
        <li>
          <Trans i18nKey="help.placement.between" components={bold} />
        </li>
        <li>
          <Trans i18nKey="help.placement.waves" components={bold} />
        </li>
      </ul>
    </>
  )
}

/** The points of the Zones of terrain: the flowers of a zone times its animals */
export const ZonesSection: FC = () => {
  const { t } = useTranslation()
  return (
    <>
      <h3 css={helpSection}>{t('help.zones.title')}</h3>
      <p css={helpText}>
        <Trans i18nKey="help.zones.zone" components={bold} />
      </p>
      <p css={helpText}>
        <Trans i18nKey="help.zones.score" components={bold} />
      </p>
      <table css={tableCss}>
        <tbody>
          {terrains.map((terrain) => (
            <tr key={terrain}>
              <td>{t(`help.terrain.${terrain}`)}</td>
              <td>
                <img src={animalImages[terrain]} alt="" css={helpIcon} />
              </td>
              <td>
                <img src={flowerImages[terrain]} alt="" css={helpIcon} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  )
}

/** How many animals and flowers of each terrain the 36 Panorama Tiles hold */
const DistributionSection: FC = () => {
  const { t } = useTranslation()
  const count = (key: 'animals' | 'flowers', terrain: Landscape) =>
    Object.values(panoramaTileContents).reduce((sum, content) => sum + content[key].filter((item) => item === terrain).length, 0)
  return (
    <>
      <h3 css={helpSection}>{t('help.distribution.title')}</h3>
      <table css={tableCss}>
        <tbody>
          {(['animals', 'flowers'] as const).map((key) => (
            <tr key={key}>
              {terrains.map((terrain) => (
                <td key={terrain}>
                  <img src={(key === 'animals' ? animalImages : flowerImages)[terrain]} alt="" css={helpIcon} /> ×{count(key, terrain)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </>
  )
}

/** Whose Panorama the tile belongs to, if any */
const PanoramaOwner: FC<Pick<MaterialHelpProps, 'item'>> = ({ item }) => {
  const me = usePlayerId()
  const owner = item.location?.type === LocationType.Panorama ? item.location.player : undefined
  const name = usePlayerName(owner)
  if (owner === undefined) return null
  return <p css={helpNote}>{owner === me ? <Trans i18nKey="help.tile.mine" /> : <Trans i18nKey="help.tile.owner" values={{ player: name }} />}</p>
}

export const PanoramaTileHelp: FC<MaterialHelpProps> = ({ item }) => {
  const { t } = useTranslation()
  return (
    <>
      <h2 css={helpTitle}>{t('help.tile.title')}</h2>
      <p css={helpText}>
        <Trans i18nKey="help.tile.intro" components={bold} />
      </p>
      <PlacementSection />
      <ZonesSection />
      <DistributionSection />
      {item.location?.type === LocationType.Stack && (
        <p css={helpNote}>
          <Trans i18nKey={item.id === undefined ? 'help.tile.covered' : 'help.tile.top'} />
        </p>
      )}
      <PanoramaOwner item={item} />
    </>
  )
}

export const StartingTileHelp: FC<MaterialHelpProps> = ({ item }) => {
  const { t } = useTranslation()
  return (
    <>
      <h2 css={helpTitle}>{t('help.starting-tile.title')}</h2>
      <p css={helpText}>
        <Trans i18nKey="help.starting-tile.intro" components={bold} />
      </p>
      <PlacementSection />
      <ZonesSection />
      <PanoramaOwner item={item} />
    </>
  )
}

const tableCss = css`
  border-collapse: collapse;
  margin: 0.3em 0 0.5em 0;

  td {
    padding: 0.15em 0.6em 0.15em 0;
    white-space: nowrap;
  }
`
