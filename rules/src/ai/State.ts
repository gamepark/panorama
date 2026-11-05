import { MaterialGame } from '@gamepark/rules-api'
import { LocationType } from '../material/LocationType'
import { MaterialType } from '../material/MaterialType'
import { Objective } from '../material/Objective'
import { panoramaTiles } from '../material/PanoramaTile'
import { PlayerColor } from '../PlayerColor'
import { RuleId } from '../rules/RuleId'
import { Panorama, Side } from './Model'

export type PanoramaGame = MaterialGame<PlayerColor, MaterialType, LocationType, RuleId>

/** A stack around the Centrepiece: how many tiles it holds, and its top tile if it is revealed */
export type StackState = { count: number; top?: number }

export type BalloonState = { stack: number; deflated: boolean }

/**
 * The table as the bot sees it: only what a player can see. The tiles under the top of the stacks are unknown, and
 * so are the tiles left in the box: both are among the `unseen` tiles.
 */
export type BotState = {
  players: PlayerColor[]
  panoramas: Map<PlayerColor, Panorama>
  stacks: StackState[]
  balloons: Map<PlayerColor, BalloonState>
  sun: { stack: number; moon: boolean }
  objectives: Objective[]
  unseen: number[]
  active?: PlayerColor
}

export const readState = (game: PanoramaGame): BotState => {
  const items = game.items
  const tiles = items[MaterialType.PanoramaTile] ?? []
  const panoramas = new Map<PlayerColor, Panorama>()
  for (const player of game.players) {
    const own = tiles.filter((item) => item.location.type === LocationType.Panorama && item.location.player === player)
    const columns = [{ id: 0, x: 0, y: 0 }, ...own.map((item) => ({ id: item.id as number, x: item.location.x!, y: item.location.y ?? 0 }))].sort(
      (a, b) => a.x - b.x
    )
    panoramas.set(
      player,
      new Panorama(
        columns.map((column) => column.id),
        columns.map((column) => column.y)
      )
    )
  }
  const balloonItems = items[MaterialType.HotAirBalloon] ?? []
  const stackCount = game.players.length + 4
  const stacks: StackState[] = Array.from({ length: stackCount }, () => ({ count: 0 }))
  const seen = new Set<number>()
  for (const item of tiles) {
    if (item.location.type === LocationType.Stack) {
      const stack = stacks[item.location.id as number]
      stack.count++
      if (item.location.rotation && item.id !== undefined) {
        stack.top = item.id as number
        seen.add(item.id as number)
      }
    } else if (item.id !== undefined) seen.add(item.id as number)
  }
  const balloons = new Map<PlayerColor, BalloonState>(
    balloonItems.map((item) => [item.id as PlayerColor, { stack: item.location.id as number, deflated: !!item.location.rotation }])
  )
  const sunItem = items[MaterialType.SunMoonToken]![0]
  return {
    players: game.players,
    panoramas,
    stacks,
    balloons,
    sun: { stack: sunItem.location.id as number, moon: !!sunItem.location.rotation },
    objectives: (items[MaterialType.ObjectiveToken] ?? []).map((item) => item.id as Objective),
    unseen: panoramaTiles.filter((tile) => !seen.has(tile)),
    active: game.rule?.player
  }
}

/** The stacks the player's balloon can fly to: with tiles, and no other balloon */
export const freeStacks = (state: BotState, player: PlayerColor): number[] => {
  const occupied = new Set<number>()
  for (const [owner, balloon] of state.balloons) if (owner !== player) occupied.add(balloon.stack)
  // A player's own balloon occupies its stack too: the rules only let it move to another one
  occupied.add(state.balloons.get(player)!.stack)
  const stacks: number[] = []
  state.stacks.forEach((stack, index) => {
    if (stack.count > 0 && !occupied.has(index)) stacks.push(index)
  })
  return stacks
}

export type Turn = { stack: number; side: Side; y: number }

/**
 * Who plays after the player took a tile from this stack, as PanoramaTurnRule.endTurn decides: the first balloon still
 * flying clockwise from the Sun. `emptied`: the stack is empty after the tile was taken.
 */
export const nextPlayer = (state: BotState, player: PlayerColor, stack: number, emptied: boolean): PlayerColor | undefined => {
  const moon = state.sun.moon || emptied
  const stacks = state.stacks.length
  for (let step = 1; step <= stacks; step++) {
    const position = (state.sun.stack + step) % stacks
    for (const [owner, balloon] of state.balloons) {
      if (balloon.deflated) continue
      if (owner === player) {
        if (!moon && stack === position) return owner
      } else if (balloon.stack === position) return owner
    }
  }
  return undefined
}

/**
 * Plays a turn on a copy of the state: `tile` is the tile taken, `revealed` the tile that turns up under it (unknown to
 * the bot: the simulation draws it).
 */
export const playTurn = (state: BotState, player: PlayerColor, turn: Turn, tile: number, revealed?: number): BotState => {
  const stacks = state.stacks.map((stack, index) => (index === turn.stack ? { count: stack.count - 1, top: revealed } : stack))
  const emptied = stacks[turn.stack].count === 0
  const next = nextPlayer(state, player, turn.stack, emptied)
  const moon = state.sun.moon || emptied
  const balloons = new Map(state.balloons)
  balloons.set(player, { stack: turn.stack, deflated: moon })
  const panoramas = new Map(state.panoramas)
  panoramas.set(player, state.panoramas.get(player)!.place(tile, turn.side, turn.y))
  return {
    ...state,
    panoramas,
    stacks,
    balloons,
    sun: { stack: next !== undefined ? balloons.get(next)!.stack : state.sun.stack, moon },
    unseen: revealed !== undefined ? state.unseen.filter((unseen) => unseen !== revealed) : state.unseen,
    active: next
  }
}
