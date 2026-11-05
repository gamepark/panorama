import { css } from '@emotion/react'
import { defaultTheme, GameTheme } from '@gamepark/react-game'

/**
 * Panorama's colours, picked off the rulebook: its pages are cream paper, and its boxes are framed in a band of autumn
 * orange crossed by a white dotted line (see the illustrations of page 6).
 */
export const colors = {
  orange: '#F7942E',
  orangeDeep: '#DC7F35',
  /** Bold words on the paper: the orange, dark enough to read */
  orangeInk: '#A9501A',
  paper: '#FFF6EB',
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
const dialogButtons = css`
  background: ${colors.orange};
  color: white;
  border: 0.08em solid ${colors.orangeDeep};
  box-shadow: 0 0.1em 0.25em rgba(0, 0, 0, 0.25);
  transition:
    background 150ms ease,
    transform 120ms ease;

  &:hover:not(:disabled) {
    background: ${colors.orangeDeep};
  }

  &:active:not(:disabled) {
    transform: translateY(0.05em);
    box-shadow: inset 0 0.08em 0.2em rgba(0, 0, 0, 0.3);
  }

  &:disabled {
    background: ${colors.disabled};
    color: white;
    border-color: ${colors.disabled};
    box-shadow: none;
  }
`

export const theme: GameTheme = {
  ...defaultTheme,
  dialog: {
    ...defaultTheme.dialog,
    backgroundColor: colors.paper,
    color: colors.ink,
    container: dialogContainer,
    content: dialogContent,
    buttons: dialogButtons
  }
}
