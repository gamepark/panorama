import { css } from '@emotion/react'
import { defaultTheme, GameTheme } from '@gamepark/react-game'

/**
 * Panorama's colours, picked off the rulebook: its pages are cream paper, and its boxes are framed in a band of autumn
 * orange crossed by a white dotted line (see the illustrations of page 6).
 *
 * Everything the interface draws for itself is cut from those: furniture (header bar, buttons, menu disc, chat bar) is
 * the **orange band**, documents (dialogs, menu panel, journal) are the **cream paper** written in brown ink. The white
 * dotted line is kept for the frame of the dialogs only.
 */
export const colors = {
  orange: '#F7942E',
  orangeDeep: '#DC7F35',
  /** Bold words on the paper: the orange, dark enough to read */
  orangeInk: '#A9501A',
  paper: '#FFF6EB',
  paperDeep: '#F3E3CC',
  ink: '#3B2A1E',
  disabled: '#D9C8B4'
}

/**
 * A length in ems of the text of the dialogs. The container itself is set in a much smaller font: its content scales its
 * text up by 3 × --gp-scale.
 */
const textEm = (em: number) => `calc(${3 * em}em * var(--gp-scale))`

/** The frame of the rulebook boxes: an orange band, and a white dotted line running along its middle */
const dialogContainer = css`
  border: ${textEm(0.4)} solid ${colors.orange};
  border-radius: ${textEm(0.8)};
  box-shadow: 0 0.4em 1.2em rgba(0, 0, 0, 0.45);

  &::after {
    content: '';
    position: absolute;
    inset: ${textEm(-0.25)};
    border: ${textEm(0.1)} dotted white;
    border-radius: ${textEm(0.65)};
    pointer-events: none;
  }
`

const dialogContent = css`
  > h2 {
    color: ${colors.orangeDeep};
  }

  strong {
    color: ${colors.orangeInk};
  }
`

/** Orange pills, like the band of the frame */
const buttons = css`
  background: ${colors.orange} !important;
  color: white !important;
  border: 0.08em solid ${colors.orangeDeep} !important;
  border-radius: 2em !important;
  font-weight: bold;
  cursor: pointer;
  outline: none !important;
  box-shadow: 0 0.1em 0.25em rgba(0, 0, 0, 0.25);
  transition:
    background 150ms ease,
    transform 120ms ease;

  &:hover:not(:disabled),
  &:focus-visible:not(:disabled) {
    background: ${colors.orangeDeep} !important;
  }

  &:active:not(:disabled) {
    transform: translateY(0.05em);
    box-shadow: inset 0 0.08em 0.2em rgba(0, 0, 0, 0.3);
  }

  &:disabled {
    background: ${colors.disabled} !important;
    color: white !important;
    border-color: ${colors.disabled} !important;
    box-shadow: none;
    cursor: default;
  }
`

/** The bar over the table: the orange band of the frame */
const headerBar = css`
  background: linear-gradient(180deg, ${colors.orange}, ${colors.orangeDeep});
  color: white;
  box-shadow: 0 0.25em 0.6em rgba(0, 0, 0, 0.4);

  h1 {
    text-shadow: 0 0.05em 0.1em rgba(0, 0, 0, 0.3);
  }
`

/** On the band, a button is a white outline, filled with paper when aimed at: it must read as a choice, not a second band */
const headerButtons = css`
  background: transparent !important;
  color: white !important;
  border: 0.06em solid white !important;
  border-radius: 2em !important;
  box-shadow: none !important;
  padding: 0 0.5em;
  font-weight: bold;
  text-shadow: none;
  outline: none !important;
  transition:
    background 150ms ease,
    color 150ms ease;

  &:hover:not(:disabled),
  &:focus-visible:not(:disabled) {
    background: ${colors.paper} !important;
    color: ${colors.orangeInk} !important;
  }

  &:active:not(:disabled) {
    background: ${colors.paperDeep} !important;
    color: ${colors.orangeInk} !important;
    transform: none;
  }

  &:disabled {
    opacity: 0.5;
  }
`

const menuPanel = css`
  background: ${colors.paper};
  color: ${colors.ink};
  border: 0.15em solid ${colors.orange};
  box-shadow: 0 0.6em 1.5em rgba(0, 0, 0, 0.45);

  h2 {
    color: ${colors.orangeDeep};
    border-bottom: 0.1em solid ${colors.orange};
    padding-bottom: 0.3em;
  }
`

/** The disc that opens the menu: a piece of the orange band */
const menuMainButton = css`
  background: ${colors.orange} !important;
  color: white !important;
  border: 0.1em solid ${colors.orangeDeep} !important;
  box-shadow: 0 0 0.5em rgba(0, 0, 0, 0.45);
  outline: none !important;

  &:hover:not(:disabled) {
    background: ${colors.orangeDeep} !important;
  }

  &:active:not(:disabled) {
    background: ${colors.orangeInk} !important;
  }
`

const menuPopButton = css`
  background: ${colors.paper};
  color: ${colors.orangeInk};

  &:focus,
  &:hover {
    background: ${colors.orange};
    color: white;
  }

  &:active {
    background: ${colors.orangeDeep};
    color: white;
  }
`

/** An entry of the journal: a line of the rulebook, with an orange margin down its side */
const journalHistoryEntry = css`
  border-radius: 0.35em;
  border-left: 0.2em solid ${colors.orange};
  background: rgba(247, 148, 46, 0.08);
  color: ${colors.ink};
`

const playerPanelDataBadge = css`
  background: ${colors.paper} !important;
  color: ${colors.ink} !important;
  border: 0.08em solid ${colors.orange} !important;
`

export const theme: GameTheme = {
  ...defaultTheme,
  root: {
    ...defaultTheme.root,
    background: {
      image: '/cover-1920.jpg',
      // Warmer than the default black: an autumn evening rather than the night
      overlay: 'rgba(42, 26, 14, 0.78)'
    }
  },
  palette: {
    primary: colors.orangeDeep,
    primaryHover: colors.orange,
    primaryActive: colors.orangeInk,
    primaryLight: 'rgba(247, 148, 46, 0.12)',
    primaryLighter: 'rgba(247, 148, 46, 0.06)',
    surface: colors.paper,
    onSurface: colors.ink,
    onSurfaceFocus: 'rgba(247, 148, 46, 0.15)',
    onSurfaceActive: 'rgba(247, 148, 46, 0.28)',
    danger: '#B3261E',
    dangerHover: '#F7DCD9',
    dangerActive: '#EEC2BD',
    disabled: colors.disabled
  },
  buttons,
  dropArea: { backgroundColor: 'rgba(247, 148, 46, 0.4)' },
  dialog: {
    ...defaultTheme.dialog,
    backgroundColor: colors.paper,
    color: colors.ink,
    container: dialogContainer,
    content: dialogContent,
    buttons
  },
  header: {
    bar: headerBar,
    buttons: headerButtons
  },
  menu: {
    panel: menuPanel,
    mainButton: menuMainButton,
    popButton: menuPopButton
  },
  journal: {
    tabSelected: css`
      color: white;
    `,
    chatBar: css`
      background: linear-gradient(180deg, ${colors.orange}, ${colors.orangeDeep});
    `,
    historyEntry: journalHistoryEntry
  },
  result: {
    border: colors.orange,
    icon: colors.orange
  },
  playerPanel: {
    dataBadge: playerPanelDataBadge
  },
  timeStats: {
    thinkBackground: 'rgba(247, 148, 46, 0.12)',
    waitBackground: 'rgba(59, 42, 30, 0.08)'
  }
}

/**
 * The buttons laid on the table beside a tile: discs cut from the same orange band and cream paper as the rest of the
 * interface. The one that commits is the band; the one that takes back is the paper.
 */
const itemButtonBase = css`
  width: 3em;
  height: 3em;
  border-radius: 50%;

  > svg {
    font-size: 1.4em;
  }
  box-shadow: 0 0.1em 0.3em rgba(0, 0, 0, 0.4);
  transition:
    background 150ms ease,
    color 150ms ease,
    box-shadow 150ms ease;

  &:hover:not(:disabled) {
    box-shadow:
      0 0 0.5em 0.1em rgba(247, 148, 46, 0.8),
      0 0.1em 0.3em rgba(0, 0, 0, 0.4);
  }

  &:disabled {
    filter: grayscale(0.8);
    opacity: 0.6;
    cursor: default;
  }
`

export const itemValidateButtonCss = css`
  ${itemButtonBase};
  background: ${colors.orange};
  color: white;
  border: 0.08em solid ${colors.orangeDeep};

  &:hover:not(:disabled) {
    background: ${colors.orangeDeep};
  }
`

export const itemCancelButtonCss = css`
  ${itemButtonBase};
  background: ${colors.paper};
  color: ${colors.orangeInk};
  border: 0.08em solid ${colors.orange};

  &:hover:not(:disabled) {
    background: ${colors.paperDeep};
  }
`
