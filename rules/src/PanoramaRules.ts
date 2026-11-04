import { HiddenMaterialRules, MaterialGame, MaterialItem, MaterialMove, PositiveSequenceStrategy, TimeLimit } from '@gamepark/rules-api'
import { LocationType } from './material/LocationType'
import { MaterialType } from './material/MaterialType'
import { PlayerColor } from './PlayerColor'
import { RuleId } from './rules/RuleId'
import { TheFirstStepRule } from './rules/TheFirstStepRule'

/**
 * The stacks are face up, but only their top tile can be seen: the ones below it are covered.
 */
const hideCoveredTile = (item: MaterialItem<PlayerColor, LocationType>): string[] => (item.location.x! > 0 ? ['id'] : [])

/**
 * This class implements the rules of the board game.
 * It must follow Game Park "Rules" API so that the Game Park server can enforce the rules.
 */
export class PanoramaRules
  extends HiddenMaterialRules<PlayerColor, MaterialType, LocationType>
  implements TimeLimit<MaterialGame<PlayerColor, MaterialType, LocationType>, MaterialMove<PlayerColor, MaterialType, LocationType>, PlayerColor>
{
  rules = {
    [RuleId.TheFirstStep]: TheFirstStepRule
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
      [LocationType.Stack]: hideCoveredTile
    }
  }

  giveTime(): number {
    return 60
  }
}
