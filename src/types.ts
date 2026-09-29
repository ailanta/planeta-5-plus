export type Level = 1 | 2 | 3

export type Exercise = {
  id: string
  topicId: string
  skillId: string
  familyId: string
  level: Level
  prompt: string
  targetWord: string
  root: string
  testedLetter: string
  stressedCheckWords: string[]
  acceptedAnswers: {
    word: string[]
    checkWord: string[]
  }
  explanation: string
  hintSteps: string[]
  sentence?: string
  errorWord?: string
  tags: string[]
  contentVersion: number
  taskType?: 'spelling' | 'translation-choice' | 'sentence-choice'
  choices?: string[]
  rewardItem?: {
    emoji: string
    label: string
    color: string
    kind?: string
  }
}

export type Attempt = {
  id: string
  exerciseId: string
  sessionId: string
  createdAt: string
  firstAnswerCorrect: boolean
  finalCorrect: boolean
  hintsUsed: number
  level: Level
  confidence: 'sure' | 'unsure' | null
}

export type SkillStatus = 'new' | 'learning' | 'repair' | 'review' | 'mastered'

export type SkillState = {
  skillId: string
  status: SkillStatus
  attempts: number
  independentCorrect: number
  nextReviewAt: string | null
  lastAttemptAt: string | null
  hintsUsed: number
}

export type BuildingModule = {
  id: string
  exerciseId: string
  level: Level
  units: 1 | 2 | 3
  status: 'built' | 'repair'
  earned: boolean
  createdAt: string
  repairedAt: string | null
}

export type Progress = {
  version: 2
  floors: number
  targetFloors: number
  damagedExerciseIds: string[]
  modules: BuildingModule[]
  attempts: Attempt[]
  skills: Record<string, SkillState>
  sessionsCompleted: number
  lastPlayedAt: string | null
}

export const initialProgress: Progress = {
  version: 2,
  floors: 0,
  // Runtime progress replaces this fallback with totalFloorCapacity from the
  // exercise database; 30 keeps imported/standalone data structurally valid.
  targetFloors: 30,
  damagedExerciseIds: [],
  modules: [],
  attempts: [],
  skills: {},
  sessionsCompleted: 0,
  lastPlayedAt: null,
}
