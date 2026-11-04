import { LocationType } from '@gamepark/panorama/material/LocationType'
import { MaterialType } from '@gamepark/panorama/material/MaterialType'
import { PlayerColor } from '@gamepark/panorama/PlayerColor'
import { MaterialContext, RoundTokenDescription, SoundKit, TokenDescription } from '@gamepark/react-game'
import { MaterialItem } from '@gamepark/rules-api'
import { hotAirBalloonImages, Moon, Sun } from '../images/Images'
import { hotAirBalloonSize, sunMoonDiameter } from '../locators/TableLayout'

/** The wooden Hot-Air Balloons: the image carries its shadow */
export class HotAirBalloonDescription extends TokenDescription<PlayerColor, MaterialType, LocationType, PlayerColor> {
  width = hotAirBalloonSize.width
  height = hotAirBalloonSize.height
  borderRadius = 0.3
  transparency = true
  images = hotAirBalloonImages
  soundKit = SoundKit.Wood
}

/**
 * The wooden Sun/Moon token: one disc, the Sun on one face and the Moon on the other. Its shadow is drawn in CSS and
 * follows the border radius. It is turned onto the Moon (rotation) when the game end is triggered.
 */
export class SunMoonTokenDescription extends RoundTokenDescription<PlayerColor, MaterialType, LocationType> {
  diameter = sunMoonDiameter
  image = Sun
  backImage = Moon
  soundKit = SoundKit.Wood

  isFlipped(item: Partial<MaterialItem<PlayerColor, LocationType>>, _context: MaterialContext<PlayerColor, MaterialType, LocationType>) {
    return !!item.location?.rotation
  }
}
