import { describe, expect, it } from 'vitest'
import { Landscape } from './material/Landscape'
import { Objective } from './material/Objective'
import { PanoramaView } from './material/PanoramaView'
import { panoramaTileContents, startingTileContent } from './material/TileContents'
import { PlayerColor } from './PlayerColor'
import { objectiveValues, Scoring } from './Scoring'

/** A Panorama: the Starting Tile in column 0, and the given tiles by number, column and offset */
const panorama = (...tiles: [number, number, number][]) =>
  new PanoramaView([
    { content: startingTileContent, x: 0, y: 0 },
    ...tiles.map(([number, x, y]) => ({ content: panoramaTileContents[number], x, y }))
  ])

describe('Panorama', () => {
  it('has one zone per landscape, and one river, with the Starting Tile alone', () => {
    const view = panorama()
    expect(view.terrainZones).toHaveLength(4)
    expect(view.terrainZones.every((zone) => zone.flowers === 1 && zone.animals === 0)).toBe(true)
    expect(view.rivers).toEqual([{ tiles: 1, waterfalls: 1, animals: 0 }])
  })

  it('joins the areas of the same landscape level with each other', () => {
    // Tile 10 on the right: its mountain (row 1, a bear) meets the mountain of the Starting Tile, and so do its hills
    // (row 4, a sheep) and its fields (row 5). Rows 2 and 3 meet the forest of the Starting Tile.
    const view = panorama([10, 1, 0])
    expect(view.terrainScore(Landscape.Mountain)).toBe(1)
    expect(view.terrainScore(Landscape.Hills)).toBe(1)
    expect(view.terrainScore(Landscape.Fields)).toBe(0)
    expect(view.terrainZones).toHaveLength(4)
    expect(view.zones.find((zone) => zone.landscape === Landscape.Sky)!.tiles).toBe(2)
    // The river of the Starting Tile leaves at boundary 4, the one of tile 10 comes in at boundary 3
    expect(view.rivers).toHaveLength(2)
  })

  it('separates the areas that do not meet', () => {
    // One wave lower, the mountain of tile 10 (rows 2 and 3) faces the forest of the Starting Tile
    const view = panorama([10, 1, 1])
    expect(view.terrainZones.filter((zone) => zone.landscape === Landscape.Mountain)).toHaveLength(2)
    expect(view.terrainScore(Landscape.Mountain)).toBe(0)
  })

  it('joins the rivers that reach the shared edge at the same height', () => {
    // One wave lower, the river of tile 10 comes in at boundary 3 + 1, where the one of the Starting Tile leaves
    const view = panorama([10, 1, 1])
    expect(view.rivers).toEqual([{ tiles: 2, waterfalls: 2, animals: 2 }])
  })

  it('measures the Objectives', () => {
    const view = panorama([10, 1, 1], [5, -1, 0], [36, 2, 0])
    expect(objectiveValues[Objective.FewestTiles](view)).toBe(3)
    expect(objectiveValues[Objective.MostTilesOneSide](view)).toBe(2)
    // Clouds: tile 5 has 1 on the left; tiles 10 and 36 have 0 and 2 on the right
    expect(objectiveValues[Objective.FewestClouds](view)).toBe(3)
    expect(objectiveValues[Objective.MostCloudsOneSide](view)).toBe(2)
    // Crows: tiles 5 and 36 have one each
    expect(objectiveValues[Objective.MostCrows](view)).toBe(2)
  })
})

/** A Scoring of the given Panoramas, without the rules that build it */
const scoring = (...panoramas: PanoramaView[]): Scoring =>
  Object.assign(Object.create(Scoring.prototype), {
    panoramas: new Map(panoramas.map((view, index) => [(index + 1) as PlayerColor, view])),
    objectives: [Objective.FewestTiles, Objective.MostTilesOneSide]
  })

describe('Lead on an Objective', () => {
  it('goes to no one while all the players are tied', () => {
    const tied = scoring(panorama(), panorama())
    expect(tied.leads(PlayerColor.Blue, Objective.FewestTiles)).toBe(false)
    expect(tied.leads(PlayerColor.Red, Objective.MostTilesOneSide)).toBe(false)
  })

  it('goes to the best player, the lowest value when fewest wins', () => {
    const game = scoring(panorama(), panorama([10, 1, 1]), panorama([5, -1, 0]))
    expect(game.leads(PlayerColor.Blue, Objective.FewestTiles)).toBe(true)
    expect(game.leads(PlayerColor.Red, Objective.FewestTiles)).toBe(false)
    expect(game.leads(PlayerColor.Blue, Objective.MostTilesOneSide)).toBe(false)
    expect(game.leads(PlayerColor.Red, Objective.MostTilesOneSide)).toBe(true)
    expect(game.leads(PlayerColor.Green, Objective.MostTilesOneSide)).toBe(true)
  })
})
