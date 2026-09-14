import type { BuildingModule } from './types'

export type FloorKind = 'standard' | 'challenge' | 'vip'

export type FloorSlot = {
  kind: FloorKind
  status: 'built' | 'repair'
  earned: boolean
  moduleId?: string
  exerciseId?: string
}

export type BuildingLayout = {
  floorHeight: number
  floorGap: number
  worldHeight: number
  baseY: number
  groundY: number
  buildingTopY: number
  craneTopY: number
  craneBaseY: number
}

export function stageForProgress(floors: number, target: number): 'foundation' | 'growing' | 'high-rise' | 'above-clouds' {
  const ratio = target > 0 ? Math.min(target, Math.max(0, floors)) / target : 0
  return ratio >= .78 ? 'above-clouds' : ratio >= .45 ? 'high-rise' : ratio > 0 ? 'growing' : 'foundation'
}

export function layoutBuilding(target: number, compact = false): BuildingLayout {
  const safeTarget = Math.max(1, Math.round(target))
  // Raster floor sprites are cropped to a shallow 2.75:1 module. The full
  // scene gives them enough vertical room for their balcony and depth face;
  // the compact game preview keeps the lighter vector mini-floor treatment.
  const floorHeight = compact ? 18 : 34
  const floorGap = compact ? 3 : 4
  // Full scenes keep a real promenade/plaza buffer below the tower. The
  // minimum 900 also preserves the panorama's native vertical composition
  // in short QA scenes instead of stretching the city into the sky.
  const worldHeight = compact ? 230 : Math.max(900, safeTarget * (floorHeight + floorGap) + 255)
  // The source panorama ends with an open waterfront plaza. Keep the building
  // on that prepared site; the transparent foundation artwork then extends
  // naturally toward the paving.
  const baseY = worldHeight - (compact ? 35 : 100)
  const groundY = worldHeight - 45
  const buildingTopY = baseY - safeTarget * (floorHeight + floorGap)
  const craneTopY = Math.max(24, buildingTopY - 28)
  const craneBaseY = baseY - 15
  return { floorHeight, floorGap, worldHeight, baseY, groundY, buildingTopY, craneTopY, craneBaseY }
}

export function floorSlotsFromModules(modules: BuildingModule[] = [], target: number): Array<FloorSlot | undefined> {
  const slots: Array<FloorSlot | undefined> = []
  let cursor = 0
  for (const module of [...modules].sort((a, b) => a.createdAt.localeCompare(b.createdAt))) {
    const kind: FloorKind = module.level === 3 ? 'vip' : module.level === 2 ? 'challenge' : 'standard'
    const units = Math.max(1, Math.min(3, Number(module.units)))
    for (let unit = 0; unit < units && cursor < target; unit += 1) {
      slots[cursor] = {
        kind,
        status: module.status,
        earned: module.earned,
        moduleId: module.id,
        exerciseId: module.exerciseId,
      }
      cursor += 1
    }
  }
  return slots
}
