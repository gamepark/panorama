import { css } from '@emotion/react'
import { PlayerColor } from '@gamepark/panorama/PlayerColor'
import { PanoramaRules } from '@gamepark/panorama/PanoramaRules'
import { StyledPlayerPanel, usePlayerId, usePlayers, useRules } from '@gamepark/react-game'
import { createPortal } from 'react-dom'
import { PanoramaLayout } from '../locators/PanoramaLayout'
import { panelEmGap, panelEmWidth, tableMargin } from '../locators/TableLayout'

/**
 * The panels are drawn on the screen, out of the table, where they stand against their owner's Panorama when the
 * table is fully zoomed out (see panelAnchor). Zoomed out, the table fills the height between its margins, which sets
 * how many em a centimetre of table takes, and it is centred in the width left to it.
 */
export const PlayerPanels = () => {
  const players = usePlayers<PlayerColor>()
  const me = usePlayerId<PlayerColor>()
  const rules = useRules<PanoramaRules>()
  const root = document.getElementById('root')
  if (!root || !rules) return null
  const layout = PanoramaLayout.of(rules, me)
  const { xMin, xMax, yMin, yMax } = layout.tableBounds()
  const margin = tableMargin(players.length)
  const emPerCm = (100 - margin.top - margin.bottom) / (yMax - yMin)
  /** The left of the table on the screen, as a CSS length */
  const tableLeft = `(100dvw - ${margin.left + margin.right + (xMax - xMin) * emPerCm}em) / 2 + ${margin.left}em`
  return createPortal(
    <>
      {players.map((player) => {
        const anchor = layout.panelAnchor(player.id)
        const top = margin.top + (anchor.y - yMin) * emPerCm
        const left = anchor.x !== undefined ? `calc(${tableLeft} + ${(anchor.x - xMin) * emPerCm}em)` : undefined
        return (
          <StyledPlayerPanel
            key={player.id}
            player={player}
            css={[panelPlace[anchor.place](top, left), playerPanelColors[player.id]]}
            activeRing
          />
        )
      })}
    </>,
    root
  )
}

const panelBase = css`
  position: absolute;
  width: ${panelEmWidth}em;
`

const panelPlace = {
  /** On the right of the screen, its middle at this height */
  right: (top: number) => css`
    ${panelBase};
    right: ${panelEmGap}em;
    top: ${top}em;
    transform: translateY(-50%);
  `,
  /** Its left edge there, its middle at this height */
  beside: (top: number, left?: string) => css`
    ${panelBase};
    left: ${left};
    top: ${top}em;
    transform: translateY(-50%);
  `,
  /** Centred there, its bottom just above this height */
  above: (top: number, left?: string) => css`
    ${panelBase};
    left: ${left};
    top: ${top - panelEmGap}em;
    transform: translate(-50%, -100%);
  `,
  /** Centred there, its top just under this height */
  below: (top: number, left?: string) => css`
    ${panelBase};
    left: ${left};
    top: ${top + panelEmGap}em;
    transform: translateX(-50%);
  `
}

const colors: Record<PlayerColor, { light: string; main: string; deep: string }> = {
  [PlayerColor.Blue]: { light: '#9fd0ff', main: '#2f6fd1', deep: '#1b3f80' },
  [PlayerColor.Red]: { light: '#ffad9e', main: '#d23b2e', deep: '#7d1c14' },
  [PlayerColor.Green]: { light: '#b4ea9f', main: '#3c9a3a', deep: '#1f5a1e' },
  [PlayerColor.Yellow]: { light: '#fff3a6', main: '#e3b21c', deep: '#8a6a0a' }
}

/** A gradient in the player's colour, the ring that marks the player to move turned to the same colour */
const playerPanelColors = Object.fromEntries(
  Object.entries(colors).map(([player, { light, main, deep }]) => [
    player,
    css`
      background: linear-gradient(160deg, ${light} 0%, ${main} 100%);
      border: 0.15em solid ${deep};
      --gp-ring-color-1: ${light};
      --gp-ring-color-2: ${deep};
    `
  ])
)
