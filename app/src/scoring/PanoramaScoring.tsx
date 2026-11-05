import { css } from '@emotion/react'
import { Landscape, terrains } from '@gamepark/panorama/material/Landscape'
import { Objective } from '@gamepark/panorama/material/Objective'
import { PanoramaRules } from '@gamepark/panorama/PanoramaRules'
import { PlayerColor } from '@gamepark/panorama/PlayerColor'
import { Scoring } from '@gamepark/panorama/Scoring'
import { ScoringDescription } from '@gamepark/react-game'
import { Trans } from 'react-i18next'
import { animalImages, flowerImages, objectiveImages } from '../images/Images'

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
    if ('terrain' in key)
      return (
        <span css={terrainCss}>
          <img src={animalImages[key.terrain]} alt="" css={iconCss} />×<img src={flowerImages[key.terrain]} alt="" css={iconCss} />
        </span>
      )
    return <img src={objectiveImages[key.objective]} alt="" css={objectiveCss} />
  }

  getScoringPlayerData(key: ScoringKey, player: PlayerColor, rules: PanoramaRules) {
    const scoring = getScoring(rules)
    if (key === 'total') return <strong>{scoring.score(player)}</strong>
    if ('terrain' in key) return scoring.terrainScore(player, key.terrain)
    const score = scoring.objectiveScore(player, key.objective)
    return (
      <>
        <span css={score > 0 && boldCss}>{score}</span> <span css={valueCss}>({scoring.objectiveValue(player, key.objective)})</span>
      </>
    )
  }
}

/** The cells have a 0.6em padding: the negative margin keeps the tile large without making its row taller */
const objectiveCss = css`
  display: block;
  height: 2.5em;
  margin: -0.45em 0;
`

const terrainCss = css`
  display: flex;
  align-items: center;
  gap: 0.2em;
`

const iconCss = css`
  height: 1.5em;
  margin: -0.15em 0;
`

/** Not <strong>: the theme colours it */
const boldCss = css`
  font-weight: bold;
`

const valueCss = css`
  font-size: 0.8em;
  opacity: 0.6;
`
