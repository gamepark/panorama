import { LocationType } from '@gamepark/panorama/material/LocationType'
import { MaterialType } from '@gamepark/panorama/material/MaterialType'
import { Landscape } from '@gamepark/panorama/material/Landscape'
import { getStackCount, panoramaTiles, stackSize } from '@gamepark/panorama/material/PanoramaTile'
import { panoramaTileContents } from '@gamepark/panorama/material/TileContents'
import { PanoramaSetup } from '@gamepark/panorama/PanoramaSetup'
import { PlayerColor } from '@gamepark/panorama/PlayerColor'
import { sample, shuffle } from 'es-toolkit'

/** The reader plays the blue Hot-Air Balloon, dropped first: it starts with the Sun, so the reader opens the game */
export const tutorialPlayer = PlayerColor.Blue
export const tutorialOpponent = PlayerColor.Red

/**
 * The stacks the script names. The balloons start on stacks 0 (blue, with the Sun) and 1 (red).
 * - The reader flies to stack 2, just past the red balloon: the Sun then moves on to the opponent.
 * - The opponent flies to stack 4, leaving stack 3 empty between the 2 balloons: flying there, the reader would play
 *   twice in a row.
 */
export const scriptedStacks = { first: 2, gap: 3, opponent: 4 }

const clouds = (tile: number) => panoramaTileContents[tile].clouds
const crows = (tile: number) => panoramaTileContents[tile].animals.filter((animal) => animal === Landscape.Fields).length
const hasRiver = (tile: number) => panoramaTileContents[tile].river !== undefined

/**
 * The tiles the 2 players take: no Cloud, 1 Crow and a River, so that each of them counts for the 3 Objectives of a
 * first game, which the tutorial explains right after.
 */
export const isTakenTile = (tile: number) => clouds(tile) === 0 && crows(tile) === 1 && hasRiver(tile)

/** The tile the opponent leaves behind on {@link scriptedStacks.gap}: 1 Cloud, no Crow and no River */
export const isSkippedTile = (tile: number) => clouds(tile) === 1 && crows(tile) === 0 && !hasRiver(tile)

/**
 * The tile on top of {@link scriptedStacks.first}, one of the {@link isTakenTile}. Laid on the right of the Starting
 * Tile, level with it, it carries on its River, its Mountain and its Forest, and its Fox shares a Forest with the Flower
 * of the Starting Tile.
 */
export const firstTile = 21

/** Where the reader lays {@link firstTile}: right of the Starting Tile, level with it */
export const firstTilePlace = { x: 1, y: 0 }

/**
 * The table the tutorial opens on: the 2 balloons are fixed, and so are the tops of the 3 stacks the script names: the
 * first tile of the reader, then the skipped tile and the opponent's tile, each drawn among those that fit (see
 * {@link isTakenTile} and {@link isSkippedTile}). The tutorial plays with the Objectives of a first game (see
 * PanoramaTutorial.options). Every other tile is shuffled.
 */
export class TutorialSetup extends PanoramaSetup {
  setupStacks() {
    const tops: Record<number, number> = { [scriptedStacks.first]: firstTile }
    tops[scriptedStacks.gap] = sample(panoramaTiles.filter(isSkippedTile))
    tops[scriptedStacks.opponent] = sample(panoramaTiles.filter((tile) => isTakenTile(tile) && tile !== firstTile))
    const tiles = shuffle(panoramaTiles.filter((tile) => !Object.values(tops).includes(tile)))
    const stacks = getStackCount(this.players.length)
    for (let stack = 0; stack < stacks; stack++) {
      const top = tops[stack]
      const ids = top === undefined ? tiles.splice(0, stackSize) : [...tiles.splice(0, stackSize - 1), top]
      this.material(MaterialType.PanoramaTile).createItems(
        ids.map((id, x) => ({ id, location: { type: LocationType.Stack, id: stack, x, rotation: x === stackSize - 1 || undefined } }))
      )
    }
  }
}
