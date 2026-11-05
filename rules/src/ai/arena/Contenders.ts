import { PanoramaRules } from '../../PanoramaRules'
import { PlayerColor } from '../../PlayerColor'
import { candidateTurns, PanoramaMove, turnMove } from '../Moves'
import { objectiveValue, isLowestWins } from '../Objectives'
import { Random } from '../Random'
import { PanoramaGame, playTurn, readState, Turn } from '../State'
import { Landscape } from '../../material/Landscape'
import { chooseTurn, defaultParams, defaultSearch, Params, SearchSettings } from '../PanoramaAI'

export type Contender = (game: PanoramaGame, player: PlayerColor, random: Random) => PanoramaMove | undefined

const randomMove: Contender = (game, player, random) => {
  const legal = new PanoramaRules(game).getLegalMoves(player)
  return legal[Math.floor(random() * legal.length)]
}

/** Lays the tile that scores the most right now, Objectives counted as they stand (10 points to the best) */
const greedy: Contender = (game, player) => {
  const state = readState(game)
  let best: { value: number; turn?: (typeof turns)[number] } = { value: -Infinity }
  const turns = candidateTurns(game, state, player)
  for (const turn of turns) {
    const panorama = state.panoramas.get(player)!.place(state.stacks[turn.stack].top!, turn.side, turn.y)
    let value = panorama.analysis.terrainScore
    for (const objective of state.objectives) {
      const mine = objectiveValue(objective, panorama)
      const others = state.players.filter((other) => other !== player).map((other) => objectiveValue(objective, state.panoramas.get(other)!))
      const best = isLowestWins(objective) ? mine <= Math.min(...others) : mine >= Math.max(...others)
      if (best) value += 10
    }
    if (value > best.value) best = { value, turn }
  }
  return best.turn && turnMove(game, player, best.turn)
}

/**
 * A player following the advice of a strong human: score the terrains, never cut a promising zone, keep the richest
 * ones open on one side and better on both, take the Objectives one leads, keep the hand when it is cheap.
 */
const expert: Contender = (game, player) => {
  const state = readState(game)
  let best: { value: number; turn?: Turn } = { value: -Infinity }
  for (const turn of candidateTurns(game, state, player)) {
    const next = playTurn(state, player, turn, state.stacks[turn.stack].top!)
    const panorama = next.panoramas.get(player)!
    let value = panorama.analysis.terrainScore
    for (const zone of panorama.analysis.zones) {
      if (zone.landscape === Landscape.Sky || !(zone.openLeft || zone.openRight)) continue
      value += 0.5 * (zone.flowers * zone.animals + zone.flowers + zone.animals) * (zone.openLeft && zone.openRight ? 1.5 : 1)
    }
    for (const objective of state.objectives) {
      const mine = objectiveValue(objective, panorama)
      const others = state.players.filter((other) => other !== player).map((other) => objectiveValue(objective, state.panoramas.get(other)!))
      if (isLowestWins(objective) ? mine <= Math.min(...others) : mine >= Math.max(...others)) value += 4
    }
    if (next.active === player) value += 2
    if (value > best.value) best = { value, turn }
  }
  return best.turn && turnMove(game, player, best.turn)
}

const bot =
  (settings: Partial<Params & SearchSettings> = {}): Contender =>
  (game, player) => {
    const turn = chooseTurn(game, player, { ...defaultParams, ...settings }, { ...defaultSearch, ...settings })
    return turn && turnMove(game, player, turn)
  }

/**
 * To measure a change of the bot, copy the files of src/ai (but the arena) into a folder of the arena first, import its
 * chooseTurn here as another contender, and play the bot against it.
 */
const named: Record<string, Contender> = {
  random: randomMove,
  greedy,
  expert,
  bot: bot()
}

/**
 * A contender by name: one of the named ones, or the bot with some of its weights changed, as in
 * `bot:opponents=0.3;tempo=1`.
 */
export const getContender = (name: string): Contender => {
  if (named[name]) return named[name]
  const [base, settings] = name.split(':')
  if (base !== 'bot' || !settings) throw new Error(`Unknown contender ${name}`)
  const params = Object.fromEntries(settings.split(';').map((setting) => setting.split('=')).map(([key, value]) => [key, Number(value)]))
  for (const key of Object.keys(params)) if (!(key in defaultParams) && !(key in defaultSearch)) throw new Error(`Unknown setting ${key}`)
  return (named[name] = bot(params))
}
