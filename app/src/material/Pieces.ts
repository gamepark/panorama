import { LocationType } from '@gamepark/panorama/material/LocationType'
import { MaterialType } from '@gamepark/panorama/material/MaterialType'
import { PlayerColor } from '@gamepark/panorama/PlayerColor'
import { MaterialContext, MaterialSoundConfig, SoundBatch, SoundKit, TokenDescription } from '@gamepark/react-game'
import { isMoveItem, ItemMove, MaterialItem } from '@gamepark/rules-api'
import { hotAirBalloonImages, Moon3d, Sun3d } from '../images/Images'
import BalloonDeflate from '../sounds/BalloonDeflate.wav'
import { hotAirBalloonSize, sunMoonTokenSize } from '../locators/TableLayout'
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
 * The thick wooden Sun/Moon token: one disc, the Sun on one face and the Moon on the other, seen in 3/4 like the
 * balloons, its side under its face. The image carries its shadow. It is turned onto the Moon (rotation) when the game
 * end is triggered.
 */
export class SunMoonTokenDescription extends TokenDescription<PlayerColor, MaterialType, LocationType> {
  width = sunMoonTokenSize.width
  height = sunMoonTokenSize.height
  borderRadius = 0.3
  transparency = true
  image = Sun3d
  backImage = Moon3d
  soundKit = SoundKit.Wood
  help = SunMoonTokenHelp

  isFlipped(item: Partial<MaterialItem<PlayerColor, LocationType>>, _context: MaterialContext<PlayerColor, MaterialType, LocationType>) {
    return !!item.location?.rotation
  }
}
