import { MaterialGameSetup } from '@gamepark/rules-api'
import { PanoramaOptions } from './PanoramaOptions'
import { PanoramaRules } from './PanoramaRules'
import { LocationType } from './material/LocationType'
import { MaterialType } from './material/MaterialType'
import { PlayerColor } from './PlayerColor'
import { RuleId } from './rules/RuleId'

/**
 * This class creates a new Game based on the game options
 */
export class PanoramaSetup extends MaterialGameSetup<PlayerColor, MaterialType, LocationType, PanoramaOptions> {
  Rules = PanoramaRules

  setupMaterial(_options: PanoramaOptions) {
    // TODO
  }

  start() {
    this.startPlayerTurn(RuleId.TheFirstStep, this.players[0])
  }
}
