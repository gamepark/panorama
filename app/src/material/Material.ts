import { MaterialType } from '@gamepark/panorama/material/MaterialType'
import { MaterialDescription } from '@gamepark/react-game'
import { HotAirBalloonDescription, SunMoonTokenDescription } from './Pieces'
import { PanoramaTileDescription } from './PanoramaTileDescription'
import { CentrepieceDescription, ObjectiveTokenDescription, StartingTileDescription } from './Tiles'

export const Material: Partial<Record<MaterialType, MaterialDescription>> = {
  [MaterialType.Centrepiece]: new CentrepieceDescription(),
  [MaterialType.PanoramaTile]: new PanoramaTileDescription(),
  [MaterialType.StartingTile]: new StartingTileDescription(),
  [MaterialType.HotAirBalloon]: new HotAirBalloonDescription(),
  [MaterialType.SunMoonToken]: new SunMoonTokenDescription(),
  [MaterialType.ObjectiveToken]: new ObjectiveTokenDescription()
}
