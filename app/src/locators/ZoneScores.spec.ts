import { LocationType } from '@gamepark/panorama/material/LocationType'
import { MaterialType } from '@gamepark/panorama/material/MaterialType'
import { PanoramaRules } from '@gamepark/panorama/PanoramaRules'
import { PlayerColor } from '@gamepark/panorama/PlayerColor'
import { MaterialGame } from '@gamepark/rules-api'
import { describe, expect, it } from 'vitest'
import { getZoneScores, outlineInset } from './ZoneScores'

/** A Panorama of the Starting Tile and the tile 21 on its right, level with it */
const rules = new PanoramaRules({
  players: [PlayerColor.Blue],
  items: {
    [MaterialType.StartingTile]: [{ id: PlayerColor.Blue, location: { type: LocationType.Panorama, player: PlayerColor.Blue, x: 0, y: 0 } }],
    [MaterialType.PanoramaTile]: [{ id: 21, location: { type: LocationType.Panorama, player: PlayerColor.Blue, x: 1, y: 0 } }]
  },
  memory: {}
} as MaterialGame<PlayerColor, MaterialType, LocationType>)

/** Whether a point is inside a polygon (even-odd rule) */
const inside = (point: { x: number; y: number }, polygon: { x: number; y: number }[]) =>
  polygon.reduce((result, a, index) => {
    const b = polygon[(index + 1) % polygon.length]
    const crosses = a.y > point.y !== b.y > point.y && point.x < ((b.x - a.x) * (point.y - a.y)) / (b.y - a.y) + a.x
    return crosses ? !result : result
  }, false)

describe('The scoring Zones drawn at the end of the game', () => {
  const zones = getZoneScores(rules, PlayerColor.Blue)

  it('are the Forest (1 Fox, 1 Flower) and the Fields (1 Crow, 1 Flower), worth 1 point each', () => {
    expect(zones.map((zone) => zone.score)).toEqual([1, 1])
  })

  it('are outlined by one closed loop each, over both tiles, with the score inside', () => {
    for (const zone of zones) {
      expect(zone.loops).toHaveLength(1)
      const xs = zone.loops[0].map((point) => point.x)
      // The Starting Tile is column 0, the tile 21 column 1: the outline crosses the edge between them
      expect(Math.min(...xs)).toBeLessThan(0)
      expect(Math.max(...xs)).toBeGreaterThan(1)
      expect(inside(zone.label, zone.loops[0])).toBe(true)
    }
  })

  it('keeps the outlines of the 2 Zones apart', () => {
    const [forest, fields] = zones.map((zone) => zone.loops[0])
    const gap = Math.min(...forest.flatMap((a) => fields.map((b) => Math.hypot(a.x - b.x, a.y - b.y))))
    expect(gap).toBeGreaterThan(outlineInset)
  })
})
