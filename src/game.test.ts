import { describe, expect, it } from 'vitest'
import { exercises, families, totalFloorCapacity } from './content'
import { answerIsCorrect, applyAttempt, chooseExercise, createAttempt, floorRewardForAttempt, letterChoices, repairExerciseIds } from './game'
import { initialProgress } from './types'
import { migrateProgress } from './storage'

const x1 = exercises.find((exercise) => exercise.id === 'grass-x1')!
const x2 = exercises.find((exercise) => exercise.id === 'lick-x2')!

describe('exercise evaluation', () => {
  it('includes the confusable pair and correct answer for every warmup', () => {
    for (const letter of ['а', 'о']) expect(letterChoices(letter)).toEqual(expect.arrayContaining(['а', 'о']))
    for (const letter of ['е', 'и']) expect(letterChoices(letter)).toEqual(expect.arrayContaining(['е', 'и']))
    for (const exercise of exercises.filter(e => e.level === 1)) {
      const choices = letterChoices(exercise.testedLetter)
      expect(choices).toContain(exercise.testedLetter)
      expect(new Set(choices).size).toBe(3)
    }
  })

  it('accepts the ×2 context correction without requiring a check word', () => {
    expect(answerIsCorrect(x2, 'зализать', '', 'залезать')).toBe(true)
  })
  it('ships a balanced starter set', () => {
    const familyCount = exercises.filter((exercise) => exercise.level === 1).length
    expect(familyCount).toBeGreaterThan(0)
    expect(exercises).toHaveLength(families.reduce((sum, family) => sum + family.allowedLevels.length, 0))
    expect(exercises.filter((exercise) => exercise.level === 1)).toHaveLength(familyCount)
    expect(new Set(exercises.map((exercise) => exercise.id)).size).toBe(exercises.length)
    expect(totalFloorCapacity).toBe(exercises.reduce((sum, exercise) => sum + exercise.level, 0))
    expect(exercises.filter(e => e.familyId === 'lick').map(e => e.level)).toEqual([2])
    expect(exercises.filter(e => e.familyId === 'climb').map(e => e.level)).toEqual([2])
    expect(families.every((family) => family.allowedLevels.every((level) => level === 1 || level === 2))).toBe(true)
    expect(exercises.every((exercise) => exercise.level === 1 || exercise.level === 2)).toBe(true)
    expect(exercises.some(e => e.familyId === 'heavy')).toBe(false)
    expect(exercises.every((exercise) => exercise.explanation && exercise.hintSteps.length === 3 && exercise.acceptedAnswers.checkWord.length > 0)).toBe(true)
    const contexts = exercises.filter((exercise) => exercise.level === 2)
    const normalizeText = (value: string) => value.toLocaleLowerCase('ru-RU').replace(/[.,!?;:]/g, '').split(/\s+/)
    expect(contexts.every((exercise) => normalizeText(exercise.sentence ?? '').includes((exercise.errorWord ?? '').toLocaleLowerCase('ru-RU')))).toBe(true)
  })

  it('checks the missing letter on level one', () => {
    expect(answerIsCorrect(x1, 'а')).toBe(true)
    expect(answerIsCorrect(x1, 'о')).toBe(false)
  })

  it('requires the misspelled word and its correction on level two', () => {
    expect(answerIsCorrect(x2, 'зализать', '', 'залезать')).toBe(true)
    expect(answerIsCorrect(x2, 'зализать', '', '')).toBe(false)
    expect(answerIsCorrect(x2, 'залезать', '', 'залезать')).toBe(false)
  })

  it('rejects selecting the wrong word in the context', () => {
    expect(answerIsCorrect(x2, 'трава', '', 'зелёная')).toBe(false)
  })
})

describe('repair loop', () => {
  it('retains a corrected mistake across reload until an independent later session', () => {
    const wrong = applyAttempt(initialProgress, createAttempt(x1, 'first', false, false, 0, null))
    const corrected = applyAttempt(wrong, createAttempt(x1, 'first', false, true, 0, null))
    // Simulate the older bug: the module is restored and queue was emptied.
    const restored = migrateProgress(JSON.parse(JSON.stringify({ ...corrected, damagedExerciseIds: [] })))!
    expect(repairExerciseIds(restored)).toContain(x1.id)
    expect(chooseExercise(restored).id).toBe(x1.id)
    const hinted = applyAttempt(restored, createAttempt(x1, 'second', true, true, 1, null))
    expect(repairExerciseIds(hinted)).toContain(x1.id)
    const checked = applyAttempt(hinted, createAttempt(x1, 'third', true, true, 0, null))
    expect(repairExerciseIds(checked)).not.toContain(x1.id)
    expect(floorRewardForAttempt(hinted, createAttempt(x1, 'third', true, true, 0, null))).toBe(0)
    expect(repairExerciseIds(migrateProgress(JSON.parse(JSON.stringify(checked)))!)).not.toContain(x1.id)
  })
  it('marks an error for repair without taking away floors', () => {
    const attempt = createAttempt(x1, 'session', false, false, 1, 'unsure')
    const result = applyAttempt({ ...initialProgress, floors: 4 }, attempt)
    expect(result.floors).toBe(4)
    expect(result.damagedExerciseIds).toContain(x1.id)
  })

  it('prioritizes a damaged exercise', () => {
    const progress = { ...initialProgress, damagedExerciseIds: [x1.id] }
    expect(chooseExercise(progress).id).toBe(x1.id)
  })

  it('keeps a first-attempt mistake for the next session', () => {
    const damaged = applyAttempt(initialProgress, createAttempt(x1, 'session', false, false, 0, 'unsure'))
    expect(repairExerciseIds(damaged)).toContain(x1.id)
    expect(chooseExercise(damaged).id).toBe(x1.id)
  })

  it('recovers repairs stored on a module in an older save', () => {
    const progress = {
      ...initialProgress,
      modules: [{
        id: `module-${x1.id}`,
        exerciseId: x1.id,
        level: 1 as const,
        units: 1 as const,
        status: 'repair' as const,
        earned: false,
        createdAt: new Date().toISOString(),
        repairedAt: null,
      }],
    }
    expect(repairExerciseIds(progress)).toContain(x1.id)
    expect(chooseExercise(progress).id).toBe(x1.id)
  })

  it('moves to a new warm-up word before repeating the same family at x2', () => {
    const learned = applyAttempt(initialProgress, createAttempt(x1, 'session', true, true, 0, 'sure'))
    const next = chooseExercise(learned, Date.now(), [x1.id])
    expect(next.level).toBe(1)
    expect(next.id).not.toBe(x1.id)
    expect(next.familyId).not.toBe(x1.familyId)
  })

  it('uses four warm-ups followed by one challenge', () => {
    const warmups = exercises.filter((exercise) => exercise.level === 1).slice(0, 4)
    const learned = warmups.reduce((current, exercise, index) => applyAttempt(current, createAttempt(exercise, `session-${index}`, true, true, 0, 'sure')), initialProgress)
    const next = chooseExercise(learned, Date.now(), warmups.map((exercise) => exercise.id))
    expect(next.level).toBe(2)
  })

  it('does not repeat a completed warm-up while fresh challenges remain', () => {
    const learned = applyAttempt(initialProgress, createAttempt(x1, 'session', true, true, 0, 'sure'))
    const next = chooseExercise(learned, Date.now(), [x1.id])
    expect(next.id).not.toBe(x1.id)
  })

  it('builds a module once and repairs it without duplicate reward', () => {
    const wrong = createAttempt(x2, 'session', false, false, 1, 'unsure')
    const damaged = applyAttempt(initialProgress, wrong)
    expect(damaged.modules[0]).toMatchObject({ exerciseId: x2.id, units: 2, status: 'repair', earned: false })
    expect(floorRewardForAttempt(initialProgress, wrong)).toBe(0)

    const fixed = createAttempt(x2, 'session', false, true, 1, 'unsure')
    const repaired = applyAttempt(damaged, fixed)
    expect(repaired.modules[0]).toMatchObject({ status: 'built', earned: true, repairedAt: fixed.createdAt })
    expect(floorRewardForAttempt(damaged, fixed)).toBe(2)

    const reviewMistake = createAttempt(x2, 'session-2', false, false, 1, 'unsure')
    const reviewDamaged = applyAttempt(repaired, reviewMistake)
    const reviewFixed = createAttempt(x2, 'session-2', false, true, 1, 'unsure')
    expect(floorRewardForAttempt(reviewDamaged, reviewFixed)).toBe(0)
  })
})
