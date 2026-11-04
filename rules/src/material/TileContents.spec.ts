import { describe, expect, it } from 'vitest'
import { Landscape } from './Landscape'
import { panoramaTileContents } from './TileContents'

const count = (key: 'animals' | 'flowers', landscape: Landscape) =>
  Object.values(panoramaTileContents).reduce((sum, content) => sum + content[key].filter((item) => item === landscape).length, 0)

describe('Tile contents', () => {
  it('match the Distribution box of the rulebook (last page)', () => {
    expect([Landscape.Mountain, Landscape.Forest, Landscape.Hills, Landscape.Fields].map((landscape) => count('animals', landscape))).toEqual([10, 12, 14, 16])
    expect([Landscape.Mountain, Landscape.Forest, Landscape.Hills, Landscape.Fields].map((landscape) => count('flowers', landscape))).toEqual([20, 17, 15, 14])
  })
})
