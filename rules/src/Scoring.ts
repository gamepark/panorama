import { MaterialRules, MaterialRulesPart } from '@gamepark/rules-api'
import { sumBy } from 'es-toolkit'
import { Landscape, terrains } from './material/Landscape'
import { LocationType } from './material/LocationType'
import { MaterialType } from './material/MaterialType'
import { Objective } from './material/Objective'
import { PanoramaView } from './material/PanoramaView'
import { PlayerColor } from './PlayerColor'

/** Points of each Objective, for each player who meets it best */
export const objectivePoints = 10

const most = (values: number[]) => Math.max(0, ...values)

/** How well a Panorama meets each Objective (rulebook pages 12 to 14) */
export const objectiveValues: Record<Objective, (panorama: PanoramaView) => number> = {
  [Objective.FewestClouds]: (panorama) => sumBy(panorama.tiles, (tile) => tile.content.clouds),
  [Objective.MostCloudsOneSide]: (panorama) => most(panorama.sides.map((side) => sumBy(side, (tile) => tile.content.clouds))),
  [Objective.LargestSky]: (panorama) => most(panorama.zones.filter((zone) => zone.landscape === Landscape.Sky).map((zone) => zone.tiles)),
  [Objective.MostTilesOneSide]: (panorama) => most(panorama.sides.map((side) => side.length)),
  [Objective.LongestRiver]: (panorama) => most(panorama.rivers.map((river) => river.tiles)),
  [Objective.MostAnimalsSameRiver]: (panorama) => most(panorama.rivers.map((river) => river.animals)),
  [Objective.MostSeparateRivers]: (panorama) => panorama.rivers.filter((river) => river.tiles >= 2).length,
  [Objective.MostWaterfallsSameRiver]: (panorama) => most(panorama.rivers.map((river) => river.waterfalls)),
  [Objective.MostCrows]: (panorama) => sumBy(panorama.tiles, (tile) => tile.content.animals.filter((animal) => animal === Landscape.Fields).length),
  [Objective.FewestTiles]: (panorama) => panorama.tiles.length - 1,
  [Objective.MostZonesWithAnimal]: (panorama) => panorama.terrainZones.filter((zone) => zone.animals > 0).length,
  [Objective.FewestZones]: (panorama) => panorama.terrainZones.length
}

/** The Objectives won by the lowest value */
export const lowestWins = [Objective.FewestClouds, Objective.FewestTiles, Objective.FewestZones]

/**
 * The final score of each player: for each terrain, the flowers times the animals of each of its zones, and 10 points
 * for each Objective they meet best (every tied player scores them).
 */
export class Scoring {
  readonly panoramas: Map<PlayerColor, PanoramaView>
  readonly objectives: Objective[]

  constructor(rules: MaterialRules<PlayerColor, MaterialType, LocationType> | MaterialRulesPart<PlayerColor, MaterialType, LocationType>) {
    this.panoramas = new Map(rules.game.players.map((player) => [player, PanoramaView.of(rules, player)]))
    this.objectives = rules.material(MaterialType.ObjectiveToken).getItems<Objective>().map((item) => item.id)
  }

  terrainScore(player: PlayerColor, terrain: Landscape) {
    return this.panoramas.get(player)!.terrainScore(terrain)
  }

  objectiveValue(player: PlayerColor, objective: Objective) {
    return objectiveValues[objective](this.panoramas.get(player)!)
  }

  private objectiveValues(objective: Objective) {
    return [...this.panoramas.keys()].map((other) => this.objectiveValue(other, objective))
  }

  private bestValue(objective: Objective) {
    const values = this.objectiveValues(objective)
    return lowestWins.includes(objective) ? Math.min(...values) : Math.max(...values)
  }

  objectiveScore(player: PlayerColor, objective: Objective) {
    return this.objectiveValue(player, objective) === this.bestValue(objective) ? objectivePoints : 0
  }

  /** Whether the player meets the Objective best, ahead of at least one other player (a tie between all is no lead) */
  leads(player: PlayerColor, objective: Objective) {
    const values = this.objectiveValues(objective)
    return this.objectiveValue(player, objective) === this.bestValue(objective) && values.some((value) => value !== values[0])
  }

  score(player: PlayerColor) {
    return (
      sumBy(terrains, (terrain) => this.terrainScore(player, terrain)) + sumBy(this.objectives, (objective) => this.objectiveScore(player, objective))
    )
  }
}
