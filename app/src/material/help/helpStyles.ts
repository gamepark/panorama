import { css } from '@emotion/react'

/**
 * The look shared by the help dialogs: a title, a short introduction, then sections, each with a heading. The colours
 * come from the theme of the dialog.
 */

/** The name of the item, at the top of the dialog */
export const helpTitle = css`
  margin: 0 0 0.5em 0 !important;
  padding-bottom: 0.25em;
  border-bottom: 0.08em solid currentColor;
  text-align: left !important;
`

/** A heading over a section */
export const helpSection = css`
  margin: 1em 0 0.3em 0;
  font-size: 1.05em;
  font-weight: bold;
`

/** A paragraph */
export const helpText = css`
  margin: 0 0 0.5em 0;
  line-height: 1.45;
`

/** A list of steps or of rules */
export const helpList = css`
  margin: 0 0 0.5em 0;
  padding-left: 1.3em;
  line-height: 1.45;

  li {
    margin-bottom: 0.3em;
  }
`

/** An icon inside a sentence or a table */
export const helpIcon = css`
  height: 1.6em;
  vertical-align: middle;
`

/** Where the item stands now, at the bottom of the dialog */
export const helpNote = css`
  margin: 1em 0 0 0;
  font-style: italic;
`
