import { LocationType } from '@gamepark/panorama/material/LocationType'
import { MaterialType } from '@gamepark/panorama/material/MaterialType'
import { PlayerColor } from '@gamepark/panorama/PlayerColor'
import { MaterialContext, MaterialSoundConfig, RoundTokenDescription, SoundBatch, SoundKit, TokenDescription } from '@gamepark/react-game'
import { isMoveItem, ItemMove, MaterialItem } from '@gamepark/rules-api'
import { hotAirBalloonImages, Moon, Sun } from '../images/Images'
import BalloonDeflate from '../sounds/BalloonDeflate.wav'
import { hotAirBalloonSize, sunMoonDiameter } from '../locators/TableLayout'
import { HotAirBalloonHelp, SunMoonTokenHelp } from './help/TurnHelps'

/** Air let out of a balloon, heard when a Hot-Air Balloon deflates: its flight is over, during the last turns */
const deflateSound = new MaterialSoundConfig(BalloonDeflate)
deflateSound.volume = 0.5

/** The wooden Hot-Air Balloons: the image carries its shadow */
export class HotAirBalloonDescription extends TokenDescription<PlayerColor, MaterialType, LocationType, PlayerColor> {
  width = hotAirBalloonSize.width
  height = hotAirBalloonSize.height
  borderRadius = 0.3
  transparency = true
  images = hotAirBalloonImages
  soundKit = SoundKit.Wood
  help = HotAirBalloonHelp

  getDefaultSounds(move: ItemMove, batch: SoundBatch) {
    if (isMoveItem(move) && move.location.rotation) return [deflateSound]
    return super.getDefaultSounds(move, batch)
  }

  getSounds() {
    return [...super.getSounds(), deflateSound]
  }
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
  help = SunMoonTokenHelp

  isFlipped(item: Partial<MaterialItem<PlayerColor, LocationType>>, _context: MaterialContext<PlayerColor, MaterialType, LocationType>) {
    return !!item.location?.rotation
  }
}
