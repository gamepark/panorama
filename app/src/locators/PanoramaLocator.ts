import { LocationType } from '@gamepark/panorama/material/LocationType'
import { MaterialType } from '@gamepark/panorama/material/MaterialType'
import { PlayerColor } from '@gamepark/panorama/PlayerColor'
import { ItemContext, Locator, MaterialContext } from '@gamepark/react-game'
import { Coordinates, Location, MaterialGame, MaterialItem, MaterialRules } from '@gamepark/rules-api'
import { defaultPanoramaWindow, fitPanoramaWindow, PanoramaSlot, PanoramaWindow } from './PanoramaWindow'
import { columnWidth, panoramaBox, startingTileRise, tileWaves, waveLength } from './TableLayout'

type PanoramaRules = MaterialRules<PlayerColor, MaterialType, LocationType>

function panoramaSlots(player: PlayerColor, rules: PanoramaRules): PanoramaSlot[] {
  return [MaterialType.StartingTile, MaterialType.PanoramaTile].flatMap((type) =>
    rules
      .material(type)
      .location(LocationType.Panorama)
      .player(player)
      .getItems()
      .map((item) => ({ x: item.location.x!, y: item.location.y ?? 0, rise: type === MaterialType.StartingTile ? 1 : 0 }))
  )
}

/**
 * A player's Panorama: x is the column (the Starting Tile is 0), y the vertical offset in waves (positive is lower).
 *
 * Each Panorama has a box of its own (see TableLayout). Its tiles do not move while they fit in it: the box only
 * slides over the Panorama when a tile is laid outside, just enough to show it again. Where each box stands is
 * remembered here, and refreshed whenever the game state changes.
 */
class PanoramaLocator extends Locator<PlayerColor, MaterialType, LocationType> {
  windows: Partial<Record<PlayerColor, PanoramaWindow>> = {}
  game?: MaterialGame<PlayerColor, MaterialType, LocationType>

  getWindow(player: PlayerColor, rules: PanoramaRules): PanoramaWindow {
    if (rules.game !== this.game) {
      this.game = rules.game
      for (const player of rules.players) {
        const players = rules.players.length
        this.windows[player] = fitPanoramaWindow(this.windows[player] ?? defaultPanoramaWindow(players), panoramaSlots(player, rules), players)
      }
    }
    return this.windows[player] ?? defaultPanoramaWindow(rules.players.length)
  }

  getPositionDependencies(location: Location<PlayerColor, LocationType>, { rules }: MaterialContext<PlayerColor, MaterialType, LocationType>) {
    return this.getWindow(location.player!, rules)
  }

  /** The middle of a Panorama Tile laid at this column and offset */
  getCoordinates(location: Location<PlayerColor, LocationType>, { rules, player: me }: MaterialContext<PlayerColor, MaterialType, LocationType>) {
    const player = location.player!
    const window = this.getWindow(player, rules)
    const box = panoramaBox(player, rules.players, me)
    return {
      x: box.x + (location.x! - window.column + 0.5) * columnWidth,
      y: box.y + ((location.y ?? 0) - window.top + tileWaves / 2) * waveLength
    }
  }

  /** The Starting Tile is one wave taller, its bottom level with the other tiles */
  getItemCoordinates(item: MaterialItem<PlayerColor, LocationType>, context: ItemContext<PlayerColor, MaterialType, LocationType>): Partial<Coordinates> {
    const coordinates = super.getItemCoordinates(item, context)
    if (context.type !== MaterialType.StartingTile) return coordinates
    return { ...coordinates, y: (coordinates.y ?? 0) - startingTileRise }
  }
}

export const panoramaLocator = new PanoramaLocator()
