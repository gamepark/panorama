import { MaterialHelpProps, usePlayerId, usePlayerName } from '@gamepark/react-game'
import { FC } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { helpList, helpNote, helpSection, helpText, helpTitle } from './helpStyles'

const bold = { bold: <strong /> }

/**
 * The help of the Hot-Air Balloons and of the Sun/Moon token: the turn of play (rulebook pages 4 to 7), and what ends the
 * game (page 8).
 */

/** Whose turn it is, and its 3 steps */
const TurnSection: FC = () => {
  const { t } = useTranslation()
  return (
    <>
      <h3 css={helpSection}>{t('help.turn.title')}</h3>
      <p css={helpText}>
        <Trans i18nKey="help.turn.whose" components={bold} />
      </p>
      <ol css={helpList}>
        <li>
          <Trans i18nKey="help.turn.choose" components={bold} />
        </li>
        <li>
          <Trans i18nKey="help.turn.place" components={bold} />
        </li>
        <li>
          <Trans i18nKey="help.turn.sun" components={bold} />
        </li>
      </ol>
      <p css={helpText}>
        <Trans i18nKey="help.turn.order" components={bold} />
      </p>
    </>
  )
}

/** The last tile of a stack ends the game: the Moon, the last turns, the scoring */
const EndSection: FC = () => {
  const { t } = useTranslation()
  return (
    <>
      <h3 css={helpSection}>{t('help.end.title')}</h3>
      <ul css={helpList}>
        <li>
          <Trans i18nKey="help.end.trigger" components={bold} />
        </li>
        <li>
          <Trans i18nKey="help.end.moon" components={bold} />
        </li>
        <li>
          <Trans i18nKey="help.end.score" components={bold} />
        </li>
      </ul>
    </>
  )
}

export const HotAirBalloonHelp: FC<MaterialHelpProps> = ({ item }) => {
  const { t } = useTranslation()
  const me = usePlayerId()
  const name = usePlayerName(item.id)
  return (
    <>
      <h2 css={helpTitle}>{t('help.balloon.title')}</h2>
      <p css={helpText}>
        {item.id === me ? <Trans i18nKey="help.balloon.mine" components={bold} /> : <Trans i18nKey="help.balloon.player" values={{ player: name }} components={bold} />}
      </p>
      <TurnSection />
      <EndSection />
      {item.location?.rotation && (
        <p css={helpNote}>
          <Trans i18nKey="help.balloon.deflated" />
        </p>
      )}
    </>
  )
}

export const SunMoonTokenHelp: FC<MaterialHelpProps> = ({ item }) => {
  const { t } = useTranslation()
  const moon = !!item.location?.rotation
  return (
    <>
      <h2 css={helpTitle}>{t(moon ? 'help.moon.title' : 'help.sun.title')}</h2>
      <p css={helpText}>
        <Trans i18nKey={moon ? 'help.moon.intro' : 'help.sun.intro'} components={bold} />
      </p>
      <TurnSection />
      <EndSection />
    </>
  )
}
