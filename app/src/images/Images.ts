import { Landscape } from '@gamepark/panorama/material/Landscape'
import { Objective } from '@gamepark/panorama/material/Objective'
import { PlayerColor } from '@gamepark/panorama/PlayerColor'
import Centrepiece2 from './centrepieces/Centrepiece2.webp'
import Centrepiece3 from './centrepieces/Centrepiece3.webp'
import Centrepiece4 from './centrepieces/Centrepiece4.webp'
import Bear from './icons/Bear.webp'
import Crow from './icons/Crow.webp'
import FieldsFlower from './icons/FieldsFlower.webp'
import ForestFlower from './icons/ForestFlower.webp'
import Fox from './icons/Fox.webp'
import HillsFlower from './icons/HillsFlower.webp'
import MountainFlower from './icons/MountainFlower.webp'
import Sheep from './icons/Sheep.webp'
import FewestClouds from './objectives/FewestClouds.webp'
import FewestTiles from './objectives/FewestTiles.webp'
import FewestZones from './objectives/FewestZones.webp'
import LargestSky from './objectives/LargestSky.webp'
import LongestRiver from './objectives/LongestRiver.webp'
import MostAnimalsSameRiver from './objectives/MostAnimalsSameRiver.webp'
import MostCloudsOneSide from './objectives/MostCloudsOneSide.webp'
import MostCrows from './objectives/MostCrows.webp'
import MostSeparateRivers from './objectives/MostSeparateRivers.webp'
import MostTilesOneSide from './objectives/MostTilesOneSide.webp'
import MostWaterfallsSameRiver from './objectives/MostWaterfallsSameRiver.webp'
import MostZonesWithAnimal from './objectives/MostZonesWithAnimal.webp'
import BalloonBlue from './pawns/BalloonBlue.webp'
import BalloonGreen from './pawns/BalloonGreen.webp'
import BalloonRed from './pawns/BalloonRed.webp'
import BalloonYellow from './pawns/BalloonYellow.webp'
import StartTileBlue from './start-tiles/StartTileBlue.webp'
import StartTileGreen from './start-tiles/StartTileGreen.webp'
import StartTileRed from './start-tiles/StartTileRed.webp'
import StartTileYellow from './start-tiles/StartTileYellow.webp'
import TileBack from './tiles/TileBack.webp'
import Moon from './tokens/Moon.webp'
import Sun from './tokens/Sun.webp'

const tileImageFiles = import.meta.glob<string>('./tiles/Tile*.webp', { eager: true, import: 'default' })

/** The front of each Panorama Tile, by its number */
export const panoramaTileImages: Record<number, string> = Object.fromEntries(
  Object.entries(tileImageFiles)
    .map(([file, image]) => [Number(/Tile(\d+)\.webp$/.exec(file)?.[1]), image] as const)
    .filter(([id]) => !isNaN(id))
)

export { Moon, Sun, TileBack }

export const centrepieceImages: Record<number, string> = { 2: Centrepiece2, 3: Centrepiece3, 4: Centrepiece4 }

export const startingTileImages: Record<PlayerColor, string> = {
  [PlayerColor.Blue]: StartTileBlue,
  [PlayerColor.Red]: StartTileRed,
  [PlayerColor.Green]: StartTileGreen,
  [PlayerColor.Yellow]: StartTileYellow
}

export const hotAirBalloonImages: Record<PlayerColor, string> = {
  [PlayerColor.Blue]: BalloonBlue,
  [PlayerColor.Red]: BalloonRed,
  [PlayerColor.Green]: BalloonGreen,
  [PlayerColor.Yellow]: BalloonYellow
}

export const objectiveImages: Record<Objective, string> = {
  [Objective.FewestClouds]: FewestClouds,
  [Objective.MostCloudsOneSide]: MostCloudsOneSide,
  [Objective.LargestSky]: LargestSky,
  [Objective.MostTilesOneSide]: MostTilesOneSide,
  [Objective.LongestRiver]: LongestRiver,
  [Objective.MostAnimalsSameRiver]: MostAnimalsSameRiver,
  [Objective.MostSeparateRivers]: MostSeparateRivers,
  [Objective.MostWaterfallsSameRiver]: MostWaterfallsSameRiver,
  [Objective.MostCrows]: MostCrows,
  [Objective.FewestTiles]: FewestTiles,
  [Objective.MostZonesWithAnimal]: MostZonesWithAnimal,
  [Objective.FewestZones]: FewestZones
}

/** The animal and the flower of each terrain (the Distribution box of the rulebook) */
export const animalImages: Partial<Record<Landscape, string>> = {
  [Landscape.Mountain]: Bear,
  [Landscape.Forest]: Fox,
  [Landscape.Hills]: Sheep,
  [Landscape.Fields]: Crow
}

export const flowerImages: Partial<Record<Landscape, string>> = {
  [Landscape.Mountain]: MountainFlower,
  [Landscape.Forest]: ForestFlower,
  [Landscape.Hills]: HillsFlower,
  [Landscape.Fields]: FieldsFlower
}
