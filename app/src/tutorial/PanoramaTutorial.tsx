import { css } from '@emotion/react'
import { LocationType } from '@gamepark/panorama/material/LocationType'
import { MaterialType } from '@gamepark/panorama/material/MaterialType'
import { Objective } from '@gamepark/panorama/material/Objective'
import { ObjectiveSet, objectiveSets } from '@gamepark/panorama/material/ObjectiveSet'
import { PanoramaOptions } from '@gamepark/panorama/PanoramaOptions'
import { PlayerColor } from '@gamepark/panorama/PlayerColor'
import { MaterialTutorial, Picture, TutorialStep } from '@gamepark/react-game'
import { isMoveItemType, MaterialGame, MaterialMove } from '@gamepark/rules-api'
import { Trans } from 'react-i18next'
import { objectiveImages } from '../images/Images'
import ForestZones from '../images/rules/ForestZones.webp'
import { tutorialComponents } from './TutorialIcons'
import { firstTilePlace, scriptedStacks, tutorialOpponent, tutorialPlayer, TutorialSetup } from './TutorialSetup'

type Game = MaterialGame<PlayerColor, MaterialType, LocationType>
type Move = MaterialMove<PlayerColor, MaterialType, LocationType>
type Step = TutorialStep<PlayerColor, MaterialType, LocationType>

/** One popup, written in the translation files like every other text of the game */
const text = (key: string) => () => <Trans i18nKey={`tutorial.${key}`} components={tutorialComponents} />

/** The 2 Forest Zones of the rulebook (page 6), and what each of them is worth */
const zonesText = () => (
  <>
    <Trans i18nKey="tutorial.zones" components={tutorialComponents} />
    <Picture src={ForestZones} css={illustration} />
    <Trans i18nKey="tutorial.zones-example" components={tutorialComponents} />
  </>
)

/** The 3 Objectives of a first game, each beside its token */
const objectivesText = () => (
  <>
    <Trans i18nKey="tutorial.objectives" components={tutorialComponents} />
    <ul css={objectiveList}>
      {objectiveSets[ObjectiveSet.FirstGame].map((objective: Objective) => (
        <li key={objective}>
          <Picture src={objectiveImages[objective]} css={objectiveIcon} />
          <span>
            <Trans i18nKey={`tutorial.objective.${objective}`} components={tutorialComponents} />
          </span>
        </li>
      ))}
    </ul>
    <em>
      <Trans i18nKey="tutorial.objectives-tie" components={tutorialComponents} />
    </em>
  </>
)

const illustration = css`
  display: block;
  width: 20em;
  max-width: 100%;
  margin: 0.5em auto;
  border-radius: 0.3em;
`

const objectiveList = css`
  margin: 0.4em 0;
  padding: 0;
  list-style: none;
  text-align: left;

  li {
    display: flex;
    align-items: center;
    gap: 0.5em;
  }

  li + li {
    margin-top: 0.3em;
  }
`

const objectiveIcon = css`
  height: 2.2em;
  width: auto;
`

// ------------------------------------------------------------------ how much table a focus keeps

/** Room on the left of the reader's Panorama, where the popup stands */
const panoramaOnTheRight = { top: 1, bottom: 1, left: 25, right: 2 }

// ------------------------------------------------------------------ what a step waits for

const movesBalloonTo = (stack: number) => (move: Move) =>
  isMoveItemType(MaterialType.HotAirBalloon)(move) && move.location.type === LocationType.StackSpace && move.location.id === stack

/** Right of the Starting Tile, level with it: always a legal place for the first tile of a Panorama */
const laysTileAt =
  ({ x, y }: { x: number; y: number }) =>
  (move: Move) =>
    isMoveItemType(MaterialType.PanoramaTile)(move) && move.location.type === LocationType.Panorama && move.location.x === x && move.location.y === y

/** The Sun leaving the space the reader's balloon has just left: held back until the popup has said where it goes */
const sunMoves = (move: MaterialMove) => isMoveItemType(MaterialType.SunMoonToken)(move)

/**
 * The tutorial of Panorama: the reader takes 2 tiles, and watches their opponent take one in between.
 *
 * The first tile is scripted (see TutorialSetup): the reader flies just past the red balloon, which shows how the Sun
 * hands the turn over, and lays a tile that carries on the River of the Starting Tile. The opponent then leaves an
 * empty stack between the 2 balloons, which shows how a player may play twice in a row. Once the Zones of Terrain and
 * the 3 Objectives of a first game are explained, the reader picks their second tile freely.
 */
export class PanoramaTutorial extends MaterialTutorial<PlayerColor, MaterialType, LocationType> {
  version = 1

  options: PanoramaOptions = { players: [{ id: tutorialPlayer }, { id: tutorialOpponent }], objectives: ObjectiveSet.FirstGame }

  setup = new TutorialSetup()

  /** The opponent is Melody, the author of the game */
  players = [
    { id: tutorialPlayer },
    {
      id: tutorialOpponent,
      name: 'Melody',
      avatar: {
        topType: 'ShortHairShaggyMullet',
        accessoriesType: 'Blank',
        hairColor: 'Brown',
        facialHairType: 'Blank',
        clotheType: 'ShirtCrewNeck',
        clotheColor: 'PastelGreen',
        eyeType: 'Happy',
        eyebrowType: 'DefaultNatural',
        mouthType: 'Smile',
        skinColor: 'Light'
      }
    }
  ]

  steps: Step[] = [
    { popup: { text: text('welcome') } },
    {
      popup: { text: text('panorama'), position: { x: -30 } },
      focus: (game) => ({ materials: [this.startingTile(game, tutorialPlayer)], margin: panoramaOnTheRight })
    },

    /** The first turn: the reader flies just past the red balloon */
    {
      popup: { text: text('move-balloon'), position: { x: 38, y: 22 } },
      focus: (game) => ({
        materials: [this.balloon(game, tutorialPlayer), this.topTile(game, scriptedStacks.first)],
        locations: [this.location(LocationType.StackSpace).id(scriptedStacks.first).location],
        margin: { top: 1, bottom: 0.5, left: 1, right: 1 }
      }),
      move: { filter: movesBalloonTo(scriptedStacks.first) }
    },
    {
      popup: { text: text('place-tile'), position: { y: 25 } },
      focus: (game) => ({
        materials: [this.topTile(game, scriptedStacks.first), ...this.panorama(game, tutorialPlayer)],
        margin: { top: 1, bottom: 1, left: 1, right: 4 }
      }),
      move: { filter: laysTileAt(firstTilePlace), interrupt: sunMoves }
    },
    {
      popup: { text: text('waves'), position: { x: -30 } },
      focus: (game) => ({ materials: this.panorama(game, tutorialPlayer), margin: panoramaOnTheRight })
    },
    {
      popup: { text: text('sun'), position: { x: 35 } },
      focus: (game) => ({
        materials: [this.sun(game), this.balloon(game, tutorialOpponent)],
        margin: { top: 2, bottom: 2, left: 2, right: 2 }
      }),
      move: {}
    },

    /** The opponent's turn: they leave an empty stack between the 2 balloons */
    { move: { player: tutorialOpponent, filter: movesBalloonTo(scriptedStacks.opponent) } },
    { move: { player: tutorialOpponent, filter: laysTileAt(firstTilePlace) } },
    {
      popup: { text: text('gap'), position: { x: 35 } },
      focus: (game) => ({
        materials: [this.balloon(game, tutorialPlayer), this.balloon(game, tutorialOpponent), this.sun(game), this.topTile(game, scriptedStacks.gap)],
        locations: [this.location(LocationType.StackSpace).id(scriptedStacks.gap).location],
        margin: { top: 2, bottom: 2, left: 2, right: 2 }
      })
    },

    /** How a Panorama scores: the Zones of Terrain, then the Objectives */
    {
      popup: { text: text('flowers'), position: { x: -30 } },
      focus: (game) => ({ materials: this.panorama(game, tutorialPlayer), margin: panoramaOnTheRight })
    },
    { popup: { text: zonesText } },
    {
      popup: { text: objectivesText, position: { x: 0, y: -10 } },
      focus: (game) => ({ materials: [this.objectives(game)], margin: { top: 1, bottom: 1, left: 1, right: 1 } })
    },
    {
      popup: { text: text('help'), position: { x: 0, y: -10 } },
      focus: (game) => ({ materials: [this.objectives(game)], margin: { top: 1, bottom: 1, left: 1, right: 1 } })
    },

    /** The second turn, the reader's own choice */
    {
      popup: { text: text('free-turn'), position: { x: 20, y: 20 } },
      focus: (game) => ({
        materials: [this.stacks(game), this.balloons(game), this.sun(game), ...this.panorama(game, tutorialPlayer)],
        margin: { top: 3, bottom: 10, left: 1, right: 1 }
      }),
      move: {}
    },
    /**
     * Free: the interface always plays the balloon, then the tile. A tile taken first is only a preview, and validating
     * it sends the move of the balloon followed by the move of the tile, so each of them ends a step.
     */
    { move: {} },
    { popup: { text: text('end') } }
  ]

  // ------------------------------------------------------------------ what the focuses point at

  private startingTile(game: Game, player: PlayerColor) {
    return this.material(game, MaterialType.StartingTile).id(player)
  }

  /** The Starting Tile and the Panorama Tiles laid beside it */
  private panorama(game: Game, player: PlayerColor) {
    return [this.startingTile(game, player), this.material(game, MaterialType.PanoramaTile).location(LocationType.Panorama).player(player)]
  }

  private balloon(game: Game, player: PlayerColor) {
    return this.material(game, MaterialType.HotAirBalloon).id(player)
  }

  /** Every stack, from its bottom tile to its space */
  private stacks(game: Game) {
    return this.material(game, MaterialType.PanoramaTile).location(LocationType.Stack)
  }

  private balloons(game: Game) {
    return this.material(game, MaterialType.HotAirBalloon)
  }

  private sun(game: Game) {
    return this.material(game, MaterialType.SunMoonToken)
  }

  private topTile(game: Game, stack: number) {
    return this.material(game, MaterialType.PanoramaTile)
      .location(LocationType.Stack)
      .locationId(stack)
      .maxBy((item) => item.location.x!)
  }

  private objectives(game: Game) {
    return this.material(game, MaterialType.ObjectiveToken)
  }
}
