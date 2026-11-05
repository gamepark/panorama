import { applyAutomaticMoves, isMoveItemType } from '@gamepark/rules-api'
import { MaterialType } from '../../material/MaterialType'
import { tileData } from '../Model'
import { closedRichness } from '../Evaluation'
import { PanoramaRules } from '../../PanoramaRules'
import { PanoramaSetup } from '../../PanoramaSetup'
import { ObjectiveSet } from '../../material/ObjectiveSet'
import { PlayerColor } from '../../PlayerColor'
import { Scoring } from '../../Scoring'
import { terrains } from '../../material/Landscape'
import { PanoramaMove } from '../Moves'
import { seededRandom, withSeed } from '../Random'
import { BotState, freeStacks, PanoramaGame, readState } from '../State'
import { getContender } from './Contenders'
import { assess, Assessment, defaultParams } from '../Evaluation'

/** One table of the arena: the deal of `seed`, the contenders of `lineup` seated from `rotation` on */
export type MatchTask = {
  seed: number
  rotation: number
  lineup: string[]
  objectives?: ObjectiveSet
  /** Records what the evaluation expects at every turn, to set it against what happened */
  calibrate?: boolean
}

export type SeatRecord = {
  contender: string
  score: number
  terrain: number
  objectives: number
  tiles: number
  rank: number
  /** Milliseconds spent choosing, in all */
  ms: number
  habits: TurnHabit[]
}

/**
 * How a turn was played: the free stacks the balloon flew over (stacks with tiles and no balloon between the stack it
 * left and the one it took from, clockwise), and the clouds of the tile taken.
 */
export type TurnHabit = { holes: number; clouds: number; cut: number }

const cutRichness = (state: BotState, player: PlayerColor, tile: number, x: number, y: number): number => {
  const before = state.panoramas.get(player)!
  return closedRichness(before, before.place(tile, x < 0 ? -1 : 1, y))
}

const turnHabit = (state: BotState, player: PlayerColor, taken: number, x: number, y: number): TurnHabit => {
  const stacks = state.stacks.length
  const from = state.balloons.get(player)!.stack
  const free = new Set(freeStacks(state, player))
  let holes = 0
  for (let step = 1; step < (taken - from + stacks) % stacks; step++) if (free.has((from + step) % stacks)) holes++
  return { holes, clouds: tileData[state.stacks[taken].top!].clouds, cut: cutRichness(state, player, state.stacks[taken].top!, x, y) }
}

export type GameRecord = MatchTask & { players: number; seats: SeatRecord[]; objectiveIds: number[]; turns: TurnRecord[]; outcomes?: boolean[][]; values?: number[][]; error?: string }

/** For calibration: the stacks at every turn, and how many tiles each player still had to lay from there */
export type TurnRecord = { player: number; stacks: number[]; moon: boolean; laidAfter?: number[]; assessments?: Assessment[] }

export const playMatch = (task: MatchTask): GameRecord => {
  const players = task.lineup.length
  const game = withSeed(task.seed, () =>
    new PanoramaSetup().setup({ players: Array.from({ length: players }, (_, index) => ({ id: index + 1 })), objectives: task.objectives })
  ) as PanoramaGame
  const seatOf = (player: PlayerColor) => task.lineup[(player - 1 + task.rotation) % players]
  const random = seededRandom(task.seed * 31 + task.rotation)
  const ms = new Map<PlayerColor, number>()
  const turns: TurnRecord[] = []
  const laid: number[] = []
  const habits = new Map<PlayerColor, TurnHabit[]>(game.players.map((player) => [player, []]))
  let error: string | undefined
  try {
    let guard = 0
    while (game.rule && guard++ < 500) {
      const rules = new PanoramaRules(game)
      const player = rules.getActivePlayer()!
      const state = readState(game)
      turns.push({
        player,
        stacks: state.stacks.map((stack) => stack.count),
        moon: state.sun.moon,
        assessments: task.calibrate ? [...assess(state, defaultParams).values()] : undefined
      })
      laid.push(player)
      const start = Date.now()
      const move: PanoramaMove | undefined = getContender(seatOf(player))(game, player, random)
      ms.set(player, (ms.get(player) ?? 0) + Date.now() - start)
      if (!move) throw new Error(`No move for ${seatOf(player)}`)
      if (isMoveItemType(MaterialType.PanoramaTile)(move)) {
        habits.get(player)!.push(turnHabit(state, player, rules.material(MaterialType.PanoramaTile).getItem(move.itemIndex).location.id as number, move.location.x!, move.location.y ?? 0))
      }
      applyAutomaticMoves(rules, [move])
    }
  } catch (e) {
    error = String((e as Error).stack ?? e)
  }
  turns.forEach((turn, index) => {
    turn.laidAfter = game.players.map((player) => laid.slice(index).filter((other) => other === player).length)
  })
  const rules = new PanoramaRules(game)
  const scoring = new Scoring(rules)
  const scores = game.players.map((player) => scoring.score(player))
  const seats: SeatRecord[] = game.players.map((player, index) => {
    const terrain = terrains.reduce((sum, terrain) => sum + scoring.terrainScore(player, terrain), 0)
    return {
      contender: seatOf(player),
      score: scores[index],
      terrain,
      objectives: scores[index] - terrain,
      tiles: scoring.panoramas.get(player)!.tiles.length - 1,
      rank: 1 + scores.filter((score) => score > scores[index]).length,
      ms: ms.get(player) ?? 0,
      habits: habits.get(player)!
    }
  })
  const outcomes = game.players.map((player) => scoring.objectives.map((objective) => scoring.objectiveScore(player, objective) > 0))
  const values = game.players.map((player) => scoring.objectives.map((objective) => scoring.objectiveValue(player, objective)))
  return { ...task, players, seats, objectiveIds: scoring.objectives, turns, outcomes, values, error }
}
