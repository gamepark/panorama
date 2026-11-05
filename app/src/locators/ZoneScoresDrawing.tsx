import { css } from '@emotion/react'
import { LocationType } from '@gamepark/panorama/material/LocationType'
import { MaterialType } from '@gamepark/panorama/material/MaterialType'
import { PlayerColor } from '@gamepark/panorama/PlayerColor'
import { useRules } from '@gamepark/react-game'
import { Location, MaterialRules } from '@gamepark/rules-api'
import { useMemo } from 'react'
import { colors } from '../theme'
import { drawingSize, getZoneScores, labelRadius } from './ZoneScores'

type PanoramaRules = MaterialRules<PlayerColor, MaterialType, LocationType>

/** The outlines of the scoring Zones of a Panorama, dotted, each with its score in a disc */
export const ZoneScoresDrawing = ({ location }: { location: Location }) => {
  const rules = useRules<PanoramaRules>()
  const player = location.player as PlayerColor
  const zones = useMemo(() => (rules ? getZoneScores(rules, player) : []), [rules, player])
  if (!rules) return null
  const { width, height } = drawingSize(rules, player)
  return (
    <svg css={drawingCss} viewBox={`${-width / 2} ${-height / 2} ${width} ${height}`} aria-hidden>
      {zones.map((zone, index) => (
        <g key={index}>
          {zone.loops.map((loop, loopIndex) => (
            <polygon key={loopIndex} points={loop.map(({ x, y }) => `${x},${y}`).join(' ')} css={outlineCss} />
          ))}
          <circle cx={zone.label.x} cy={zone.label.y} r={labelRadius} css={labelDiscCss} />
          <text x={zone.label.x} y={zone.label.y} css={labelTextCss}>
            {zone.score}
          </text>
        </g>
      ))}
    </svg>
  )
}

const drawingCss = css`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
  pointer-events: none;
`

/** Round dots, white over a dark halo, to read on every terrain */
const outlineCss = css`
  fill: none;
  stroke: white;
  stroke-width: 0.15;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-dasharray: 0 0.3;
  filter: drop-shadow(0 0 0.04px rgba(0, 0, 0, 0.9));
`

const labelDiscCss = css`
  fill: ${colors.paper};
  stroke: ${colors.orange};
  stroke-width: 0.08;
  filter: drop-shadow(0 0.03px 0.06px rgba(0, 0, 0, 0.6));
`

const labelTextCss = css`
  fill: ${colors.ink};
  font-size: 0.8px;
  font-weight: bold;
  text-anchor: middle;
  dominant-baseline: central;
`
