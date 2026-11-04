import { css } from '@emotion/react'
import { PanoramaRules } from '@gamepark/panorama/PanoramaRules'
import { PlayerColor } from '@gamepark/panorama/PlayerColor'
import { DevToolsHub, GameTable, usePlayerId, usePlayers, useRules } from '@gamepark/react-game'
import { PanoramaLayout } from './locators/PanoramaLayout'
import { tableMargin } from './locators/TableLayout'
import { PlayerPanels } from './panels/PlayerPanels'

export function GameDisplay() {
  const players = usePlayers()
  const rules = useRules<PanoramaRules>()
  const me = usePlayerId<PlayerColor>()
  if (!rules) return null
  return (
    <>
      <GameTable {...PanoramaLayout.of(rules, me).tableBounds()} margin={tableMargin(players.length)} css={process.env.NODE_ENV === 'development' && tableBorder}>
        <PlayerPanels />
        {process.env.NODE_ENV === 'development' && <DevToolsHub fabBottom="calc(5em)" />}
      </GameTable>
    </>
  )
}

const tableBorder = css`
  border: 1px solid white;
`
