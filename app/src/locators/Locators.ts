import { LocationType } from '@gamepark/panorama/material/LocationType'
import { MaterialType } from '@gamepark/panorama/material/MaterialType'
import { PlayerColor } from '@gamepark/panorama/PlayerColor'
import { Locator } from '@gamepark/react-game'
import { centrepieceLocator } from './CentrepieceLocator'
import { objectivesLocator } from './ObjectivesLocator'
import { panoramaLocator } from './PanoramaLocator'
import { stackLocator } from './StackLocator'
import { stackSpaceLocator } from './StackSpaceLocator'

export const Locators: Partial<Record<LocationType, Locator<PlayerColor, MaterialType, LocationType>>> = {
  [LocationType.Centrepiece]: centrepieceLocator,
  [LocationType.Stack]: stackLocator,
  [LocationType.StackSpace]: stackSpaceLocator,
  [LocationType.Panorama]: panoramaLocator,
  [LocationType.Objectives]: objectivesLocator
}
