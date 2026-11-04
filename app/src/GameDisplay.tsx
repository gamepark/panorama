import { css } from '@emotion/react'
import { DevToolsHub, GameTable, usePlayers } from '@gamepark/react-game'
import { tableBounds, tableMargin } from './locators/TableLayout'
import { PlayerPanels } from './panels/PlayerPanels'

export function GameDisplay() {
  const players = usePlayers()
  return (
    <>
      <GameTable {...tableBounds(players.length)} margin={tableMargin(players.length)} css={process.env.NODE_ENV === 'development' && tableBorder}>
        <PlayerPanels />
        {process.env.NODE_ENV === 'development' && <DevToolsHub fabBottom="calc(5em)" />}
      </GameTable>
    </>
  )
}

const tableBorder = css`
  border: 1px solid white;
`
