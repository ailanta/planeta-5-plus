import { describe, expect, it } from 'vitest'
import { floorSlotsFromModules, layoutBuilding, stageForProgress } from './world'

describe('building scene model', () => {
  it('allocates visual floor units from real modules', () => {
    const slots = floorSlotsFromModules([
      { id: 'a', exerciseId: 'one', level: 1, units: 1, status: 'built', earned: true, createdAt: '2026-01-01T00:00:00Z', repairedAt: null },
      { id: 'b', exerciseId: 'two', level: 2, units: 2, status: 'repair', earned: true, createdAt: '2026-01-02T00:00:00Z', repairedAt: '2026-01-03T00:00:00Z' },
      { id: 'c', exerciseId: 'three', level: 3, units: 3, status: 'built', earned: true, createdAt: '2026-01-03T00:00:00Z', repairedAt: null },
    ], 6)
    expect(slots.map((slot) => slot?.kind)).toEqual(['standard', 'challenge', 'challenge', 'vip', 'vip', 'vip'])
    expect(slots[1]?.status).toBe('repair')
    expect(slots[1]?.exerciseId).toBe('two')
  })

  it('keeps camera geometry valid for compact and tall buildings', () => {
    const compact = layoutBuilding(12, true)
    const tall = layoutBuilding(50)
    expect(compact.worldHeight).toBe(230)
    expect(tall.worldHeight).toBeGreaterThan(compact.worldHeight)
    expect(tall.baseY).toBeGreaterThan(tall.buildingTopY)
  })

  it('maps progress to the intended visual stage', () => {
    expect(stageForProgress(0, 12)).toBe('foundation')
    expect(stageForProgress(6, 12)).toBe('high-rise')
    expect(stageForProgress(12, 12)).toBe('above-clouds')
  })
})
