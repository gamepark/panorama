import { getEnumValues, MaterialGameSetup } from '@gamepark/rules-api'
import { sample, shuffle } from 'es-toolkit'
import { LocationType } from './material/LocationType'
import { MaterialType } from './material/MaterialType'
import { getObjectiveCategory, Objective, ObjectiveCategory } from './material/Objective'
import { getStackCount, panoramaTiles, stackSize } from './material/PanoramaTile'
import { PanoramaOptions } from './PanoramaOptions'
import { PanoramaRules } from './PanoramaRules'
import { PlayerColor } from './PlayerColor'
import { RuleId } from './rules/RuleId'

/**
 * This class creates a new Game based on the game options
 */
export class PanoramaSetup extends MaterialGameSetup<PlayerColor, MaterialType, LocationType, PanoramaOptions> {
  Rules = PanoramaRules

  setupMaterial(_options: PanoramaOptions) {
    this.material(MaterialType.Centrepiece).createItem({ id: this.players.length, location: { type: LocationType.Centrepiece } })
    this.setupStacks()
    this.material(MaterialType.SunMoonToken).createItem({ location: { type: LocationType.StackSpace, id: 0 } })
    this.setupObjectives()
    this.setupPlayers()
  }

  /**
   * Stacks of 4 tiles, one per side of the Centrepiece, their top tile revealed. The unused tiles go back to the box.
   */
  setupStacks() {
    const stacks = getStackCount(this.players.length)
    const tiles = shuffle(panoramaTiles)
    for (let stack = 0; stack < stacks; stack++) {
      const ids = tiles.slice(stack * stackSize, (stack + 1) * stackSize)
      this.material(MaterialType.PanoramaTile).createItems(
        ids.map((id, x) => ({ id, location: { type: LocationType.Stack, id: stack, x, rotation: x === stackSize - 1 || undefined } }))
      )
    }
  }

  /**
   * One Objective of each colour, drawn at random.
   * TODO: options for the first game (the 3 starred Objectives) and the scenarios (rulebook p.15)
   */
  setupObjectives() {
    const objectives = getEnumValues(Objective)
    for (const category of getEnumValues(ObjectiveCategory)) {
      const objective = sample(objectives.filter((objective) => getObjectiveCategory(objective) === category))
      this.material(MaterialType.ObjectiveToken).createItem({ id: objective, location: { type: LocationType.Objectives } })
    }
  }

  /**
   * Each player gets the Starting Tile and the Hot-Air Balloon of their colour. The balloons are dropped at random:
   * the first one in front of the stack of the Sun, the next ones clockwise.
   */
  setupPlayers() {
    for (const player of this.players) {
      this.material(MaterialType.StartingTile).createItem({ id: player, location: { type: LocationType.Panorama, player, x: 0, y: 0 } })
    }
    shuffle(this.players).forEach((player, stack) => {
      this.material(MaterialType.HotAirBalloon).createItem({ id: player, location: { type: LocationType.StackSpace, id: stack } })
    })
  }

  /**
   * The player whose Hot-Air Balloon stands with the Sun plays first.
   */
  start() {
    const balloon = this.material(MaterialType.HotAirBalloon).location((location) => location.type === LocationType.StackSpace && location.id === 0)
    this.startPlayerTurn(RuleId.MoveBalloon, balloon.getItem<PlayerColor>()!.id)
  }
}
