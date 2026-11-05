/**
 * The arena: the automatic players of Panorama against each other, on tables dealt from seeds.
 *
 *   yarn arena --lineup bot,greedy --seeds 200
 *   yarn arena --lineup bot,bot,greedy --seeds 100 --objectives 2
 *
 * --lineup      contenders by name (see src/ai/arena/Contenders.ts), one per seat. Every table is played once per
 *               rotation of the seats, so that each contender sits on each seat of the same deal.
 * --seeds       how many tables (100 by default), dealt from --first (1 by default) onward
 * --objectives  an ObjectiveSet (random by default)
 * --workers     processes playing in parallel (one per core but one by default)
 * --out         where the records go (none by default)
 * --calibrate   records what the evaluation expects at every turn, to set it against the outcome
 *
 * The TypeScript of the rules is loaded through Vite, so nothing has to be built first.
 */
import { fork } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { availableParallelism } from 'node:os'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'
import { runnerImport } from 'vite'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

const { values } = parseArgs({
  options: {
    worker: { type: 'boolean' },
    lineup: { type: 'string', default: 'bot,greedy' },
    seeds: { type: 'string', default: '100' },
    first: { type: 'string', default: '1' },
    objectives: { type: 'string' },
    workers: { type: 'string', default: String(Math.max(1, availableParallelism() - 1)) },
    out: { type: 'string' },
    calibrate: { type: 'boolean' }
  },
  strict: true
})

if (values.worker) {
  const { playMatch } = (
    await runnerImport(resolve(root, 'src/ai/arena/Match.ts'), {
      root,
      configFile: false,
      logLevel: 'error',
      environments: { inline: { resolve: { noExternal: ['@gamepark/rules-api', 'es-toolkit'] } } }
    })
  ).module
  process.on('message', (task) => {
    if (task === 'stop') process.exit(0)
    process.send(playMatch(task))
  })
  process.send('ready')
} else {
  const lineup = values.lineup.split(',')
  const objectives = values.objectives ? Number(values.objectives) : undefined
  const tasks = []
  for (let seed = Number(values.first); seed < Number(values.first) + Number(values.seeds); seed++) {
    for (let rotation = 0; rotation < lineup.length; rotation++) tasks.push({ seed, rotation, lineup, objectives, calibrate: values.calibrate })
  }
  const started = Date.now()
  const records = []
  const workers = Math.min(Number(values.workers), tasks.length)
  let next = 0
  await Promise.all(
    Array.from(
      { length: workers },
      () =>
        new Promise((done, fail) => {
          const child = fork(fileURLToPath(import.meta.url), ['--worker'], { stdio: ['ignore', 'inherit', 'inherit', 'ipc'] })
          const give = () => {
            if (next >= tasks.length) {
              child.send('stop')
              return done()
            }
            child.send(tasks[next++])
          }
          child.on('message', (message) => {
            if (message !== 'ready') {
              records.push(message)
              if (records.length % 50 === 0) process.stderr.write(`${records.length}/${tasks.length}\r`)
            }
            give()
          })
          child.on('error', fail)
        })
    )
  )
  const errors = records.filter((record) => record.error)
  if (errors.length) console.log(`${errors.length} games failed, the first one:\n${errors[0].error}`)
  const stats = new Map()
  for (const record of records) {
    const best = Math.max(...record.seats.map((seat) => seat.score))
    const winners = record.seats.filter((seat) => seat.score === best).length
    for (const seat of record.seats) {
      const stat = stats.get(seat.contender) ?? { seats: 0, wins: 0, score: 0, terrain: 0, objectives: 0, tiles: 0, ms: 0, turns: 0, holes: 0, cut: 0, early: 0, earlyHoles: 0, cloudy: [0, 0], calm: [0, 0] }
      const fewestClouds = record.objectiveIds.includes(1)
      seat.habits.forEach((habit, index) => {
        stat.turns++
        stat.holes += habit.holes
        stat.cut += habit.cut
        if (index < 3) {
          stat.early++
          stat.earlyHoles += habit.holes
        }
        const clouds = fewestClouds ? stat.cloudy : stat.calm
        clouds[0]++
        clouds[1] += habit.clouds
      })
      stat.seats++
      if (seat.score === best) stat.wins += 1 / winners
      stat.score += seat.score
      stat.terrain += seat.terrain
      stat.objectives += seat.objectives
      stat.tiles += seat.tiles
      stat.ms += seat.ms
      stats.set(seat.contender, stat)
    }
  }
  // Margin of each contender against the others, game by game, for a confidence interval
  const margins = new Map()
  for (const record of records) {
    for (const seat of record.seats) {
      const others = record.seats.filter((other) => other !== seat)
      // Against the average of the others: less noisy than against the best of them
      const margin = seat.score - others.reduce((sum, other) => sum + other.score, 0) / others.length
      margins.set(seat.contender, [...(margins.get(seat.contender) ?? []), margin])
    }
  }
  console.log(`${records.length} games at ${lineup.length} players in ${((Date.now() - started) / 1000).toFixed(1)}s`)
  for (const [name, stat] of stats) {
    const list = margins.get(name)
    const mean = list.reduce((a, b) => a + b, 0) / list.length
    const sd = Math.sqrt(list.reduce((a, b) => a + (b - mean) ** 2, 0) / list.length)
    console.log(
      `${name.padEnd(24)} win ${((100 * stat.wins) / stat.seats).toFixed(1).padStart(5)}%  score ${(stat.score / stat.seats).toFixed(1).padStart(5)}` +
        `  terrain ${(stat.terrain / stat.seats).toFixed(1).padStart(5)}  objectives ${(stat.objectives / stat.seats).toFixed(1).padStart(5)}` +
        `  tiles ${(stat.tiles / stat.seats).toFixed(1).padStart(4)}  margin ${mean.toFixed(1).padStart(5)} ±${((1.96 * sd) / Math.sqrt(list.length)).toFixed(1)}` +
        `  ${(stat.ms / stat.seats).toFixed(0)}ms/game` +
        `  cut ${(stat.cut / stat.turns).toFixed(2)}  holes ${(stat.holes / stat.turns).toFixed(2)} (first 3 turns ${(stat.earlyHoles / stat.early).toFixed(2)})` +
        `  clouds/tile ${(stat.cloudy[1] / Math.max(1, stat.cloudy[0])).toFixed(2)} with FewestClouds, ${(stat.calm[1] / Math.max(1, stat.calm[0])).toFixed(2)} without`
    )
  }
  if (values.out) {
    mkdirSync(dirname(resolve(values.out)), { recursive: true })
    writeFileSync(resolve(values.out), JSON.stringify(records))
  }
}
