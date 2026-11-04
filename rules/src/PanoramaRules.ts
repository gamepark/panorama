import {
  CompetitiveScore,
  HiddenMaterialRules,
  isMoveItemType,
  LocalMovePreview,
  MaterialGame,
  MaterialItem,
  MaterialMove,
  PositiveSequenceStrategy,
  TimeLimit
} from '@gamepark/rules-api'
import { LocationType } from './material/LocationType'
import { MaterialType } from './material/MaterialType'
import { PlayerColor } from './PlayerColor'
import { Memory, PreviewTile } from './rules/Memory'
import { MoveBalloonRule } from './rules/MoveBalloonRule'
import { PlaceTileRule } from './rules/PlaceTileRule'
import { RuleId } from './rules/RuleId'
import { Scoring } from './Scoring'

/**
 * The stacks are face up, but only their top tile can be seen. When a tile is taken, the one below it is revealed only
 * once the turn is over (rotation = revealed).
 */
const hideUnrevealedTile = (item: MaterialItem<PlayerColor, LocationType>): string[] => (item.location.rotation ? [] : ['id'])

/**
 * This class implements the rules of the board game.
 * It must follow Game Park "Rules" API so that the Game Park server can enforce the rules.
 */
export class PanoramaRules
  extends HiddenMaterialRules<PlayerColor, MaterialType, LocationType>
  implements
    TimeLimit<MaterialGame<PlayerColor, MaterialType, LocationType>, MaterialMove<PlayerColor, MaterialType, LocationType>, PlayerColor>,
    LocalMovePreview<MaterialMove<PlayerColor, MaterialType, LocationType>>,
    CompetitiveScore<MaterialGame<PlayerColor, MaterialType, LocationType>, MaterialMove<PlayerColor, MaterialType, LocationType>, PlayerColor>
{
  rules = {
    [RuleId.MoveBalloon]: MoveBalloonRule,
    [RuleId.PlaceTile]: PlaceTileRule
  }

  locationsStrategies = {
    [MaterialType.PanoramaTile]: {
      [LocationType.Stack]: new PositiveSequenceStrategy()
    },
    [MaterialType.ObjectiveToken]: {
      [LocationType.Objectives]: new PositiveSequenceStrategy()
    }
  }

  hidingStrategies = {
    [MaterialType.PanoramaTile]: {
      [LocationType.Stack]: hideUnrevealedTile
    }
  }

  /**
   * Laying a tile in one's Panorama stays on the player's side, as a preview they can still change. Only the validation,
   * a move of the previewed tile to the place where it already is, goes to the server.
   */
  previewMove(move: MaterialMove<PlayerColor, MaterialType, LocationType>): boolean {
    if (!isMoveItemType(MaterialType.PanoramaTile)(move) || move.location.type !== LocationType.Panorama) return false
    const current = this.material(MaterialType.PanoramaTile).getItem(move.itemIndex).location
    const samePlace = current.type === move.location.type && current.player === move.location.player && current.x === move.location.x && current.y === move.location.y
    return this.remind<PreviewTile | undefined>(Memory.PreviewTile)?.tile !== move.itemIndex || !samePlace
  }

  /** See Scoring: the terrains, then the Objectives. Tied players share the victory. */
  getScore(player: PlayerColor): number {
    return new Scoring(this).score(player)
  }

  giveTime(): number {
    return 60
  }
}
