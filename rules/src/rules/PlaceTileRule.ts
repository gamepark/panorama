import { isMoveItemType, ItemMove, Location, Material, MaterialMove, PlayerTurnRule, PlayMoveContext } from '@gamepark/rules-api'
import { range } from 'es-toolkit'
import { LocationType } from '../material/LocationType'
import { MaterialType } from '../material/MaterialType'
import { getStackCount, startingTileRise, tileWaves } from '../material/PanoramaTile'
import { PlayerColor } from '../PlayerColor'
import { Memory } from './Memory'
import { RuleId } from './RuleId'

/**
 * The player adds the top tile of the stack where their Hot-Air Balloon stands to the left or to the right of their
 * Panorama, with any vertical offset that keeps it interlocked with its neighbour.
 *
 * Laying the tile is a preview, kept on the player's side (see PanoramaRules.previewMove): they can still move it, or put
 * it back. Validating sends the move to its current place. Then the next tile of the stack is revealed and the Sun
 * moves on.
 */
export class PlaceTileRule extends PlayerTurnRule<PlayerColor, MaterialType, LocationType> {
  get balloon() {
    return this.material(MaterialType.HotAirBalloon).id(this.player)
  }

  get stack(): number {
    return this.balloon.getItem()!.location.id as number
  }

  get stackTiles() {
    return this.material(MaterialType.PanoramaTile).location(LocationType.Stack).locationId(this.stack)
  }

  /** The tile to lay: the one previewed in the Panorama, or else the top tile of the stack */
  get tile(): Material<PlayerColor, MaterialType, LocationType> {
    const preview = this.remind<number | undefined>(Memory.PreviewTile)
    if (preview !== undefined) return this.material(MaterialType.PanoramaTile).index(preview)
    return this.stackTiles.maxBy((item) => item.location.x!)
  }

  getPlayerMoves(): MaterialMove<PlayerColor, MaterialType, LocationType>[] {
    const tile = this.tile
    if (!tile.length) return []
    return this.getPlacements().map((location) => tile.moveItem(location))
  }

  /**
   * Left or right of the Panorama (the previewed tile aside), each offset sharing at least one wave with the neighbour.
   * The Starting Tile is column 0: the Panorama Tiles are on its left (x < 0) or on its right (x > 0), so the neighbour
   * on a side is the outermost tile there, or the Starting Tile while that side is empty.
   */
  getPlacements(): Location<PlayerColor, LocationType>[] {
    const preview = this.remind<number | undefined>(Memory.PreviewTile)
    const startingTile = this.material(MaterialType.StartingTile).id(this.player).getItem()!
    const tiles = this.material(MaterialType.PanoramaTile)
      .location(LocationType.Panorama)
      .player(this.player)
      .filter((_, index) => index !== preview)
    return [-1, 1].flatMap((side) => {
      const neighbour = tiles.location((location) => Math.sign(location.x!) === side).maxBy((item) => side * item.location.x!).getItem() ?? startingTile
      const y = neighbour.location.y ?? 0
      // The Starting Tile (column 0) is one wave taller, at the top: a tile beside it can be laid one wave higher
      const top = neighbour.location.x === 0 ? y - startingTileRise : y
      return range(top - tileWaves + 1, y + tileWaves).map((y) => ({ type: LocationType.Panorama, player: this.player, x: neighbour.location.x! + side, y }))
    })
  }

  afterItemMove(move: ItemMove<PlayerColor, MaterialType, LocationType>, context?: PlayMoveContext): MaterialMove<PlayerColor, MaterialType, LocationType>[] {
    if (!isMoveItemType(MaterialType.PanoramaTile)(move)) return []
    if (move.location.type === LocationType.Stack) {
      // The player put the previewed tile back
      this.forget(Memory.PreviewTile)
      return []
    }
    if (context?.local) {
      this.memorize(Memory.PreviewTile, move.itemIndex)
      return []
    }
    this.forget(Memory.PreviewTile)
    return this.endTurn()
  }

  /**
   * The next tile of the stack is revealed. Whoever took the last tile of a stack deflates their Hot-Air Balloon, and
   * the Sun turns into the Moon: then every player plays one last turn when the Moon reaches them, and deflates their
   * balloon. The Sun (or the Moon) moves clockwise to the next Hot-Air Balloon still flying, whose owner plays next.
   */
  endTurn(): MaterialMove<PlayerColor, MaterialType, LocationType>[] {
    const moves: MaterialMove<PlayerColor, MaterialType, LocationType>[] = []
    const nextTile = this.stackTiles.maxBy((item) => item.location.x!)
    if (nextTile.length) {
      moves.push(nextTile.moveItem((item) => ({ ...item.location, rotation: true })))
    }
    const sun = this.material(MaterialType.SunMoonToken)
    const moon = !!sun.getItem()!.location.rotation || !nextTile.length
    if (moon) {
      moves.push(this.balloon.moveItem((item) => ({ ...item.location, rotation: true })))
    }
    const next = this.getNextBalloon(sun.getItem()!.location.id as number, moon)
    if (!next) {
      moves.push(this.endGame())
      return moves
    }
    moves.push(sun.moveItem({ type: LocationType.StackSpace, id: next.location.id, rotation: moon || undefined }))
    moves.push(this.startPlayerTurn(RuleId.MoveBalloon, next.id))
    return moves
  }

  /** The first Hot-Air Balloon still flying clockwise from this stack (the active player's one is deflating if the Moon is out) */
  getNextBalloon(from: number, moon: boolean) {
    const stacks = getStackCount(this.game.players.length)
    const flying = this.material(MaterialType.HotAirBalloon)
      .getItems<PlayerColor>()
      .filter((item) => !item.location.rotation && !(moon && item.id === this.player))
    return range(1, stacks + 1)
      .map((step) => (from + step) % stacks)
      .map((stack) => flying.find((item) => item.location.id === stack))
      .find((item) => item !== undefined)
  }
}
