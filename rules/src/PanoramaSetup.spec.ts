import { getEnumValues } from '@gamepark/rules-api'
import { describe, expect, it } from 'vitest'
import { MaterialType } from './material/MaterialType'
import { getObjectiveCategory, Objective } from './material/Objective'
import { ObjectiveSet, objectiveSets } from './material/ObjectiveSet'
import { PanoramaSetup } from './PanoramaSetup'

const objectivesOf = (objectives?: ObjectiveSet) =>
  new PanoramaSetup()
    .setup({ players: [{ id: 1 }, { id: 2 }], objectives })
    .items[MaterialType.ObjectiveToken]!.map((item) => item.id as Objective)

describe('Objectives', () => {
  it('are one of each colour at random by default', () => {
    for (let i = 0; i < 20; i++) {
      expect(objectivesOf().map(getObjectiveCategory).sort()).toEqual([1, 2, 3])
    }
  })

  it('are the 3 starred ones for a first game', () => {
    expect(objectivesOf(ObjectiveSet.FirstGame)).toEqual([Objective.FewestClouds, Objective.LongestRiver, Objective.MostCrows])
  })

  it('are those of the chosen Scenario', () => {
    for (const set of getEnumValues(ObjectiveSet).filter((set) => set > ObjectiveSet.FirstGame)) {
      expect(objectivesOf(set)).toEqual(objectiveSets[set as Exclude<ObjectiveSet, ObjectiveSet.Random>])
    }
  })
})
