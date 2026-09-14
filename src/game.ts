import { exercises } from './content'
import type { Attempt, BuildingModule, Exercise, Level, Progress, SkillState } from './types'

export const TOPIC_ID = 'unstressed-vowels'

export function letterChoices(letter: string): string[] {
  if (letter === 'а' || letter === 'о') return ['а', 'о', 'е']
  if (letter === 'е' || letter === 'и' || letter === 'я') return ['е', 'и', 'я']
  return [...new Set([letter, 'а', 'и'])]
}

export function normalizeAnswer(value: string): string {
  return value.trim().toLocaleLowerCase('ru-RU').replace(/\s+/g, ' ')
}

export function matches(value: string, accepted: string[]): boolean {
  const normalized = normalizeAnswer(value)
  return accepted.some((answer) => normalizeAnswer(answer) === normalized)
}

export function answerIsCorrect(exercise: Exercise, word: string, checkWord = '', selectedErrorWord = ''): boolean {
  if (exercise.level === 1) return normalizeAnswer(word) === normalizeAnswer(exercise.testedLetter)
  // The challenge level is contextual: choose the misspelled word and enter
  // its correction. A proof word is deliberately not required because a
  // family can have several valid checking words.
  return matches(word, exercise.acceptedAnswers.word) && matches(selectedErrorWord, exercise.errorWord ? [exercise.errorWord] : [])
}

export function getSkill(progress: Progress, skillId: string): SkillState {
  return progress.skills[skillId] ?? {
    skillId, status: 'new', attempts: 0, independentCorrect: 0,
    nextReviewAt: null, lastAttemptAt: null, hintsUsed: 0,
  }
}

function isDue(skill: SkillState, now: number): boolean {
  return Boolean(skill.nextReviewAt && new Date(skill.nextReviewAt).getTime() <= now)
}

/**
 * Returns every exercise that needs a repair pass.
 *
 * Older saves stored this only in `damagedExerciseIds`, while newer saves
 * also mark the corresponding building module as `status: 'repair'`.  Keep
 * both sources in sync at read time so a saved mistake can never disappear
 * from the repair queue after an app update or a partial migration.
 */
export function repairExerciseIds(progress: Progress): string[] {
  const ids = new Set(progress.damagedExerciseIds ?? [])
  for (const module of progress.modules ?? []) {
    if (module.status === 'repair') ids.add(module.exerciseId)
  }
  // Rebuild pending checks from history, including saves where immediate
  // correction incorrectly removed the error from the queue.
  const pending = new Map<string, string>()
  for (const attempt of progress.attempts) {
    if (!attempt.firstAnswerCorrect || !attempt.finalCorrect) {
      pending.set(attempt.exerciseId, attempt.sessionId)
    } else if (attempt.hintsUsed === 0 && pending.get(attempt.exerciseId) !== attempt.sessionId) {
      pending.delete(attempt.exerciseId)
    }
  }
  for (const id of pending.keys()) ids.add(id)
  return [...ids].filter((id) => exercises.some((exercise) => exercise.id === id))
}

export function chooseExercise(progress: Progress, now = Date.now(), excludedIds: string[] = []): Exercise {
  const available = exercises.filter((exercise) => exercise.topicId === TOPIC_ID && !excludedIds.includes(exercise.id))
  const damagedIds = new Set(repairExerciseIds(progress))
  const damaged = available.find((exercise) => damagedIds.has(exercise.id))
  if (damaged) return damaged
  // A family has one skill state shared by its warm-up and challenge. Use the
  // concrete exercise id to know whether that exact card was already shown;
  // otherwise a completed ×1 card could come back while we were teaching ×2.
  const attemptedIds = new Set(progress.attempts.map((attempt) => attempt.exerciseId))
  const fresh = available.filter((exercise) => !attemptedIds.has(exercise.id))
  // Session rhythm: four new warm-ups, then one contextual challenge. When a
  // lane runs out, use the remaining fresh lane instead of repeating a word.
  const preferredLevel = excludedIds.length % 5 === 4 ? 2 : 1
  const preferredFresh = fresh.find((exercise) => exercise.level === preferredLevel)
  if (preferredFresh) return preferredFresh
  const remainingFresh = fresh.find((exercise) => exercise.level !== preferredLevel)
  if (remainingFresh) return remainingFresh
  const due = available.filter((exercise) => isDue(getSkill(progress, exercise.skillId), now))
  const dueReview = due.find((exercise) => exercise.level === preferredLevel) ?? due[0]
  if (dueReview) return dueReview
  const learningPool = available.filter((exercise) => getSkill(progress, exercise.skillId).status !== 'mastered')
  const learning = learningPool.find((exercise) => exercise.level === preferredLevel) ?? learningPool[0]
  return learning ?? available[Math.floor(Math.random() * available.length)]
}

function nextInterval(attempt: Attempt): number {
  if (!attempt.firstAnswerCorrect || attempt.hintsUsed > 0) return 1
  if (attempt.level === 2) return 7
  return 3
}

export function applyAttempt(progress: Progress, attempt: Attempt): Progress {
  const skillId = exercises.find((item) => item.id === attempt.exerciseId)?.skillId ?? ''
  const skill = getSkill(progress, skillId)
  const next: Progress = structuredClone(progress)
  next.modules = next.modules ?? []
  const nextSkill = { ...skill }
  nextSkill.attempts += 1
  nextSkill.lastAttemptAt = attempt.createdAt
  nextSkill.hintsUsed += attempt.hintsUsed
  if (attempt.firstAnswerCorrect && attempt.hintsUsed === 0) nextSkill.independentCorrect += 1
  if (!attempt.finalCorrect) {
    nextSkill.status = 'repair'
    if (!next.damagedExerciseIds.includes(attempt.exerciseId)) next.damagedExerciseIds.push(attempt.exerciseId)
    const existing = next.modules.find((module) => module.exerciseId === attempt.exerciseId)
    if (existing) {
      existing.status = 'repair'
    } else {
      next.modules.push({
        id: `module-${attempt.exerciseId}`,
        exerciseId: attempt.exerciseId,
        level: attempt.level,
        units: floorReward(attempt.level) as 1 | 2 | 3,
        status: 'repair',
        earned: false,
        createdAt: attempt.createdAt,
        repairedAt: null,
      })
    }
  } else {
    const wasPending = repairExerciseIds(progress).includes(attempt.exerciseId)
    const lastMistake = [...progress.attempts].reverse().find((item) => item.exerciseId === attempt.exerciseId && (!item.firstAnswerCorrect || !item.finalCorrect))
    const independentlyRechecked = attempt.firstAnswerCorrect && attempt.hintsUsed === 0 && lastMistake?.sessionId !== attempt.sessionId
    if (independentlyRechecked) {
      next.damagedExerciseIds = next.damagedExerciseIds.filter((id) => id !== attempt.exerciseId)
    } else if ((wasPending || !attempt.firstAnswerCorrect) && !next.damagedExerciseIds.includes(attempt.exerciseId)) {
      next.damagedExerciseIds.push(attempt.exerciseId)
    }
    const existing = next.modules.find((module) => module.exerciseId === attempt.exerciseId)
    if (existing) {
      existing.status = 'built'
      existing.earned = true
      existing.repairedAt = attempt.createdAt
    } else {
      next.modules.push({
        id: `module-${attempt.exerciseId}`,
        exerciseId: attempt.exerciseId,
        level: attempt.level,
        units: floorReward(attempt.level) as 1 | 2 | 3,
        status: 'built',
        earned: true,
        createdAt: attempt.createdAt,
        repairedAt: null,
      })
    }
    nextSkill.status = nextSkill.independentCorrect >= 3 ? 'review' : 'learning'
    const dueDate = new Date(attempt.createdAt)
    dueDate.setDate(dueDate.getDate() + nextInterval(attempt))
    nextSkill.nextReviewAt = dueDate.toISOString()
  }
  if (nextSkill.independentCorrect >= 6 && attempt.level >= 2) nextSkill.status = 'mastered'
  next.skills[nextSkill.skillId] = nextSkill
  next.attempts.push(attempt)
  next.lastPlayedAt = attempt.createdAt
  return next
}

export function createAttempt(
  exercise: Exercise, sessionId: string, firstAnswerCorrect: boolean,
  finalCorrect: boolean, hintsUsed: number, confidence: Attempt['confidence'],
): Attempt {
  return {
    id: sessionId + '-' + exercise.id + '-' + Date.now(),
    exerciseId: exercise.id,
    sessionId,
    createdAt: new Date().toISOString(),
    firstAnswerCorrect,
    finalCorrect,
    hintsUsed,
    level: exercise.level,
    confidence,
  }
}

export function floorReward(level: Level): number { return level }

/** Returns the module connected to an exercise, if it has already been built. */
export function moduleForExercise(progress: Progress, exerciseId: string): BuildingModule | undefined {
  return progress.modules?.find((module) => module.exerciseId === exerciseId)
}

/** A repaired review restores the existing module and must not build a duplicate floor. */
export function floorRewardForAttempt(progress: Progress, attempt: Attempt): number {
  const module = moduleForExercise(progress, attempt.exerciseId)
  if (!attempt.finalCorrect || module?.earned) return 0
  return floorReward(attempt.level)
}

export function topicMastery(progress: Progress): boolean {
  const unique = new Set(progress.attempts.filter((a) => a.firstAnswerCorrect && a.hintsUsed === 0).map((a) => a.exerciseId))
  const independent = progress.attempts.filter((a) => a.firstAnswerCorrect && a.hintsUsed === 0)
  const advanced = independent.filter((a) => a.level >= 2).length
  const contexts = independent.filter((a) => a.level === 2).length
  const dates = new Set(independent.map((a) => a.createdAt.slice(0, 10)))
  const recent = independent.slice(-10)
  return unique.size >= 8 && advanced >= 5 && contexts >= 2 && dates.size >= 2 && recent.length >= 5 && recent.filter((a) => a.firstAnswerCorrect).length / recent.length >= 0.85
}
