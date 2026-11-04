import { LocationType } from '@gamepark/panorama/material/LocationType'
import { MaterialType } from '@gamepark/panorama/material/MaterialType'
import { PlayerColor } from '@gamepark/panorama/PlayerColor'
import { ItemContext, MaterialContext, SquareGridLocator } from '@gamepark/react-game'
import { Coordinates, isMoveItemType, Location, MaterialItem, MaterialRules, Polyomino } from '@gamepark/rules-api'
import { range } from 'es-toolkit'
import { PanoramaLayout } from './PanoramaLayout'
import { columnWidth, startingTileRise, tileWaves, waveLength } from './TableLayout'

type PanoramaRules = MaterialRules<PlayerColor, MaterialType, LocationType>

/**
 * A player's Panorama, on a grid of columns (x, the Starting Tile is 0) and waves (y, positive is lower): a cell is one
 * column wide and one wave high, and a tile is drawn centred on the cell of its location.
 *
 * Each Panorama has a box of its own (see PanoramaLayout): its tiles do not move while they fit in it, the box shifts
 * when they do not, and it grows when the Panorama is larger. The box only depends on the state of the game, so it never
 * lags behind it.
 *
 * While a tile is dragged, the whole Panorama and the columns on its sides are one drop area: the tile is previewed,
 * then laid, at the legal place closest to it.
 */
class PanoramaLocator extends SquareGridLocator<PlayerColor, MaterialType, LocationType> {
  size = { x: columnWidth, y: waveLength }

  /** Every Panorama moves when a box of the grid grows */
  getPositionDependencies(_location: Location<PlayerColor, LocationType>, { rules, player }: MaterialContext<PlayerColor, MaterialType, LocationType>) {
    return PanoramaLayout.of(rules as PanoramaRules, player).frames
  }

  /** The origin of the grid: where the middle of a tile at column 0 and offset 0 stands */
  getCoordinates(location: Location<PlayerColor, LocationType>, { rules, player }: MaterialContext<PlayerColor, MaterialType, LocationType>): Partial<Coordinates> {
    return PanoramaLayout.of(rules as PanoramaRules, player).tileCenter(location.player!, 0, 0)
  }

  /** The cells covered by the tiles at every legal place in this Panorama */
  getDropArea(location: Location<PlayerColor, LocationType>, { rules }: MaterialContext<PlayerColor, MaterialType, LocationType>) {
    const player = rules.getActivePlayer()
    if (player === undefined) return undefined
    const places = rules
      .getLegalMoves(player)
      .filter(isMoveItemType(MaterialType.PanoramaTile))
      .filter((move) => move.location.type === LocationType.Panorama && move.location.player === location.player)
      .map((move) => move.location)
    if (!places.length) return undefined
    const xs = places.map((place) => place.x!)
    const ys = places.map((place) => place.y!)
    const halfTile = Math.floor(tileWaves / 2)
    const xMin = Math.min(...xs)
    const yMin = Math.min(...ys) - halfTile
    const rows = range(yMin, Math.max(...ys) + halfTile + 1)
    return new Polyomino(
      rows.map(() => range(xMin, Math.max(...xs) + 1).map(() => true)),
      { xMin, yMin }
    )
  }

  /** The drop area stands around the cells it covers, from the origin of the grid */
  getAreaCoordinates(location: Location<PlayerColor, LocationType>, context: MaterialContext<PlayerColor, MaterialType, LocationType>) {
    const { x = 0, y = 0, z } = this.getCoordinates(location, context)
    const area = this.getDropArea(location, context)
    if (!area) return { x, y, z }
    const { xMin, xMax, yMin, yMax } = this.getBoundaries(area)
    return { x: x + (xMin + xMax) / 2, y: y + (yMin + yMax) / 2, z }
  }

  /** The Starting Tile is one wave taller, its bottom level with the other tiles */
  getItemCoordinates(item: MaterialItem<PlayerColor, LocationType>, context: ItemContext<PlayerColor, MaterialType, LocationType>): Partial<Coordinates> {
    const coordinates = super.getItemCoordinates(item, context)
    if (context.type !== MaterialType.StartingTile) return coordinates
    return { ...coordinates, y: (coordinates.y ?? 0) - startingTileRise }
  }
}

export const panoramaLocator = new PanoramaLocator()
