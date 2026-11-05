import { Landscape } from '../material/Landscape'
import { Objective } from '../material/Objective'
import { lowestWins } from '../Scoring'
import { Analysis, Panorama } from './Model'

/** How well a Panorama meets an Objective, as Scoring counts it, read on the bot's model */
export const objectiveValue = (objective: Objective, panorama: Panorama, analysis: Analysis = panorama.analysis): number => {
  switch (objective) {
    case Objective.FewestClouds:
      return analysis.totalClouds
    case Objective.MostCloudsOneSide:
      return Math.max(analysis.clouds[0], analysis.clouds[1])
    case Objective.LargestSky:
      return maxOf(analysis.zones.filter((zone) => zone.landscape === Landscape.Sky).map((zone) => zone.tiles))
    case Objective.MostTilesOneSide:
      return Math.max(analysis.sideTiles[0], analysis.sideTiles[1])
    case Objective.LongestRiver:
      return maxOf(analysis.rivers.map((river) => river.tiles))
    case Objective.MostAnimalsSameRiver:
      return maxOf(analysis.rivers.map((river) => river.animals))
    case Objective.MostSeparateRivers:
      return analysis.rivers.filter((river) => river.tiles >= 2).length
    case Objective.MostWaterfallsSameRiver:
      return maxOf(analysis.rivers.map((river) => river.waterfalls))
    case Objective.MostCrows:
      return analysis.crows
    case Objective.FewestTiles:
      return panorama.size - 1
    case Objective.MostZonesWithAnimal:
      return analysis.zones.filter((zone) => zone.landscape !== Landscape.Sky && zone.animals > 0).length
    case Objective.FewestZones:
      return analysis.zones.filter((zone) => zone.landscape !== Landscape.Sky).length
  }
}

const maxOf = (values: number[]) => {
  let max = 0
  for (const value of values) if (value > max) max = value
  return max
}

export const isLowestWins = (objective: Objective) => lowestWins.includes(objective)
