import { RuleId } from '../rules/RuleId'
import { PlayerColor } from '../PlayerColor'
import { closedRichness, defaultParams, evaluate, Params, Pool, readPool } from './Evaluation'
import { PanoramaMove, turnMoves } from './Moves'
import { Random, seededRandom } from './Random'
import { BotState, freeStacks, PanoramaGame, playTurn, readState, Turn } from './State'

export { defaultParams }
export type { Params }

/**
 * `candidates`: how many of the most promising turns are played further. `samples`: how many times each of them is
 * played further, the hidden tiles drawn again each time.
 */
export type SearchSettings = { candidates: number; samples: number; depth: number }

export const defaultSearch: SearchSettings = { candidates: 5, samples: 4, depth: 1 }

/**
 * An automatic player for Panorama.
 *
 * Every turn the player can play is first weighed as it stands by {@link evaluate}, which forecasts the final score of
 * each player: their terrains, what the zones still open at the ends of their Panorama can still bring, and their
 * chances to meet each Objective best. The most promising turns are then played further on copies of the table: the
 * tile revealed under the one taken is drawn among the tiles nobody has seen, the opponents play what the same
 * evaluation advises them, until the bot's next turn, whose best move is the worth of the line.
 */
export const PanoramaAI = async (game: PanoramaGame, player: PlayerColor): Promise<PanoramaMove[]> => {
  const turn = chooseTurn(game, player)
  return turn ? turnMoves(game, player, turn) : []
}

export const chooseTurn = (game: PanoramaGame, player: PlayerColor, params: Params = defaultParams, search: SearchSettings = defaultSearch): Turn | undefined => {
  const state = readState(game)
  const pool = readPool(state)
  const placeOnly = game.rule?.id === RuleId.PlaceTile ? state.balloons.get(player)!.stack : undefined
  const ranked = rankTurns(state, player, params, pool, placeOnly)
  if (ranked.length <= 1 || !search.candidates || !search.samples) return ranked[0]?.turn
  const random = seededRandom(hashState(state))
  let best = ranked[0]
  let bestValue = -Infinity
  for (const candidate of ranked.slice(0, search.candidates)) {
    let total = 0
    for (let sample = 0; sample < search.samples; sample++) total += playOut(state, player, candidate.turn, params, pool, random, search.depth)
    // The play-out ends with the bot's next turn: what this turn closes for good is still to be paid
    const value = total / search.samples - cutCost(state, player, candidate.turn, params)
    if (value > bestValue) {
      bestValue = value
      best = candidate
    }
  }
  return best.turn
}

type RankedTurn = { turn: Turn; value: number }

/** The turns a player can play on the table, best first as they stand */
const rankTurns = (state: BotState, player: PlayerColor, params: Params, pool: Pool, placeOnly?: number): RankedTurn[] => {
  const ranked: RankedTurn[] = []
  for (const turn of stateTurns(state, player, placeOnly)) {
    ranked.push({ turn, value: weigh(state, player, turn, params, pool) })
  }
  return ranked.sort((a, b) => b.value - a.value)
}

const bestTurn = (state: BotState, player: PlayerColor, params: Params, pool: Pool): RankedTurn | undefined => {
  let best: RankedTurn | undefined
  for (const turn of stateTurns(state, player)) {
    const value = weigh(state, player, turn, params, pool)
    if (!best || value > best.value) best = { turn, value }
  }
  return best
}

/** A turn as it stands: the position it leads to, less what closing a promising zone gives up */
const weigh = (state: BotState, player: PlayerColor, turn: Turn, params: Params, pool: Pool): number => {
  return evaluate(playTurn(state, player, turn, state.stacks[turn.stack].top!), player, params, pool) - cutCost(state, player, turn, params)
}

const cutCost = (state: BotState, player: PlayerColor, turn: Turn, params: Params): number => {
  if (!params.cut) return 0
  const before = state.panoramas.get(player)!
  return params.cut * closedRichness(before, before.place(state.stacks[turn.stack].top!, turn.side, turn.y))
}

const stateTurns = (state: BotState, player: PlayerColor, placeOnly?: number): Turn[] => {
  const stacks = placeOnly !== undefined ? [placeOnly] : freeStacks(state, player)
  const panorama = state.panoramas.get(player)!
  const turns: Turn[] = []
  for (const stack of stacks) {
    if (state.stacks[stack].top === undefined) continue
    for (const side of [-1, 1] as const) for (const y of panorama.offsets(side)) turns.push({ stack, side, y })
  }
  return turns
}

/**
 * Plays the turn, then the turns of the opponents as the evaluation advises them, up to the bot's next turn: the worth
 * of the line is the best the bot can then do, or the position as it stands once the game is over.
 */
const playOut = (state: BotState, player: PlayerColor, turn: Turn, params: Params, pool: Pool, random: Random, depth: number): number => {
  let current = play(state, player, turn, random)
  for (let guard = 0; current.active !== undefined && current.active !== player && guard < 8; guard++) {
    const opponent = current.active
    const reply = bestTurn(current, opponent, params, pool)
    if (!reply) break
    current = play(current, opponent, reply.turn, random)
  }
  if (current.active === player) {
    const next = bestTurn(current, player, params, pool)
    if (next) return depth > 1 ? playOut(current, player, next.turn, params, pool, random, depth - 1) : next.value
  }
  return evaluate(current, player, params, pool)
}

/** Plays a turn, the tile revealed under the one taken drawn among the tiles nobody has seen */
const play = (state: BotState, player: PlayerColor, turn: Turn, random: Random): BotState => {
  const stack = state.stacks[turn.stack]
  const revealed = stack.count > 1 && state.unseen.length ? state.unseen[Math.floor(random() * state.unseen.length)] : undefined
  return playTurn(state, player, turn, stack.top!, revealed)
}

/** The same position always gets the same draws, so that the bot always plays the same move there */
const hashState = (state: BotState): number => {
  let hash = 17
  for (const panorama of state.panoramas.values()) for (const id of panorama.ids) hash = (hash * 31 + id) >>> 0
  for (const stack of state.stacks) hash = (hash * 31 + stack.count * 64 + (stack.top ?? 0)) >>> 0
  return hash
}
