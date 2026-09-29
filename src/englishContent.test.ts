import { describe, expect, it } from 'vitest'
import { englishCapacity, englishExercises, englishExercisesFor, englishTopics } from './englishContent'
import { answerIsCorrect, applyAttempt, chooseExercise, createAttempt, repairExerciseIds } from './game'
import { initialProgress } from './types'

describe('English shopping mall content', () => {
  it('ships two complete boutiques with unique, valid choice cards', () => {
    expect(englishTopics.map((topic) => topic.id)).toEqual(['english-clothes', 'english-food', 'english-toys', 'english-home'])
    expect(new Set(englishExercises.map((exercise) => exercise.id)).size).toBe(englishExercises.length)

    for (const topic of englishTopics) {
      const pool = englishExercisesFor(topic.id)
      expect(pool.filter((exercise) => exercise.level === 1)).toHaveLength(topic.id === 'english-clothes' || topic.id === 'english-food' ? 16 : 12)
      expect(pool.filter((exercise) => exercise.level === 2)).toHaveLength(3)
      expect(englishCapacity(topic.id)).toBe(topic.id === 'english-clothes' || topic.id === 'english-food' ? 22 : 18)
      expect(pool.every((exercise) => exercise.choices?.length === 3)).toBe(true)
      expect(pool.every((exercise) => exercise.choices?.includes(exercise.acceptedAnswers.word[0]))).toBe(true)
      expect(pool.every((exercise) => exercise.rewardItem?.emoji && exercise.rewardItem.label)).toBe(true)
    }
  })

  it('checks both vocabulary phrases and contextual sentences', () => {
    const phrase = englishExercises.find((exercise) => exercise.id === 'english-clothes-red-skirt-x1')!
    const sentence = englishExercises.find((exercise) => exercise.id === 'english-food-juice-glass-x2')!

    expect(answerIsCorrect(phrase, 'a red skirt')).toBe(true)
    expect(answerIsCorrect(phrase, 'a red shirt')).toBe(false)
    expect(answerIsCorrect(sentence, 'I would like a glass of orange juice.')).toBe(true)
    expect(answerIsCorrect(sentence, 'I would like a cup of tea.')).toBe(false)
  })

  it('keeps the four easy purchases then one contextual challenge rhythm', () => {
    const pool = englishExercisesFor('english-clothes')
    const warmups = pool.filter((exercise) => exercise.level === 1).slice(0, 4)
    const learned = warmups.reduce(
      (progress, exercise, index) => applyAttempt(
        progress,
        createAttempt(exercise, `english-${index}`, true, true, 0, 'sure'),
        pool,
      ),
      { ...initialProgress, targetFloors: englishCapacity('english-clothes') },
    )

    const next = chooseExercise(
      learned,
      Date.now(),
      warmups.map((exercise) => exercise.id),
      pool,
      'english-clothes',
    )
    expect(next.level).toBe(2)
    expect(next.taskType).toBe('sentence-choice')
  })

  it('saves a missed purchase for repair without removing earned items', () => {
    const pool = englishExercisesFor('english-food')
    const exercise = pool[0]
    const progress = { ...initialProgress, targetFloors: englishCapacity('english-food'), floors: 3 }
    const damaged = applyAttempt(
      progress,
      createAttempt(exercise, 'english-repair', false, false, 0, 'unsure'),
      pool,
    )

    expect(damaged.floors).toBe(3)
    expect(repairExerciseIds(damaged, pool)).toContain(exercise.id)
    expect(chooseExercise(damaged, Date.now(), [], pool, 'english-food').id).toBe(exercise.id)
  })
})
