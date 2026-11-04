import { Objective } from '@gamepark/panorama/material/Objective'
import { objectiveSets, ObjectiveSet } from '@gamepark/panorama/material/ObjectiveSet'
import { PanoramaRules } from '@gamepark/panorama/PanoramaRules'
import { PlayerColor } from '@gamepark/panorama/PlayerColor'
import { lowestWins, objectivePoints, Scoring } from '@gamepark/panorama/Scoring'
import { MaterialHelpProps, usePlayerName, useRules } from '@gamepark/react-game'
import { FC } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { helpList, helpNote, helpSection, helpText, helpTitle } from './helpStyles'

const bold = { bold: <strong /> }

/**
 * An Objective token: what it asks for (rulebook pages 12 to 14), how it scores (page 9), and how well each Panorama
 * meets it at the moment.
 */
export const ObjectiveTokenHelp: FC<MaterialHelpProps> = ({ item }) => {
  const { t } = useTranslation()
  const rules = useRules<PanoramaRules>()
  const objective = item.id as Objective | undefined
  if (objective === undefined) return null
  return (
    <>
      <h2 css={helpTitle}>{t(`help.objective.${objective}.title`)}</h2>
      <p css={helpText}>
        <Trans i18nKey={`help.objective.${objective}.rule`} components={bold} />
      </p>
      <h3 css={helpSection}>{t('help.objective.scoring.title')}</h3>
      <p css={helpText}>
        <Trans i18nKey="help.objective.scoring.text" values={{ points: objectivePoints }} components={bold} />
      </p>
      {rules && <CurrentValues rules={rules} objective={objective} />}
      {objectiveSets[ObjectiveSet.FirstGame].includes(objective) && (
        <p css={helpNote}>
          <Trans i18nKey="help.objective.first-game" />
        </p>
      )}
    </>
  )
}

/** How well each Panorama meets the Objective now, the best ones in bold */
const CurrentValues: FC<{ rules: PanoramaRules; objective: Objective }> = ({ rules, objective }) => {
  const { t } = useTranslation()
  const scoring = new Scoring(rules)
  const values = rules.players.map((player) => scoring.objectiveValue(player, objective))
  const best = lowestWins.includes(objective) ? Math.min(...values) : Math.max(...values)
  return (
    <>
      <h3 css={helpSection}>{t('help.objective.current')}</h3>
      <ul css={helpList}>
        {rules.players.map((player, index) => (
          <PlayerValue key={player} player={player} value={values[index]} best={values[index] === best} />
        ))}
      </ul>
    </>
  )
}

const PlayerValue: FC<{ player: PlayerColor; value: number; best: boolean }> = ({ player, value, best }) => {
  const name = usePlayerName(player)
  return <li>{best ? <strong>{`${name} : ${value}`}</strong> : `${name} : ${value}`}</li>
}
