import { Objective } from './Objective'

/**
 * How the 3 Objectives of the game are chosen (rulebook pages 2 and 15): one of each colour at random, the 3 starred
 * Objectives for a first game, or the 3 Objectives of a Scenario (named as in the English rulebook).
 */
export enum ObjectiveSet {
  Random = 1,
  FirstGame,
  AnimalFestival,
  RiverLover,
  LongWayHome,
  GreatView,
  RiversideRoam,
  LessIsMore
}

/** The Objectives of each set but the random one */
export const objectiveSets: Record<Exclude<ObjectiveSet, ObjectiveSet.Random>, Objective[]> = {
  [ObjectiveSet.FirstGame]: [Objective.FewestClouds, Objective.LongestRiver, Objective.MostCrows],
  [ObjectiveSet.AnimalFestival]: [Objective.MostAnimalsSameRiver, Objective.MostCrows, Objective.MostZonesWithAnimal],
  [ObjectiveSet.RiverLover]: [Objective.LongestRiver, Objective.MostAnimalsSameRiver, Objective.MostWaterfallsSameRiver],
  [ObjectiveSet.LongWayHome]: [Objective.FewestClouds, Objective.MostTilesOneSide, Objective.MostSeparateRivers],
  [ObjectiveSet.GreatView]: [Objective.MostTilesOneSide, Objective.LongestRiver, Objective.FewestZones],
  [ObjectiveSet.RiversideRoam]: [Objective.LargestSky, Objective.MostWaterfallsSameRiver, Objective.FewestTiles],
  [ObjectiveSet.LessIsMore]: [Objective.FewestClouds, Objective.FewestTiles, Objective.FewestZones]
}
