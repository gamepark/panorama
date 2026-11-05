import { css, keyframes } from '@emotion/react'

/**
 * The look of a space the Hot-Air Balloon can fly to: a disc of dawn sky, between the blue of morning and the gold of the
 * sunrise printed on the tiles.
 *
 * It must read both as a place to drop the balloon and as a button to press, for a click moves the balloon as well:
 * - the place: a dashed ring of cloud white inside the disc, the mark of a spot waiting for something to land on it, with
 *   the silhouette of a balloon floating in its middle;
 * - the button: the disc is domed (light on top, shade underneath) and stands out of the table on its shadow; aimed at,
 *   the sun rises behind it and its gold rim lights up; pressed, it sinks in.
 *
 * The travelling shine the framework gives its drop areas is turned off: the disc already says it can be pressed, and it
 * is the start of a drag that lights it up — every space the balloon may be let go in then calls for it (see
 * {@link balloonSpaceAwaitingCss}).
 */
const skyTop = '143, 201, 240'
const skyHorizon = '253, 227, 184'
const sunGold = '255, 196, 87'
const ink = '31, 62, 99'

export const balloonSpaceCss = css`
  background: linear-gradient(to bottom, rgba(${skyTop}, 0.95) 0%, rgba(${skyTop}, 0.9) 35%, rgba(${skyHorizon}, 0.95) 100%);
  border: 0.06em solid rgba(255, 255, 255, 0.85);
  box-sizing: border-box;
  box-shadow:
    0 0.08em 0.2em rgba(0, 0, 0, 0.45),
    inset 0 0.12em 0.2em rgba(255, 255, 255, 0.7),
    inset 0 -0.15em 0.25em rgba(${ink}, 0.3);
  color: rgba(${ink}, 0.6);
  transition:
    box-shadow 0.15s ease-in-out,
    border-color 0.15s ease-in-out,
    color 0.15s ease-in-out,
    filter 0.15s ease-in-out;

  &:before {
    content: '';
    position: absolute;
    inset: 0.16em;
    border-radius: inherit;
    border: 0.06em dashed rgba(255, 255, 255, 0.95);
    pointer-events: none;
  }

  &:after {
    display: none;
  }

  &:hover {
    border-color: rgb(${sunGold});
    box-shadow:
      0 0 0.45em 0.12em rgba(${sunGold}, 0.85),
      inset 0 0.12em 0.2em rgba(255, 255, 255, 0.8),
      inset 0 -0.6em 0.6em rgba(${sunGold}, 0.55);
    color: rgb(${ink});
    filter: brightness(1.06);
  }

  &:active {
    box-shadow:
      0 0 0.3em 0.06em rgba(${sunGold}, 0.85),
      inset 0 0.15em 0.3em rgba(${ink}, 0.45);
    filter: brightness(0.97);
  }
`

const turn = keyframes`
  to { transform: rotate(360deg); }
`

const sunrise = keyframes`
  from {
    box-shadow:
      0 0 0.15em 0.05em rgba(${sunGold}, 0.5),
      inset 0 -0.3em 0.4em rgba(${sunGold}, 0.35);
  }
  to {
    box-shadow:
      0 0 0.6em 0.3em rgba(${sunGold}, 0.95),
      inset 0 -0.6em 0.6em rgba(${sunGold}, 0.6);
  }
`

/**
 * The balloon is being carried and may land here: the sun pulses behind the disc, and its ring of cloud turns
 * gold and starts turning, the way a landing beacon draws the eye. It changes the moment the drag starts, so the player
 * sees at once every space they may aim at.
 *
 * The disc does not grow nor move: the framework places it with a transform, which the CSS `scale` would apply to as
 * well, sliding it across the table.
 */
export const balloonSpaceAwaitingCss = css`
  border-color: rgb(${sunGold});
  color: rgb(${ink});
  animation: ${sunrise} 0.8s ease-in-out infinite alternate;

  &:before {
    border: 0.08em dashed rgb(${sunGold});
    animation: ${turn} 6s linear infinite;
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;

    &:before {
      animation: none;
    }
  }
`

/**
 * A balloon carried right over the space: the sun has risen, it stops pulsing and shines its brightest. The framework
 * hands this style to the space as a class, which its own styles come after: `&&` lets it win over
 * {@link balloonSpaceAwaitingCss}, still on while the balloon is over the space.
 */
export const balloonSpaceDropCss = css`
  && {
    animation: none;
    border-color: rgb(${sunGold});
    box-shadow:
      0 0 0.3em 0.25em rgb(${sunGold}),
      0 0 0.9em 0.4em rgba(${sunGold}, 0.8),
      inset 0 -0.8em 0.7em rgba(${sunGold}, 0.75);
    color: rgb(${ink});
  }
`
