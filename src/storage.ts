import Dexie, { type Table } from 'dexie'
import { exercises, totalFloorCapacity } from './content'
import { initialProgress, type Progress } from './types'

class ProgressDatabase extends Dexie {
  progress!: Table<{ key: string; value: Progress }, string>
  constructor() {
    super('ailanta-kids')
    this.version(1).stores({ progress: 'key' })
  }
}

const db = new ProgressDatabase()
const FALLBACK_KEY = 'ailanta-progress-v1'

function migrateExerciseId(id: string): string {
  // The proof-word ×2 step and the context ×3 step are now one contextual
  // ×2 step. Preserve old repairs/history by mapping to whichever canonical
  // exercise exists for the family.
  if (!id.endsWith('-x2') && !id.endsWith('-x3')) return id
  if (exercises.some((exercise) => exercise.id === id)) return id
  const suffix = id.endsWith('-x3') ? '-x2' : '-x3'
  const candidate = id.slice(0, -3) + suffix
  return exercises.some((exercise) => exercise.id === candidate) ? candidate : id
}

export function migrateProgress(value: unknown): Progress | null {
  if (!value || typeof value !== 'object') return null
  const source = value as Partial<Progress> & { version?: number }
  if (!Array.isArray(source.attempts) || !Array.isArray(source.damagedExerciseIds)) return null
  const modules = (Array.isArray(source.modules) ? source.modules : []).map((module) => {
    const exerciseId = migrateExerciseId(module.exerciseId)
    const currentLevel = exercises.find((exercise) => exercise.id === exerciseId)?.level
    return { ...module, exerciseId, level: currentLevel ?? (module.level === 3 ? 2 : module.level) }
  })
  const damagedExerciseIds = new Set(source.damagedExerciseIds.map(migrateExerciseId))
  for (const module of modules) {
    if (module.status === 'repair' && typeof module.exerciseId === 'string') damagedExerciseIds.add(module.exerciseId)
  }
  return {
    ...initialProgress,
    ...source,
    version: 2,
    // Keep the landmark synchronized with the exercise database. This also
    // upgrades old saves that still contain the original 12/30-floor target.
    targetFloors: totalFloorCapacity,
    modules,
    // Older versions could persist the repair state only on a building
    // module. Promote those ids into the canonical queue while loading so
    // the next session always offers the pending repair.
    damagedExerciseIds: [...damagedExerciseIds],
    attempts: source.attempts.map((attempt) => {
      const exerciseId = migrateExerciseId(attempt.exerciseId)
      const currentLevel = exercises.find((exercise) => exercise.id === exerciseId)?.level
      return { ...attempt, exerciseId, level: currentLevel ?? (attempt.level === 3 ? 2 : attempt.level) }
    }),
    skills: source.skills ?? {},
  }
}

export async function loadProgress(): Promise<Progress | null> {
  try {
    const row = await db.progress.get('current')
    return migrateProgress(row?.value)
  } catch {
    const raw = localStorage.getItem(FALLBACK_KEY)
    return raw ? migrateProgress(JSON.parse(raw)) : null
  }
}

export async function saveProgress(progress: Progress): Promise<void> {
  try {
    await db.progress.put({ key: 'current', value: progress })
  } catch {
    localStorage.setItem(FALLBACK_KEY, JSON.stringify(progress))
  }
}

export async function clearProgress(): Promise<void> {
  try {
    await db.progress.delete('current')
  } finally {
    localStorage.removeItem(FALLBACK_KEY)
  }
}

export async function requestPersistentStorage(): Promise<boolean> {
  if (!navigator.storage?.persist) return false
  try {
    return await navigator.storage.persist()
  } catch {
    return false
  }
}
