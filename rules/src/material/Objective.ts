/** The 12 Objective tokens, in the order of the rulebook (pages 12 to 14) */
export enum Objective {
  FewestClouds = 1,
  MostCloudsOneSide,
  LargestSky,
  MostTilesOneSide,
  LongestRiver,
  MostAnimalsSameRiver,
  MostSeparateRivers,
  MostWaterfallsSameRiver,
  MostCrows,
  FewestTiles,
  MostZonesWithAnimal,
  FewestZones
}

/** The colour of the token, shown on its back: the game uses one Objective of each */
export enum ObjectiveCategory {
  Sky = 1,
  River,
  Terrain
}

export const getObjectiveCategory = (objective: Objective): ObjectiveCategory => {
  if (objective <= Objective.MostTilesOneSide) return ObjectiveCategory.Sky
  if (objective <= Objective.MostWaterfallsSameRiver) return ObjectiveCategory.River
  return ObjectiveCategory.Terrain
}
