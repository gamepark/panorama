import { css, keyframes } from '@emotion/react'

const float = keyframes`
  from { transform: translateY(0.05em); }
  to { transform: translateY(-0.1em); }
`

const balloonIconCss = css`
  position: absolute;
  left: 50%;
  top: 50%;
  width: 42%;
  margin-left: -21%;
  margin-top: -26.25%;
  pointer-events: none;
  animation: ${float} 1.6s ease-in-out infinite alternate;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`

/** The silhouette of a balloon, drawn in the ink of the disc. */
export const BalloonSpaceContent = () => (
  <svg css={balloonIconCss} viewBox="0 0 24 30" fill="currentColor" aria-hidden>
    <path d="M12 1C5.6 1 2 5.8 2 11c0 5 4 8.5 7 11h6c3-2.5 7-6 7-11 0-5.2-3.6-10-10-10z" />
    <path d="M12 1.6c-2.6 2.4-3.4 5.8-3.4 9.4 0 4.3 0.9 8 1.6 11M12 1.6c2.6 2.4 3.4 5.8 3.4 9.4 0 4.3-0.9 8-1.6 11" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="0.9" />
    <path d="M9.2 22l0.9 3M14.8 22l-0.9 3" fill="none" stroke="currentColor" strokeWidth="0.8" />
    <rect x="9.6" y="25" width="4.8" height="3.6" rx="0.7" />
  </svg>
)
