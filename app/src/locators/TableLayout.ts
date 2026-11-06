import { getStackCount } from '@gamepark/panorama/material/PanoramaTile'
import { PlayerColor } from '@gamepark/panorama/PlayerColor'
import { XYCoordinates } from '@gamepark/rules-api'

/**
 * The whole table, in centimetres, at the scale of the real components.
 *
 * On the left, the stacks form a star around the Centrepiece, as on the table: one stack in front of each side, its
 * sky pointing outwards. Stack 0 faces the side printed with the sunrise (the top side on every Centrepiece), and the
 * next ones follow clockwise. At the outer end of each stack is its space, where the Hot-Air Balloons stand, the Sun
 * beside them. The 3 Objectives lie in the bottom left corner of the table.
 *
 * On the right, the Panoramas, the reader's own first: one row each at 2 players, the reader alone above the 2 others
 * at 3 players, a square at 4 players (see panoramaCells).
 */

// ------------------------------------------------------------------ component sizes

/** The images carry a baked shadow: 0.2 cm on every side for cardboard, 0.24 cm for wood. Sizes include it. */
export const cardboardShadow = 0.2
const woodShadow = 0.24
export const panoramaTileSize = { width: 3.41, height: 9.98 }
export const startingTileSize = { width: 3.42, height: 11.58 }
export const centrepieceSizes: Record<number, { width: number; height: number }> = {
  2: { width: 6.34, height: 5.71 },
  3: { width: 6.5, height: 6.38 },
  4: { width: 6.76, height: 6.76 }
}
export const objectiveSize = { width: 4.08, height: 4.23 }
/** Provisional: the real size of the wooden balloons is unknown (see app/src/images/README.md) */
export const hotAirBalloonSize = { width: 2.68, height: 3.11 }
export const sunMoonDiameter = 2

/** Physical sizes, without the shadows */
const tileWidth = panoramaTileSize.width - 2 * cardboardShadow
const tileHeight = panoramaTileSize.height - 2 * cardboardShadow
const balloonWidth = hotAirBalloonSize.width - 2 * woodShadow
const balloonHeight = hotAirBalloonSize.height - 2 * woodShadow

// ------------------------------------------------------------------ star of stacks

/**
 * Distance from the middle of each Centrepiece to its sides, measured on the die line. The 2 player piece is a hexagon
 * with cut corners, the 3 player one a heptagon, the 4 player one an octagon.
 */
const centrepieceApothems: Record<number, number> = { 2: 2.65, 3: 2.86, 4: 3.17 }
const gap = 0.3

/**
 * The heptagon has a side at the top and a corner at the bottom, so the middle of its image lies below the middle of the
 * polygon, by half the difference between its circumradius and its apothem.
 */
function centrepieceImageShift(players: number) {
  const sides = getStackCount(players)
  if (sides % 2 === 0) return 0
  return (centrepieceApothems[players] * (1 / Math.cos(Math.PI / sides) - 1)) / 2
}

/** The tiles start at the side of the Centrepiece, unless they would overlap their neighbours there */
function stackInnerRadius(players: number) {
  const sides = getStackCount(players)
  return Math.max(centrepieceApothems[players] + gap / 2, (tileWidth / 2 + gap / 2) / Math.tan(Math.PI / sides))
}

/** The balloons stand on the axis of the stack, past its sky; the Sun stands beside them, just after clockwise */
const balloonRadius = (players: number) => stackInnerRadius(players) + tileHeight + gap + balloonHeight / 2
const sunOffset = balloonWidth / 2 + gap + sunMoonDiameter / 2

/** How far the star reaches from its middle: the top of the balloons, or the Sun beside them */
const starRadius = (players: number) =>
  Math.max(balloonRadius(players) + balloonHeight / 2, Math.hypot(balloonRadius(players), sunOffset) + sunMoonDiameter / 2)

/**
 * Discs, around the middle of the star, that cover everything that can stand on it: along each stack, its tiles and
 * balloons (all within half a tile width from its axis), and the Sun beside the balloons.
 */
function starDiscs(players: number) {
  const discs: { center: XYCoordinates; radius: number }[] = []
  for (let stack = 0; stack < getStackCount(players); stack++) {
    for (let r = stackInnerRadius(players); r <= balloonRadius(players); r += 0.1) {
      discs.push({ center: fromStarCenter(stack, players, r), radius: tileWidth / 2 })
    }
    discs.push({ center: fromStarCenter(stack, players, balloonRadius(players), sunOffset), radius: sunMoonDiameter / 2 })
  }
  return discs
}

/** How far the star reaches on the left and on the right of its middle */
export const starLeft = (players: number) => Math.min(...starDiscs(players).map(({ center, radius }) => center.x - radius))
const starRight = (players: number) => Math.max(...starDiscs(players).map(({ center, radius }) => center.x + radius))

const objectivesSpacing = 0.1
export const objectiveGap = objectiveSize.width + objectivesSpacing
const objectivesWidth = 3 * objectiveSize.width + 2 * objectivesSpacing
/** The Objectives stand in the bottom left corner of the table, that far from its edges */
const objectivesMargin = 1
/** The table reaches a little further than the star on its left */
export const tableEdge = 0.2

/**
 * The Objectives lie in the bottom left corner of the table, in the room left between two branches of the star. The
 * column of common elements only grows downwards when a stack, balloon or Sun would touch them (at 3 players).
 * Returns the top of the Objectives, from the middle of the star, when this column is as high as the table.
 */
function objectivesTop(players: number) {
  const left = starLeft(players) - tableEdge + objectivesMargin
  const right = left + objectivesWidth
  let top = starRadius(players) - objectiveSize.height - objectivesMargin
  for (const { center, radius } of starDiscs(players)) {
    if (center.x + radius + gap > left && center.x - radius - gap < right) top = Math.max(top, center.y + radius + gap)
  }
  return top
}

/** Height of the column of common elements (star and Objectives) */
export const commonColumnHeight = (players: number) => starRadius(players) + objectivesTop(players) + objectiveSize.height + objectivesMargin

/** The middle of the star, where the Centrepiece lies: the column of common elements is centred on y = 0 */
function starCenter(players: number): XYCoordinates {
  return { x: 0, y: starRadius(players) - commonColumnHeight(players) / 2 }
}

/** The middle of the first Objective, the others following to the right */
export function firstObjectivePosition({ xMin, yMax }: { xMin: number; yMax: number }): XYCoordinates {
  return { x: xMin + objectivesMargin + objectiveSize.width / 2, y: yMax - objectivesMargin - objectiveSize.height / 2 }
}

export function centrepiecePosition(players: number): XYCoordinates {
  const center = starCenter(players)
  return { x: center.x, y: center.y + centrepieceImageShift(players) }
}

/** Clockwise angle of a stack, from the top side of the Centrepiece */
export function stackAngle(stack: number, players: number) {
  return (stack * 360) / getStackCount(players)
}

/** A point at this distance along the axis of a stack, shifted clockwise by an offset across it */
function fromStarCenter(stack: number, players: number, radius: number, offset = 0): XYCoordinates {
  const angle = (stackAngle(stack, players) * Math.PI) / 180
  return {
    x: radius * Math.sin(angle) + offset * Math.cos(angle),
    y: -radius * Math.cos(angle) + offset * Math.sin(angle)
  }
}

function onRadius(stack: number, players: number, radius: number, offset = 0): XYCoordinates {
  const center = starCenter(players)
  const point = fromStarCenter(stack, players, radius, offset)
  return { x: center.x + point.x, y: center.y + point.y }
}

export const stackPosition = (stack: number, players: number) => onRadius(stack, players, stackInnerRadius(players) + tileHeight / 2)

/** The count of tiles left in a stack straddles its inner end and the side of the Centrepiece */
export const stackCountPosition = (stack: number, players: number) => onRadius(stack, players, stackInnerRadius(players))

export const balloonPosition = (stack: number, players: number) => onRadius(stack, players, balloonRadius(players))
export const sunPosition = (stack: number, players: number) =>
  onRadius(stack, players, balloonRadius(players), sunOffset)

// ------------------------------------------------------------------ Panorama

/**
 * The edges of the tiles are waves, 1.55 cm long and 1 mm deep (measured on the die line): a tile interlocks with its
 * neighbour every 1.55 cm vertically, and both overlap by the depth of the wave horizontally.
 */
export const waveLength = 1.55
export const columnWidth = tileWidth - 0.1
/** A Panorama Tile is that many waves high; the Starting Tile has one more wave of sky on top, its bottom level with the others */
export const tileWaves = tileHeight / waveLength
export const startingTileRise = (startingTileSize.height - panoramaTileSize.height) / 2

/**
 * The box kept by default for each Panorama: as many columns as a Panorama may reasonably reach at this player count
 * (about 28 / players tiles each, plus the Starting Tile), and two waves of offset above and below the Starting Tile. The
 * box shifts when a Panorama does not fit in it, and grows when it is larger (see PanoramaWindow).
 */
export const panoramaColumns = (players: number) => (players === 2 ? 12 : 10)
export const panoramaWaves = tileWaves + 1 + 4
export const rowGap = 0.4
export const boxGap = 0.6

export const panoramaLeft = (players: number) => starRight(players) + 0.6 + cardboardShadow

/** The reader's Panorama comes first (the first player's for a spectator), then the others in turn order */
export function displayIndex(player: PlayerColor, players: PlayerColor[], me?: PlayerColor) {
  const start = me !== undefined ? players.indexOf(me) : 0
  return (players.indexOf(player) - start + players.length) % players.length
}

/**
 * Where the panel of a player stands: on the right of the screen, just right of their Panorama, above or under it.
 * Chosen for the table to be as large as possible on a wide screen. With 1 Panorama per row (2 players), the table is
 * as high as the screen and has room on its right. With 2 Panoramas per row (3 and 4 players), it is as wide as the
 * screen: panels above or under the Panoramas cost nothing, panels on the right would shrink it.
 */
export type PanelPlace = 'right' | 'beside' | 'above' | 'below'

/** The Panoramas in display order: their cell (column and row) and where their panel stands */
const panoramaCells: Record<number, { column: number; row: number; panel: PanelPlace }[]> = {
  /** One row each, the reader's on top */
  2: [
    { column: 0, row: 0, panel: 'right' },
    { column: 0, row: 1, panel: 'right' }
  ],
  /** The reader's row on top, their panel in the room on its right; the 2 others side by side below */
  3: [
    { column: 0, row: 0, panel: 'beside' },
    { column: 0, row: 1, panel: 'below' },
    { column: 1, row: 1, panel: 'below' }
  ],
  /** A square, in turn order: the reader top left, the next player top right; the panels on the outside */
  4: [
    { column: 0, row: 0, panel: 'above' },
    { column: 1, row: 0, panel: 'above' },
    { column: 0, row: 1, panel: 'below' },
    { column: 1, row: 1, panel: 'below' }
  ]
}

export const cells = (players: number) => panoramaCells[players] ?? panoramaCells[2]

/** The room kept for panels above or under rows: one per row and side */
export const panelRooms = (players: number) =>
  cells(players).filter(
    (cell, index, all) =>
      (cell.panel === 'above' || cell.panel === 'below') &&
      all.findIndex((other) => other.row === cell.row && other.panel === cell.panel) === index
  )

/**
 * The room kept under a row for its panels, which keep their size on the screen: zoomed out, the table fills the height
 * between its margins, so the panels take a fixed share of its height.
 */
export const panelShare = (players: number) => {
  const margin = tableMargin(players)
  return (panelEmHeight + 2 * panelEmGap) / (100 - margin.top - margin.bottom)
}

// ------------------------------------------------------------------ screen

/** The player panels are drawn on the screen, in em, out of the table */
export const panelEmWidth = 28
/** Measured in the browser: update it if the content of the panels changes */
export const panelEmHeight = 12
export const panelEmGap = 1

/** The screen around the table, in em: the header above it, and the panels on its right, against its edge, if any */
export function tableMargin(players: number) {
  const panelsOnRight = cells(players).some((cell) => cell.panel === 'right')
  return { top: 7, left: 0, right: panelsOnRight ? panelEmWidth + panelEmGap : panelEmGap, bottom: 0 }
}

/** The balloon printed on the Starting Tiles is that far below their top edge */
export const startingTileBalloon = 1.6
