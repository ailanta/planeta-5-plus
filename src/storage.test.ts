import { describe, expect, it } from 'vitest'
import { totalFloorCapacity } from './content'
import { migrateProgress } from './storage'

describe('progress migration', () => {
  it('upgrades v1 progress without inventing historical floor types', () => {
    const migrated = migrateProgress({ version: 1, floors: 7, targetFloors: 12, damagedExerciseIds: ['grass-x1'], attempts: [] })
    expect(migrated).not.toBeNull()
    expect(migrated?.version).toBe(2)
    expect(migrated?.floors).toBe(7)
    expect(migrated?.targetFloors).toBe(totalFloorCapacity)
    expect(migrated?.modules).toEqual([])
    expect(migrated?.damagedExerciseIds).toEqual(['grass-x1'])
  })

  it('rejects malformed exports', () => {
    expect(migrateProgress({ version: 2, floors: 2 })).toBeNull()
  })

  it('restores repair ids kept on a module by older builds', () => {
    const migrated = migrateProgress({
      version: 2,
      floors: 1,
      targetFloors: 12,
      damagedExerciseIds: [],
      attempts: [],
      modules: [{
        id: 'module-grass-x1', exerciseId: 'grass-x1', level: 1, units: 1,
        status: 'repair', earned: false, createdAt: new Date().toISOString(), repairedAt: null,
      }],
    })
    expect(migrated?.damagedExerciseIds).toContain('grass-x1')
  })

  it('keeps old standalone context repairs attached after they become ×2', () => {
    const migrated = migrateProgress({
      version: 2,
      floors: 1,
      targetFloors: 12,
      damagedExerciseIds: ['lick-x3'],
      attempts: [{ id: 'a', exerciseId: 'lick-x3', sessionId: 's', createdAt: new Date().toISOString(), firstAnswerCorrect: false, finalCorrect: false, hintsUsed: 0, level: 3, confidence: 'unsure' }],
      modules: [],
    })
    expect(migrated?.damagedExerciseIds).toContain('lick-x2')
    expect(migrated?.attempts[0].exerciseId).toBe('lick-x2')
  })

  it('merges old proof and context ids into one challenge', () => {
    const migrated = migrateProgress({ version: 2, floors: 1, targetFloors: 12, damagedExerciseIds: ['grass-x2'], attempts: [], modules: [] })
    expect(migrated?.damagedExerciseIds).toContain('grass-x2')
  })
})
