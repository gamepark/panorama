import { css } from '@emotion/react'
import { Landscape, terrains } from '@gamepark/panorama/material/Landscape'
import { Objective } from '@gamepark/panorama/material/Objective'
import { PanoramaRules } from '@gamepark/panorama/PanoramaRules'
import { PlayerColor } from '@gamepark/panorama/PlayerColor'
import { Scoring } from '@gamepark/panorama/Scoring'
import { ScoringDescription } from '@gamepark/react-game'
import { Trans } from 'react-i18next'
import { objectiveImages } from '../images/Images'

type ScoringKey = { terrain: Landscape } | { objective: Objective } | 'total'

/** The scoring is computed once per game state, for all the cells of the table */
const scorings = new WeakMap<object, Scoring>()
const getScoring = (rules: PanoramaRules) => {
  let scoring = scorings.get(rules.game)
  if (!scoring) {
    scoring = new Scoring(rules)
    scorings.set(rules.game, scoring)
  }
  return scoring
}

/**
 * The final score, as on the score pad: one row per terrain (flowers times animals of each of its zones), one row per
 * Objective of the game (10 points, with how well each Panorama meets it), and the total.
 */
export class PanoramaScoring implements ScoringDescription<PlayerColor, PanoramaRules, ScoringKey> {
  getScoringKeys(rules: PanoramaRules): ScoringKey[] {
    return [
      ...terrains.map((terrain) => ({ terrain })),
      ...getScoring(rules).objectives.map((objective) => ({ objective })),
      'total' as const
    ]
  }

  getScoringHeader(key: ScoringKey) {
    if (key === 'total') return <Trans i18nKey="scoring.total" />
    if ('terrain' in key) return <Trans i18nKey={`scoring.terrain.${key.terrain}`} />
    return <img src={objectiveImages[key.objective]} alt="" css={objectiveCss} />
  }

  getScoringPlayerData(key: ScoringKey, player: PlayerColor, rules: PanoramaRules) {
    const scoring = getScoring(rules)
    if (key === 'total') return <strong>{scoring.score(player)}</strong>
    if ('terrain' in key) return scoring.terrainScore(player, key.terrain)
    return (
      <>
        {scoring.objectiveScore(player, key.objective)} <span css={valueCss}>({scoring.objectiveValue(player, key.objective)})</span>
      </>
    )
  }
}

const objectiveCss = css`
  height: 2.5em;
  vertical-align: middle;
`

const valueCss = css`
  font-size: 0.8em;
  opacity: 0.6;
`
