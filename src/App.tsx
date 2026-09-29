import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { exercises, totalFloorCapacity } from './content'
import { englishCapacity, englishExercisesFor, englishTopics, type EnglishTopicId } from './englishContent'
import { answerIsCorrect, applyAttempt, chooseExercise, createAttempt, floorRewardForAttempt, repairExerciseIds, topicMastery, letterChoices } from './game'
import { clearProgress, loadProgress, migrateProgress, requestPersistentStorage, saveProgress } from './storage'
import { initialProgress, type BuildingModule, type Exercise, type Progress } from './types'
import { floorSlotsFromModules, layoutBuilding, stageForProgress } from './world'

type Screen = 'home' | 'english-home' | 'play' | 'summary' | 'parent'
type GameMode = 'russian' | 'english'
type Feedback = 'correct' | 'repair' | 'revealed' | null
const WORLD_ASSET_BASE = `${import.meta.env.BASE_URL}assets/world/russian/`
const WORLD_ASSET_ROOT = `${import.meta.env.BASE_URL}assets/world/`
// Plaza scene: the foreground is a quiet building site rather than a roadway,
// so the foundation has a clear visual place to stand.  The same scene is used
// for the horizontal street so the world does not switch back to asphalt.
const CITY_BACKGROUND = WORLD_ASSET_ROOT + 'city-background-plaza-v1.jpg'
const CITY_STREET_BACKGROUND = WORLD_ASSET_ROOT + 'city-street-continuous-v2.png'
const FOUNDATION_ASSET = WORLD_ASSET_ROOT + 'russian/foundation-v1.png'
const MALL_BACKGROUND = WORLD_ASSET_ROOT + 'english/mall-panorama-v1.png'

function freshEnglishProgress(): Record<EnglishTopicId, Progress> {
  return Object.fromEntries(englishTopics.map((topic) => [
    topic.id,
    { ...initialProgress, targetFloors: englishCapacity(topic.id) },
  ])) as Record<EnglishTopicId, Progress>
}

function floorLabel(count: number): string {
  const mod10 = count % 10
  const mod100 = count % 100
  if (mod10 === 1 && mod100 !== 11) return 'этаж'
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'этажа'
  return 'этажей'
}

function productLabel(count: number): string {
  const mod10 = count % 10
  const mod100 = count % 100
  if (mod10 === 1 && mod100 !== 11) return 'товар'
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'товара'
  return 'товаров'
}

function shuffleChoices(values: string[], seed: string, correctAnswer?: string): string[] {
  const result = [...values]
  let hash = 2166136261
  for (const character of seed) hash = Math.imul(hash ^ character.charCodeAt(0), 16777619)
  for (let index = result.length - 1; index > 0; index -= 1) {
    hash = Math.imul(hash ^ (hash >>> 13), 1274126177)
    const swapIndex = Math.abs(hash) % (index + 1)
    ;[result[index], result[swapIndex]] = [result[swapIndex], result[index]]
  }
  // The source content keeps the correct answer first for readability. In the
  // game it should never look like the default choice, so move it when the
  // deterministic shuffle happens to leave it in position zero.
  if (correctAnswer && result.length > 1 && result[0] === correctAnswer) {
    const target = 1 + Math.abs(hash) % (result.length - 1)
    ;[result[0], result[target]] = [result[target], result[0]]
  }
  return result
}

function App() {
  const [progress, setProgress] = useState<Progress>({ ...initialProgress, targetFloors: totalFloorCapacity })
  const [englishProgress, setEnglishProgress] = useState<Record<EnglishTopicId, Progress>>(freshEnglishProgress)
  const [screen, setScreen] = useState<Screen>('home')
  const [gameMode, setGameMode] = useState<GameMode>('russian')
  const [activeEnglishTopic, setActiveEnglishTopic] = useState<EnglishTopicId>('english-clothes')
  const [loading, setLoading] = useState(true)
  const [exercise, setExercise] = useState<Exercise | null>(null)
  const [sessionId, setSessionId] = useState('')
  const [sessionExerciseIds, setSessionExerciseIds] = useState<string[]>([])
  const [sessionCount, setSessionCount] = useState(0)
  const [sessionStartFloors, setSessionStartFloors] = useState(0)
  const [word, setWord] = useState('')
  const [selectedErrorWord, setSelectedErrorWord] = useState('')
  const [feedback, setFeedback] = useState<Feedback>(null)
  const [hintsUsed, setHintsUsed] = useState(0)
  const [hintIndex, setHintIndex] = useState(-1)
  const [firstSubmitted, setFirstSubmitted] = useState(false)
  const [confidence, setConfidence] = useState<'sure' | 'unsure' | null>(null)
  const [lastRepair, setLastRepair] = useState(false)
  const progressRef = useRef(progress)
  const sessionExerciseIdsRef = useRef<string[]>([])
  const exercisePoolRef = useRef<Exercise[]>(exercises)
  const topicIdRef = useRef('unstressed-vowels')

  useEffect(() => {
    Promise.all([
      loadProgress(),
      ...englishTopics.map((topic) => loadProgress(topic.id, englishExercisesFor(topic.id), englishCapacity(topic.id))),
    ]).then(([stored, ...storedEnglish]) => {
      if (stored) setProgress(stored)
      const fresh = freshEnglishProgress()
      const next = englishTopics.reduce((result, topic, index) => ({
        ...result,
        [topic.id]: storedEnglish[index] ?? fresh[topic.id],
      }), {} as Record<EnglishTopicId, Progress>)
      setEnglishProgress(next)
      setLoading(false)
      requestPersistentStorage()
    })
  }, [])

  useEffect(() => {
    if (!loading) void saveProgress(progress)
  }, [progress, loading])

  useEffect(() => {
    if (loading) return
    void Promise.all(englishTopics.map((topic) => saveProgress(englishProgress[topic.id], topic.id)))
  }, [englishProgress, loading])

  const activeProgress = gameMode === 'english' ? englishProgress[activeEnglishTopic] : progress

  useEffect(() => {
    progressRef.current = activeProgress
  }, [activeProgress])

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [screen])

  const mastered = useMemo(() => topicMastery(activeProgress), [activeProgress])
  const russianMastered = useMemo(() => topicMastery(progress), [progress])
  const activePool = gameMode === 'english' ? englishExercisesFor(activeEnglishTopic) : exercises
  const repairCount = repairExerciseIds(activeProgress, activePool).length
  const russianRepairCount = repairExerciseIds(progress, exercises).length
  const sessionFloors = Math.max(0, activeProgress.floors - sessionStartFloors)

  function startSession(current: Progress, pool: Exercise[], topicId: string) {
    const id = crypto.randomUUID?.() ?? String(Date.now())
    exercisePoolRef.current = pool
    topicIdRef.current = topicId
    progressRef.current = current
    setSessionId(id)
    setSessionCount(0)
    setSessionExerciseIds([])
    sessionExerciseIdsRef.current = []
    setSessionStartFloors(current.floors)
    setScreen('play')
    loadNext(current, [], id)
  }

  function beginRussianSession() {
    setGameMode('russian')
    startSession(progress, exercises, 'unstressed-vowels')
  }

  function beginEnglishSession(topicId: EnglishTopicId) {
    const pool = englishExercisesFor(topicId)
    setGameMode('english')
    setActiveEnglishTopic(topicId)
    startSession(englishProgress[topicId], pool, topicId)
  }

  function loadNext(current: Progress, excluded: string[], id = sessionId) {
    const next = chooseExercise(current, Date.now(), excluded, exercisePoolRef.current, topicIdRef.current)
    setExercise(next)
    sessionExerciseIdsRef.current = [...excluded, next.id]
    setSessionExerciseIds(sessionExerciseIdsRef.current)
    setSessionCount((count) => count + 1)
    setWord('')
    setSelectedErrorWord('')
    setFeedback(null)
    setHintsUsed(0)
    setHintIndex(-1)
    setFirstSubmitted(false)
    setConfidence(null)
    setLastRepair(repairExerciseIds(current, exercisePoolRef.current).includes(next.id))
    if (!id) setSessionId(crypto.randomUUID?.() ?? String(Date.now()))
  }

  function commitAttempt(finalCorrect: boolean, initiallyCorrect: boolean) {
    if (!exercise) return
    const attempt = createAttempt(exercise, sessionId, initiallyCorrect, finalCorrect, hintsUsed, confidence)
    const update = (current: Progress) => {
      const updated = applyAttempt(current, attempt, exercisePoolRef.current)
      const reward = floorRewardForAttempt(current, attempt)
      if (reward > 0) updated.floors = Math.min(updated.targetFloors, updated.floors + reward)
      progressRef.current = updated
      return updated
    }
    if (exercise.topicId.startsWith('english-')) {
      const topicId = exercise.topicId as EnglishTopicId
      setEnglishProgress((current) => ({ ...current, [topicId]: update(current[topicId]) }))
    } else {
      setProgress(update)
    }
  }

  function submit() {
    if (!exercise || feedback === 'revealed') return
    const correct = answerIsCorrect(exercise, word, '', selectedErrorWord)
    if (!firstSubmitted) {
      setFirstSubmitted(true)
      if (correct) {
        commitAttempt(true, true)
        setFeedback('correct')
      } else {
        commitAttempt(false, false)
        setFeedback('repair')
        setHintIndex(0)
      }
      return
    }
    if (correct) {
      commitAttempt(true, false)
      setFeedback('correct')
    } else {
      setHintsUsed((value) => value + 1)
      setHintIndex((value) => Math.min(value + 1, exercise.hintSteps.length - 1))
      setFeedback('repair')
    }
  }

  function revealAndContinue() {
    if (!exercise) return
    if (feedback !== 'revealed') {
      setHintsUsed((value) => value + 1)
      setFeedback('revealed')
      return
    }
    commitAttempt(true, false)
    setFeedback('correct')
  }

  function nextExercise() {
    // Only the explicit finish button ends a session.
    loadNext(progressRef.current, sessionExerciseIdsRef.current)
  }

  function finishSession() {
    if (gameMode === 'english') {
      setEnglishProgress((current) => ({
        ...current,
        [activeEnglishTopic]: { ...current[activeEnglishTopic], sessionsCompleted: current[activeEnglishTopic].sessionsCompleted + 1 },
      }))
    } else {
      setProgress((current) => ({ ...current, sessionsCompleted: current.sessionsCompleted + 1 }))
    }
    setScreen('summary')
  }

  async function resetAll() {
    await Promise.all([clearProgress(), ...englishTopics.map((topic) => clearProgress(topic.id))])
    const fresh = { ...initialProgress, targetFloors: totalFloorCapacity }
    const freshEnglish = freshEnglishProgress()
    progressRef.current = fresh
    sessionExerciseIdsRef.current = []
    setProgress(fresh)
    setEnglishProgress(freshEnglish)
    setScreen('home')
  }

  function requestHint() {
    if (!exercise) return
    setConfidence('unsure')
    setHintsUsed((value) => value + 1)
    setHintIndex((value) => Math.min(value + 1, exercise.hintSteps.length - 1))
  }

  function exportProgress() {
    const blob = new Blob([JSON.stringify(progress, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'planeta-5plus-progress.json'
    link.click()
    URL.revokeObjectURL(url)
  }

  function importProgress(file: File) {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const value = JSON.parse(String(reader.result)) as Progress
        const migrated = migrateProgress(value)
        if (!migrated) throw new Error('invalid')
        setProgress(migrated)
        setScreen('home')
      } catch {
        window.alert('Не удалось прочитать файл прогресса.')
      }
    }
    reader.readAsText(file)
  }

  if (loading) return <main className="loading">Загружаем башню…</main>

  if (import.meta.env.DEV && new URLSearchParams(window.location.search).get('gallery') === '1') {
    return <SceneGallery />
  }

  return (
    <div className={'app-shell ' + (screen === 'play' ? 'play-shell' : '')}>
      <header className="app-header">
        <button className="brand-button" onClick={() => setScreen('home')} aria-label="Планета 5+ — на главную"><span className="brand-mark" aria-hidden="true">+</span><span>ПЛАНЕТА <b className="brand-grade">5+</b></span></button>
        <button className="parent-link" onClick={() => setScreen('parent')}>Взрослым</button>
      </header>
      {screen === 'home' && <Home progress={progress} repairCount={russianRepairCount} mastered={russianMastered} onStart={beginRussianSession} onOpenEnglish={() => setScreen('english-home')} />}
      {screen === 'english-home' && <EnglishHome progress={englishProgress} onBack={() => setScreen('home')} onStart={beginEnglishSession} />}
      {screen === 'play' && exercise && <Play mode={gameMode} exercise={exercise} progress={activeProgress} sessionCount={sessionCount} sessionFloors={sessionFloors} lastRepair={lastRepair} word={word} selectedErrorWord={selectedErrorWord} feedback={feedback} hintIndex={hintIndex} confidence={confidence} onWordChange={setWord} onSelectedErrorWord={setSelectedErrorWord} onNeedHint={requestHint} onSubmit={submit} onReveal={revealAndContinue} onNext={nextExercise} onFinish={finishSession} />}
      {screen === 'summary' && <Summary mode={gameMode} topicId={gameMode === 'english' ? activeEnglishTopic : undefined} progress={activeProgress} sessionFloors={sessionFloors} mastered={mastered} onAgain={() => gameMode === 'english' ? beginEnglishSession(activeEnglishTopic) : beginRussianSession()} onHome={() => setScreen(gameMode === 'english' ? 'english-home' : 'home')} />}
      {screen === 'parent' && <Parent progress={progress} onBack={() => setScreen('home')} onReset={resetAll} onExport={exportProgress} onImport={importProgress} />}
    </div>
  )
}

function galleryModules(floors: number, target: number, repairIndex: number | null = null, pending = false): BuildingModule[] {
  const modules: BuildingModule[] = []
  let cursor = 0
  let sequence = 0
  while (cursor < floors) {
    const level = ([1, 2, 3] as const)[sequence % 3]
    const units = Math.min(level, floors - cursor) as 1 | 2 | 3
    modules.push({
      id: `gallery-${floors}-${sequence}`,
      exerciseId: `gallery-exercise-${sequence}`,
      level,
      units,
      status: repairIndex === sequence ? 'repair' : 'built',
      earned: true,
      createdAt: `2026-01-${String(sequence + 1).padStart(2, '0')}T00:00:00.000Z`,
      repairedAt: repairIndex === sequence ? '2026-02-01T00:00:00.000Z' : null,
    })
    cursor += units
    sequence += 1
  }
  if (pending && cursor < target) {
    const level = 2 as const
    modules.push({
      id: `gallery-pending-${floors}`,
      exerciseId: `gallery-pending-exercise-${floors}`,
      level,
      units: 2,
      status: 'repair',
      earned: false,
      createdAt: '2026-02-02T00:00:00.000Z',
      repairedAt: null,
    })
  }
  return modules
}

function SceneGallery() {
  const scenes = [
    { title: 'Пустое основание', floors: 0, target: 12, modules: galleryModules(0, 12) },
    { title: 'Первые этажи · ×2', floors: 5, target: 12, modules: galleryModules(5, 12) },
    { title: 'Высотка', floors: 12, target: 12, modules: galleryModules(12, 12) },
    { title: 'Высокое здание · 30', floors: 30, target: 30, modules: galleryModules(30, 30) },
    { title: 'Башня · 50 этажей', floors: 50, target: 50, modules: galleryModules(50, 50) },
    { title: 'Построенный этаж в ремонте', floors: 8, target: 12, modules: galleryModules(8, 12, 1) },
    { title: 'Ошибка ждёт исправления', floors: 5, target: 12, modules: galleryModules(5, 12, null, true) },
  ]
  return <main className="gallery-screen"><div className="gallery-header"><div><p className="eyebrow">DEV-ONLY · QA</p><h1>Галерея сцен</h1><p>Проверка raster-этажей, камеры и ремонта. Реальный прогресс не изменяется.</p></div><a className="secondary-button" href="./">В приложение</a></div><div className="gallery-grid">{scenes.map((scene) => <section className="gallery-scene" key={scene.title}><h2>{scene.title}</h2><Tower floors={scene.floors} target={scene.target} damaged={scene.modules.some((module) => module.status === 'repair')} modules={scene.modules} /></section>)}</div></main>
}

function Tower({ floors, target, damaged, modules = [], compact = false, immersive = false, streetScene = false }: { floors: number; target: number; damaged?: boolean; modules?: BuildingModule[]; compact?: boolean; immersive?: boolean; streetScene?: boolean }) {
  const shown = Math.min(target, floors)
  const stage = stageForProgress(shown, target)
  const buildingX = 157
  const buildingWidth = 106
  const layout = useMemo(() => layoutBuilding(target, compact), [target, compact])
  const { floorHeight, floorGap, worldHeight, baseY, groundY } = layout
  const backgroundHeight = Math.min(worldHeight, 900)
  const builtHeight = shown * (floorHeight + floorGap)
  const overviewScale = Math.min(1, 165 / Math.max(1, builtHeight))
  const towerScrollRef = useRef<HTMLDivElement>(null)
  const [failedSprites, setFailedSprites] = useState<string[]>([])
  const canPanVertically = !streetScene && worldHeight > 230

  useEffect(() => {
    const viewport = towerScrollRef.current
    if (viewport) {
      // Keep the foundation in the lower third of the game viewport. This
      // leaves the question card readable while the player can still see the
      // building grow out from its actual base.
      // Lower the street foundation slightly onto the foreground paving.
      // The SVG foundation starts 34 world units above the building baseline.
      const baseViewport = streetScene ? (viewport.clientHeight - 51) * 420 / viewport.clientWidth + 34 : Math.min(680, Math.max(470, viewport.clientHeight - 200))
      const scale = viewport.clientWidth / 420
      viewport.scrollTop = Math.max(0, (baseY - baseViewport) * scale)
    }
  }, [target, baseY, streetScene])

  function moveCamera(to: 'top' | 'base') {
    const viewport = towerScrollRef.current
    if (!viewport) return
    const scale = viewport.clientWidth / 420
    const baseViewport = streetScene ? (viewport.clientHeight - 32) / scale : Math.min(680, Math.max(470, viewport.clientHeight - 200))
    const baseScroll = Math.max(0, (baseY - baseViewport) * scale)
    viewport.scrollTo({ top: to === 'top' ? Math.max(0, (baseY - builtHeight) * scale - 170) : baseScroll, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
  }

  const floorSlots = useMemo(() => floorSlotsFromModules(modules, target), [modules, target])
  return (
    <div className={'tower-card' + (streetScene ? ' tower-shared-scene' : '')}>
      <div ref={towerScrollRef} className={'tower-sky stage-' + stage + (canPanVertically ? ' tower-sky-scrollable' : '')} aria-label={'Построено этажей: ' + shown + ' из ' + target}>
        <svg className="city-illustration" viewBox={'0 0 420 ' + worldHeight} width="420" height={worldHeight} role="img" aria-label="Город и растущий небоскрёб">
          <defs>
            <linearGradient id="city-sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={immersive ? '#2538a2' : '#c6d3ff'} />
              <stop offset=".68" stopColor={immersive ? '#6879dc' : '#eaf0ff'} />
              <stop offset="1" stopColor={immersive ? '#f4d7df' : '#ffffff'} />
            </linearGradient>
            <linearGradient id="tower-glass" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#5149db" />
              <stop offset="1" stopColor="#8279ff" />
            </linearGradient>
            <linearGradient id="tower-glass-challenge" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#1599b1" />
              <stop offset="1" stopColor="#55d5d4" />
            </linearGradient>
            <linearGradient id="tower-glass-vip" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#e76778" />
              <stop offset="1" stopColor="#ffae87" />
            </linearGradient>
            <linearGradient id="space-gradient" gradientUnits="userSpaceOnUse" x1="0" y1={Math.max(0, worldHeight - backgroundHeight - 1200)} x2="0" y2={worldHeight - backgroundHeight}>
              <stop offset="0" stopColor="#080d3c" />
              <stop offset=".3" stopColor="#111d68" />
              <stop offset=".58" stopColor="#233b94" />
              <stop offset=".82" stopColor="#3154b7" />
              <stop offset="1" stopColor="#3c63d1" />
            </linearGradient>
            <linearGradient id="star-fade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="white"/><stop offset=".65" stopColor="white"/><stop offset="1" stopColor="black"/></linearGradient>
            <mask id="star-mask" maskContentUnits="objectBoundingBox"><rect width="1" height="1" fill="url(#star-fade)"/></mask>
            <pattern id="space-stars" width="96" height="82" patternUnits="userSpaceOnUse">
              <circle cx="12" cy="16" r="1.05" fill="#ffffff" opacity=".78" />
              <circle cx="46" cy="30" r=".7" fill="#dce6ff" opacity=".68" />
              <circle cx="78" cy="11" r=".85" fill="#ffffff" opacity=".55" />
              <circle cx="27" cy="65" r=".65" fill="#d5ddff" opacity=".62" />
              <circle cx="88" cy="61" r="1.15" fill="#ffffff" opacity=".72" />
              <path d="M62 53v7M58.5 56.5h7" stroke="#eef2ff" strokeWidth=".7" opacity=".65" />
            </pattern>
            <filter id="tower-shadow" x="-.3" y="-.2" width="1.6" height="1.6"><feDropShadow dx="0" dy="6" stdDeviation="5" floodColor="#36418b" floodOpacity=".18" /></filter>
            <linearGradient id="cloud-pearl" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#fff9f5"/><stop offset=".48" stopColor="#e9e2ff"/><stop offset="1" stopColor="#a49bdc" stopOpacity=".12"/></linearGradient>
            <linearGradient id="city-image-fade" x1="0" y1="0" x2="0" y2="1"><stop stopColor="white" stopOpacity="0"/><stop offset=".06" stopColor="white" stopOpacity=".12"/><stop offset=".16" stopColor="white" stopOpacity=".7"/><stop offset=".26" stopColor="white"/></linearGradient>
            <mask id="city-image-mask" maskContentUnits="objectBoundingBox"><rect width="1" height="1" fill="url(#city-image-fade)"/></mask>
            <filter id="cloud-soft" x="-.2" y="-.4" width="1.4" height="1.8"><feGaussianBlur stdDeviation="3"/></filter>
          </defs>
          <rect width="420" height={worldHeight} fill={streetScene ? 'transparent' : '#3c63d1'} />
          <image className="city-background-image" href={CITY_BACKGROUND} x="0" y={worldHeight - backgroundHeight} width="420" height={backgroundHeight} preserveAspectRatio="xMidYMax slice" mask="url(#city-image-mask)" aria-hidden="true" />
          {!streetScene && worldHeight > backgroundHeight && <>
            <rect className="space-gradient" width="420" height={worldHeight - backgroundHeight} fill="url(#space-gradient)" aria-hidden="true" />
            <rect className="space-stars" width="420" height={Math.max(0, worldHeight - backgroundHeight - 600)} fill="url(#space-stars)" mask="url(#star-mask)" aria-hidden="true" />
          </>}
          {!streetScene && <g aria-hidden="true" pointerEvents="none">{[650, 910, 1250].map((altitude, index) => <g key={altitude} transform={`translate(${index % 2 ? 210 : -70},${worldHeight - altitude})`} opacity={index === 1 ? .8 : .56}><g className="pearl-cloud" filter="url(#cloud-soft)"><path d="M-40 100C-52 74-26 51 6 58C12 23 46 14 72 35C91-8 150-9 168 37C201 18 241 45 239 67C285 54 318 86 292 113C241 141 12 142-40 100Z" fill="url(#cloud-pearl)"/><path d="M-20 89C24 72 48 95 89 78S164 58 204 83S258 94 290 88" fill="none" stroke="#fff4f4" strokeWidth="9" opacity=".38"/></g></g>)}</g>}
          <g transform={compact ? `translate(${210 * (1 - overviewScale)} ${baseY * (1 - overviewScale)}) scale(${overviewScale})` : 'translate(-52.5 0) scale(1.25 1)'}>
          {/* PNG centre becomes opaque at row 121/384. Place the floor foot
              inside the slab's top plane, not above its transparent margin. */}
          <ellipse className="foundation-shadow" cx={buildingX + buildingWidth / 2} cy={baseY + (compact ? 11 : 14)} rx={compact ? 69 : 84} ry={compact ? 7 : 10} fill="#101848" opacity=".28" aria-hidden="true" />
          <image className={'tower-foundation ' + (shown === 0 ? 'foundation-empty' : '')} href={FOUNDATION_ASSET} x={buildingX - 29} y={baseY - 34} width="164" height="72" preserveAspectRatio="none" aria-label="Фундамент башни" />
          <g
            className="graphic-building"
            transform="translate(0 6)"
            filter="url(#tower-shadow)"
          >
            {shown > 0 && <rect x={buildingX - 4} y={baseY - builtHeight - 5} width={buildingWidth + 8} height={builtHeight + 9} rx="8" fill="#29356c" opacity=".1" />}
            {Array.from({ length: target }, (_, index) => {
              const slot = floorSlots[index]
              const kind = slot?.kind ?? 'standard'
              const built = index < shown
              const isDamaged = slot?.status === 'repair' || (damaged && index === shown)
              // Do not draw a speculative tower. Only earned floors and the
              // one current repair placeholder belong in the scene.
              if (!built && !isDamaged) return null
              const y = baseY - (index + 1) * (floorHeight + floorGap)
              const spriteHref = WORLD_ASSET_BASE + (kind === 'challenge' ? 'floor-x2-v2.png' : kind === 'vip' ? 'floor-x3-v2.png' : 'floor-standard-v2.png')
              // Repair uses the same artwork and footprint as an earned floor.
              // A separate vector placeholder used to shift its facade and edges.
              const canUseSprite = (built || isDamaged) && !failedSprites.includes(kind)
              return <g key={index} className={'graphic-floor ' + (built ? 'built ' : 'unbuilt ') + kind + (isDamaged ? ' damaged' : '')} transform={`translate(${buildingX},${y})`} style={{ animationDelay: `${index * 35}ms` }}>
                {canUseSprite ? <image href={spriteHref} x={compact ? -8 : -7} y={compact ? -3 : -4} width={compact ? 122 : 120} height={compact ? 28 : 43} preserveAspectRatio="none" aria-hidden="true" onError={() => setFailedSprites((failed) => failed.includes(kind) ? failed : [...failed, kind])} /> : <>
                  <rect width={buildingWidth} height={floorHeight} rx="2" fill={isDamaged ? '#f3b63d' : built ? `url(#tower-glass${kind === 'challenge' ? '-challenge' : kind === 'vip' ? '-vip' : ''})` : '#d7def3'} />
                  <path d={`M${buildingWidth} 0l10 4v${floorHeight - 2}l-10 3z`} fill={isDamaged ? '#c98a25' : built ? '#263f91' : '#bac6e3'} opacity=".8" />
                  <path d={`M7 3h${buildingWidth - 14}`} stroke="#ffffff" strokeOpacity={built ? '.3' : '.5'} strokeWidth="1" />
                  <g className="floor-windows" fill={built ? '#c6f5ff' : '#ffffff'} opacity={built ? '.92' : '.44'}>
                    <rect x="12" y="4" width="11" height="5" rx="1" /><rect x="30" y="4" width="11" height="5" rx="1" /><rect x="48" y="4" width="11" height="5" rx="1" />
                    <rect x="72" y="4" width="11" height="5" rx="1" /><rect x="90" y="4" width="5" height="5" rx="1" />
                  </g>
                  {kind === 'challenge' && <path d={`M68 ${floorHeight - 1}v5h32M75 ${floorHeight + 4}v-5M90 ${floorHeight + 4}v-5`} fill="none" stroke={built ? '#a6ffff' : '#b2bddc'} strokeWidth="2" strokeLinecap="round" />}
                  {kind === 'vip' && <><path d="M34 0h38l-7-7H41z" fill={built ? '#ffca82' : '#c5cde7'} /><path d={`M37 ${floorHeight}h34`} stroke={built ? '#ffe4ac' : '#c5cde7'} strokeWidth="2" /></>}
                </>}
                {isDamaged && <g aria-hidden="true">
                  <rect x="0" y="1" width={buildingWidth} height={floorHeight - 2} fill="#f3b63d" opacity=".2" />
                  <path d={`M40 1L47 ${floorHeight * .3}L41 ${floorHeight * .58}L50 ${floorHeight - 1}M41 ${floorHeight * .58}L32 ${floorHeight * .7}`} fill="none" stroke="#564763" strokeWidth="3" strokeLinejoin="round" />
                  <path d={`M40 1L47 ${floorHeight * .3}L41 ${floorHeight * .58}L50 ${floorHeight - 1}`} fill="none" stroke="#fff0c9" strokeWidth="1.2" strokeLinejoin="round" />
                </g>}
                <title>{`${index + 1} этаж${kind === 'challenge' ? ' · сложное задание ×2' : kind === 'vip' ? ' · мастерский этаж ×3' : ''}${isDamaged ? ' · ждёт ремонта' : ''}`}</title>
              </g>
            })}
            {shown > 0 && <rect x={buildingX + 5} y={baseY - builtHeight - 1} width="7" height={builtHeight - 2} rx="3" fill="#ffffff" opacity=".16" />}
          </g>
          </g>
          {shown > 0 && <g className="city-drone" aria-hidden="true" transform={'translate(0,' + Math.max(0, groundY - 185) + ')'}><path d="M84 125h18M88 121l-4-4M98 121l4-4" stroke="#7f8ab4" strokeWidth="2" strokeLinecap="round" /><circle cx="84" cy="125" r="3" fill="#7f8ab4" /><circle cx="102" cy="125" r="3" fill="#7f8ab4" /></g>}
        </svg>
        {canPanVertically && <div className="tower-camera-controls" aria-label="Обзор башни"><button type="button" onClick={() => moveCamera('top')} aria-label="Перейти к вершине">↑ <span>К вершине</span></button><button type="button" onClick={() => moveCamera('base')} aria-label="Перейти к основанию">↓ <span>К основанию</span></button></div>}
      </div>
      <div className="tower-caption"><strong>{shown} / {target} этажей</strong><span>{damaged ? 'Есть этажи в ремонте' : 'Строим путь к небу'}</span></div>
    </div>
  )
}

function CityStreet({ progress, repairCount }: { progress: Progress; repairCount: number }) {
  const streetRef = useRef<HTMLDivElement>(null)
  const [page, setPage] = useState(0)

  function moveStreet(direction: number) {
    const viewport = streetRef.current
    if (!viewport) return
    viewport.scrollBy({ left: direction * viewport.clientWidth, behavior: 'smooth' })
  }

  return (
    <section className="city-street" aria-label="Город знаний">
      <div className="street-heading"><span><strong>Твой город</strong><small>Район русского языка</small></span><span className="street-count">3 темы · 1 здание растёт</span></div>
      <div ref={streetRef} className="street-viewport" tabIndex={0} aria-label="Улица с учебными зданиями" onScroll={(event) => setPage(Math.round(event.currentTarget.scrollLeft / event.currentTarget.clientWidth))}>
        <div className="street-world" style={{ backgroundImage: `url(${CITY_STREET_BACKGROUND})` }}>
          <article className="street-building-slot active" aria-label="Проверяемые гласные">
            <Tower floors={progress.floors} target={progress.targetFloors} damaged={repairCount > 0} modules={progress.modules} streetScene />
            <StreetBuildingCaption title="Проверяемые гласные в корне" floors={progress.floors} target={progress.targetFloors} />
          </article>
          <StreetFutureBuilding title="Парные согласные" />
          <StreetFutureBuilding title="Части речи" />
        </div>
      </div>
      <div className="street-navigation">
        <button type="button" disabled={page === 0} onClick={() => moveStreet(-1)} aria-label="Предыдущее здание">←</button>
        <span aria-live="polite">{page + 1} / 3 · Листай улицу</span>
        <button type="button" disabled={page === 2} onClick={() => moveStreet(1)} aria-label="Следующее здание">→</button>
      </div>
    </section>
  )
}

function StreetBuildingCaption({ title, floors, target }: { title: string; floors: number; target?: number }) {
  return <div className="street-building-caption"><span>Русский язык{target ? '' : ' · скоро'}</span><strong>{title}</strong><small aria-label={`${floors} этажей построено${target ? ` из ${target}` : ''}`}>{target ? `${floors} / ${target}` : floors}<span>этажей</span></small></div>
}

function StreetFutureBuilding({ title }: { title: string }) {
  return <article className="street-building-slot future active" aria-label={title + ' · скоро откроется'}>
    <Tower floors={0} target={1} streetScene />
    <span className="street-lot-art" aria-hidden="true"><span className="street-lot-plus">＋</span></span>
    <StreetBuildingCaption title={title} floors={0} />
  </article>
}

function Home({ progress, repairCount, mastered, onStart, onOpenEnglish }: { progress: Progress; repairCount: number; mastered: boolean; onStart: () => void; onOpenEnglish: () => void }) {
  return (
    <main className="screen home-screen">
      <section className="hero planet-hero" style={{ backgroundImage: `linear-gradient(90deg, #101c50ed, #2536728a), url(${CITY_BACKGROUND})` }}><p className="eyebrow">ТВОЯ ПЛАНЕТА ВОЗМОЖНОСТЕЙ</p><h1>Строй. Играй.<br /><em>Учись.</em></h1><p className="hero-copy">Строй свой город.<br />Улучшай знания.</p><span className="hero-orbit" aria-hidden="true">5<span>+</span></span></section>
      <CityStreet progress={progress} repairCount={repairCount} />
      <section className="topic-card"><div><span className="topic-icon">А</span><div><strong>Проверяемые гласные</strong><small>Русский язык · 5–8 минут</small></div></div><span className={'status-pill ' + (mastered ? 'done' : '')}>{mastered ? 'Освоено' : repairCount ? repairCount + ' в ремонте' : 'В работе'}</span></section>
      <button className="primary-button start-button" onClick={onStart}>{repairCount ? 'Начать ремонт' : mastered ? 'Потренироваться ещё' : progress.floors ? 'Продолжить стройку' : 'Начать игру'} <span>→</span></button>
      <section className="district-preview" aria-label="Районы знаний"><p className="eyebrow">ДАЛЬШЕ — БОЛЬШЕ</p><h2>Новые районы</h2><p>Другой пейзаж. Новая коллекция. Та же понятная механика.</p><div className="district-preview-grid"><button className="district-card english" type="button" onClick={onOpenEnglish}><span aria-hidden="true">EN</span><strong>English</strong><small>Shopping Mall · открыт</small></button><article><span aria-hidden="true">∑</span><strong>Математика</strong><small>Научная набережная · скоро</small></article></div></section>
    </main>
  )
}

function ProductIcon({ kind, emoji }: { kind?: string; emoji: string }) {
  const common = { viewBox: '0 0 24 24', role: 'presentation' as const, focusable: false as const }
  if (kind === 'tshirt') return <svg {...common}><path d="M8 3 4 5 2 10l4 2v9h12v-9l4-2-2-5-4-2c-.5 1.7-1.8 2.5-4 2.5S8.5 4.7 8 3Z" /></svg>
  if (kind === 'skirt') return <svg {...common}><path d="M8 3h8l3.2 18H4.8L8 3Z" /><path className="detail" d="M7.5 8h9M10 8 8.5 20M14 8l1.5 12" /></svg>
  if (kind === 'jeans') return <svg {...common}><path d="M7 2h10l1 20h-5l-1-12-1 12H6L7 2Z" /><path className="detail" d="M7 7h10M12 2v8" /></svg>
  if (kind === 'dress') return <svg {...common}><path d="M9 2h6l1 6 4 13H4L8 8l1-6Z" /><path className="detail" d="M8 8h8M10 2c0 2.5 4 2.5 4 0" /></svg>
  if (kind === 'coat' || kind === 'jacket') return <svg {...common}><path d="m8 3-4 3-2 8 4 1v7h12v-7l4-1-2-8-4-3c-.8 1.3-2.1 2-4 2s-3.2-.7-4-2Z" /><path className="detail" d="M12 5v17M7 13h3M14 13h3" /></svg>
  if (kind === 'sweater') return <svg {...common}><path d="m8 3-5 3-2 8 4 1 1-4v11h12V11l1 4 4-1-2-8-5-3c-.6 1.5-1.9 2.2-4 2.2S8.6 4.5 8 3Z" /><path className="detail" d="M7 10h10M7 16h10M10 3c.3 2.2 3.7 2.2 4 0" /></svg>
  if (kind === 'hat') return <svg {...common}><path d="M7 15c.7-7 2.2-11 5-11s4.3 4 5 11H7Z" /><path d="M3 15h18c1.1 0 2 .9 2 2s-.9 2-2 2H3c-1.1 0-2-.9-2-2s.9-2 2-2Z" /></svg>
  if (kind === 'trainers') return <svg {...common}><path d="M4 6h6c1.5 4.8 4.6 7.4 9.5 8 1.7.2 2.5 1.3 2.5 3v2H3c-1.2 0-2-.8-2-2 0-2 1.1-4 3-6V6Z" /><path className="detail" d="M3 15h18M9 9l-3 2m5 0-3 2" /></svg>
  if (kind === 'boots') return <svg {...common}><path d="M5 2h9v11c1.5 1.7 3.5 2.7 6 3 1.3.2 2 .9 2 2v3H4c-1.3 0-2-.7-2-2v-3l3-4V2Z" /><path className="detail" d="M5 12h9M4 17h17" /></svg>
  if (kind === 'socks') return <svg {...common}><path d="M7 2h8v11l-4 7c-.8 1.4-2.8 2.1-4.2 1.3l-2.4-1.4c-1.4-.8-1.8-2.6-.8-3.9L7 12V2Z" /><path className="detail" d="M7 7h8M5 15l6 4" /></svg>
  return <span className="product-emoji">{emoji}</span>
}

function BasketStack({ progress, topicId, immersive = false }: { progress: Progress; topicId: EnglishTopicId; immersive?: boolean }) {
  const pool = englishExercisesFor(topicId)
  const items = progress.modules.flatMap((module) => {
    const exercise = pool.find((candidate) => candidate.id === module.exerciseId)
    const reward = exercise?.rewardItem ?? { emoji: '🛍️', label: 'new item', color: '#8873f5' }
    return Array.from({ length: module.units }, (_, unit) => ({
      id: `${module.id}-${unit}`,
      ...reward,
      damaged: module.status === 'repair',
      level: module.level,
    }))
  }).slice(0, progress.targetFloors)
  return <section className={'basket-scene ' + (immersive ? 'immersive' : '')} style={{ backgroundImage: `linear-gradient(180deg, #17205238, #17205288), url(${MALL_BACKGROUND})` }} aria-label={`Корзина: ${progress.floors} из ${progress.targetFloors} товаров`}>
    <div className="mall-light" aria-hidden="true" />
    <div className="basket-stack" aria-hidden="true">
      <div className="basket-items">{items.map((item, index) => <span key={item.id} className={'basket-item ' + (item.damaged ? 'damaged ' : '') + (item.level === 2 ? 'challenge' : '')} style={{ '--item-color': item.color, '--item-index': index } as CSSProperties} title={item.label}><b><ProductIcon kind={item.kind} emoji={item.emoji} /></b>{item.level === 2 && <i>×2</i>}</span>)}</div>
      {!items.length && <div className="basket-empty"><span>＋</span><small>Первый товар<br />ждёт тебя</small></div>}
      <div className="basket-handle" />
      <div className="basket-body"><span /><span /><span /><span /></div>
      <div className="basket-wheels"><i /><i /></div>
    </div>
    {!immersive && <div className="basket-caption"><strong>{progress.floors} / {progress.targetFloors}</strong><span>{repairExerciseIds(progress, pool).length ? 'Есть товары для проверки' : 'товаров собрано'}</span></div>}
  </section>
}

function MallStreet({ progress, onStart }: { progress: Record<EnglishTopicId, Progress>; onStart: (topicId: EnglishTopicId) => void }) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const [page, setPage] = useState(0)
  function move(direction: number) {
    const viewport = viewportRef.current
    if (!viewport) return
    const nextPage = Math.max(0, Math.min(englishTopics.length - 1, page + direction))
    setPage(nextPage)
    const targetLeft = nextPage === englishTopics.length - 1
      ? viewport.scrollWidth - viewport.clientWidth
      : nextPage * viewport.clientWidth
    viewport.scrollTo({ left: targetLeft, behavior: 'smooth' })
  }
  return <section className="mall-street" aria-label="Бутики English">
    <div className="mall-heading"><span><strong>Shopping Mall</strong><small>Выбери бутик и собери корзину</small></span><span className="mall-count">{englishTopics.length} бутика открыты</span></div>
    <div ref={viewportRef} className="mall-viewport" onScroll={(event) => setPage(Math.round(event.currentTarget.scrollLeft / event.currentTarget.clientWidth))}>
      <div className="mall-world" style={{ width: `${englishTopics.length * 100}%`, backgroundImage: `url(${MALL_BACKGROUND})` }}>
        {englishTopics.map((topic) => {
          const topicProgress = progress[topic.id]
          const repairs = repairExerciseIds(topicProgress, englishExercisesFor(topic.id)).length
          return <button key={topic.id} className="boutique-slot" type="button" onClick={() => onStart(topic.id)}>
            <span className="boutique-sign" style={{ '--boutique-accent': topic.accent } as CSSProperties}><b>{topic.icon} {topic.title}</b><small>{topic.subtitle}</small></span>
            <span className="boutique-progress"><b>{topicProgress.floors} / {topicProgress.targetFloors}</b><small>{repairs ? `${repairs} на проверке` : 'товаров в корзине'}</small></span>
          </button>
        })}
      </div>
    </div>
    <div className="street-navigation mall-navigation"><button type="button" disabled={page === 0} onClick={() => move(-1)}>←</button><span>{page + 1} / {englishTopics.length} · Листай галерею</span><button type="button" disabled={page === englishTopics.length - 1} onClick={() => move(1)}>→</button></div>
  </section>
}

function EnglishHome({ progress, onBack, onStart }: { progress: Record<EnglishTopicId, Progress>; onBack: () => void; onStart: (topicId: EnglishTopicId) => void }) {
  const collected = Object.values(progress).reduce((sum, item) => sum + item.floors, 0)
  return <main className="screen english-home">
    <button className="back-link" type="button" onClick={onBack}>← На главную</button>
    <section className="english-hero" style={{ backgroundImage: `linear-gradient(100deg, #151b53eb, #5e3e8088), url(${MALL_BACKGROUND})` }}><p className="eyebrow">ENGLISH DISTRICT</p><h1>Shop.<br /><em>Speak.</em></h1><p>Выбирай слова и фразы — каждый верный ответ добавляет товар в корзину.</p><span>{collected} {productLabel(collected)}</span></section>
    <MallStreet progress={progress} onStart={onStart} />
    <section className="english-method"><strong>Как играем</strong><div><span><b>4</b> быстрых перевода</span><span><b>1</b> предложение ×2</span><span><b>↺</b> трудные товары вернутся</span></div></section>
  </main>
}

function Prompt({ exercise }: { exercise: Exercise }) {
  if (exercise.taskType === 'translation-choice' || exercise.taskType === 'sentence-choice') {
    return <span className="translation-prompt" lang="ru">{exercise.prompt}</span>
  }
  if (exercise.level !== 1) return <>{exercise.prompt}</>
  // Инструкция уже показана отдельной строкой выше. В карточке оставляем
  // только само слово, чтобы длинный текст не раздвигал части вокруг пропуска.
  const [before, after] = exercise.targetWord.replace(exercise.testedLetter, '_').split('_')
  return <>{before}<span className="missing-letter" aria-label="пропущенная буква">_</span>{after}</>
}

function SentenceWords({ exercise, selected, onSelect }: { exercise: Exercise; selected: string; onSelect: (word: string) => void }) {
  return <p className="sentence" aria-label="Предложение с ошибкой">{(exercise.sentence ?? '').split(/(\s+)/).map((part, index) => {
    if (/^\s+$/.test(part)) return part
    const clean = part.replace(/[.,!?;:]/g, '')
    const isSelected = clean === selected
    return <button key={index} type="button" className={'sentence-word ' + (isSelected ? 'selected' : '')} onClick={() => onSelect(clean)}>{part}</button>
  })}</p>
}

function Play(props: { mode: GameMode; exercise: Exercise; progress: Progress; sessionCount: number; sessionFloors: number; lastRepair: boolean; word: string; selectedErrorWord: string; feedback: Feedback; hintIndex: number; confidence: 'sure' | 'unsure' | null; onWordChange: (value: string) => void; onSelectedErrorWord: (value: string) => void; onNeedHint: () => void; onSubmit: () => void; onReveal: () => void; onNext: () => void; onFinish: () => void }) {
  const { mode, exercise, progress, sessionCount, sessionFloors, lastRepair, word, selectedErrorWord, feedback, hintIndex } = props
  const isEnglish = mode === 'english'
  const [viewingTower, setViewingTower] = useState(false)
  const exerciseCardRef = useRef<HTMLElement>(null)
  const [questionHeight, setQuestionHeight] = useState<number>()
  useLayoutEffect(() => {
    const card = exerciseCardRef.current
    if (!card || feedback || viewingTower) return
    const rememberHeight = () => {
      const height = card.getBoundingClientRect().height
      if (height > 0) setQuestionHeight(height)
    }
    rememberHeight()
    const observer = new ResizeObserver(rememberHeight)
    observer.observe(card)
    return () => observer.disconnect()
  }, [exercise.id, feedback, viewingTower])
  useEffect(() => { setViewingTower(false) }, [exercise.id])
  const choices = useMemo(
    () => shuffleChoices(
      isEnglish ? exercise.choices ?? [] : letterChoices(exercise.testedLetter),
      exercise.id,
      isEnglish ? exercise.acceptedAnswers.word[0] : exercise.testedLetter,
    ),
    [exercise.id, exercise.testedLetter, exercise.choices, isEnglish],
  )
  const canSubmit = isEnglish ? Boolean(word) : exercise.level === 1 ? Boolean(word) : Boolean(selectedErrorWord && word)
  const instruction = isEnglish
    ? exercise.level === 1 ? 'Выбери перевод' : 'Выбери английское предложение'
    : exercise.level === 1 ? 'Вставь пропущенную букву' : selectedErrorWord ? 'Исправь найденное слово' : 'Нажми на слово с ошибкой'
  return (
    <main className={'screen play-screen immersive-play ' + (isEnglish ? 'english-play' : '')}>
      <div className="play-world">{isEnglish ? <BasketStack progress={progress} topicId={exercise.topicId as EnglishTopicId} immersive /> : <Tower floors={progress.floors} target={progress.targetFloors} damaged={lastRepair} modules={progress.modules} immersive />}</div>
      <div className="play-overlay">
        <div className="play-top"><button className="close-button" onClick={props.onFinish} aria-label="Закончить">×</button><div className="session-progress"><span style={{ width: Math.min(100, sessionCount * 10) + '%' }} /></div><span className="floor-counter">+{sessionFloors} {isEnglish ? productLabel(sessionFloors) : floorLabel(sessionFloors)}</span></div>
        {lastRepair && <div className="repair-banner"><span aria-hidden="true">🔧</span><div><strong>{isEnglish ? 'Проверяем знакомый товар' : 'Чиним знакомый этаж'}</strong><small>{isEnglish ? 'Вернёмся к фразе, которая была трудной.' : 'Вернёмся к слову, которое было трудным.'}</small></div></div>}
        <button className="scene-toggle" type="button" aria-expanded={!viewingTower} aria-controls="active-exercise" onClick={() => setViewingTower((value) => !value)}>{viewingTower ? 'Вернуться к заданию' : isEnglish ? 'Рассмотреть корзину' : 'Рассмотреть башню'} <span aria-hidden="true">{viewingTower ? '↩' : '⤢'}</span></button>
        <section ref={exerciseCardRef} id="active-exercise" hidden={viewingTower} style={{ minHeight: feedback ? questionHeight : undefined }} className={'exercise-card level-' + exercise.level + (feedback ? ' has-feedback feedback-state-' + feedback : '')}>
        <div className="level-label">УРОВЕНЬ ×{exercise.level} <span>{exercise.level === 1 ? 'разминка' : isEnglish ? 'фраза в контексте' : 'найди ошибку'}</span></div>
        {feedback === 'correct' && sessionCount > 0 && sessionCount % 10 === 0 && <p className="session-milestone">{sessionCount} заданий выполнено · +{sessionFloors} {isEnglish ? productLabel(sessionFloors) : floorLabel(sessionFloors)}. Можно продолжить или сделать перерыв кнопкой ×.</p>}
        {(feedback === 'correct' || feedback === 'revealed') && <h2 className="result-word">{exercise.targetWord}</h2>}
        <div className="exercise-inputs" hidden={feedback === 'correct' || feedback === 'revealed'}>
        <p className="task-instruction">{instruction}</p>
        {(exercise.level === 1 || isEnglish) && <h2 className={'word-display ' + (isEnglish ? 'english-question' : '')}><Prompt exercise={exercise} /></h2>}
        {exercise.level === 2 && !isEnglish && <SentenceWords exercise={exercise} selected={selectedErrorWord} onSelect={props.onSelectedErrorWord} />}
        {(exercise.level === 1 || isEnglish) && <div className={'choice-grid ' + (isEnglish ? 'english-choices' : '')}>{choices.map((choice) => <button key={choice} type="button" lang={isEnglish ? 'en' : undefined} className={'choice ' + (word === choice ? 'selected' : '')} onClick={() => props.onWordChange(choice)}>{choice}</button>)}</div>}
        {exercise.level === 2 && !isEnglish && selectedErrorWord && <div className="answer-fields"><label>Исправленное слово<input value={word} onChange={(event) => props.onWordChange(event.target.value)} autoCapitalize="none" autoCorrect="off" /></label></div>}
        <div className="hint-row"><button type="button" className="hint-button" onClick={props.onNeedHint}>💡 Нужна подсказка</button>{hintIndex >= 0 && !feedback && <span>Подсказка {hintIndex + 1} из {exercise.hintSteps.length}: {exercise.hintSteps[hintIndex]}</span>}</div>
        </div>
        <div aria-live="polite">
          {feedback && <div className={'feedback ' + (feedback === 'correct' ? 'feedback-good' : 'feedback-help')}><div className="feedback-title">{feedback === 'correct' ? isEnglish ? 'Отлично, товар в корзине!' : 'Отлично, этаж построен!' : feedback === 'revealed' ? 'Вот как запомнить' : isEnglish ? 'Почти — проверим товар' : 'Почти — давай починим этаж'}</div><p>{exercise.explanation}</p>{hintIndex >= 0 && feedback !== 'correct' && <p className="hint">Подсказка: {exercise.hintSteps[hintIndex]}</p>}{feedback === 'repair' && <button className="text-button" onClick={props.onReveal}>Показать подсказку</button>}{feedback === 'revealed' && <button className="text-button" onClick={props.onReveal}>{isEnglish ? 'Понятно, добавить товар' : 'Понятно, восстановить этаж'}</button>}</div>}
        </div>
        {!feedback && <button className="primary-button answer-button" disabled={!canSubmit} onClick={props.onSubmit}>Проверить ответ <span>✓</span></button>}
        {!feedback && exercise.level === 2 && !isEnglish && !selectedErrorWord && <p className="select-error-note">Сначала выбери слово — потом появится поле для исправления.</p>}
        {feedback === 'repair' && <button className="secondary-button retry-button" onClick={props.onSubmit}>Проверить исправление</button>}
        {feedback === 'correct' && <button className="primary-button answer-button" onClick={props.onNext}>Следующее задание <span>→</span></button>}
        </section>
      </div>
    </main>
  )
}

function Summary({ mode, topicId: selectedTopicId, progress, sessionFloors, mastered, onAgain, onHome }: { mode: GameMode; topicId?: EnglishTopicId; progress: Progress; sessionFloors: number; mastered: boolean; onAgain: () => void; onHome: () => void }) {
  const english = mode === 'english'
  const topicId = selectedTopicId ?? englishTopics.find((topic) => progress.attempts.at(-1)?.exerciseId.includes(topic.id))?.id ?? englishTopics[0].id
  const repairs = repairExerciseIds(progress, english ? englishExercisesFor(topicId) : exercises).length
  return <main className={'screen summary-screen ' + (english ? 'english-summary' : '')}><div className="summary-icon">{mastered ? '★' : english ? '🛍️' : '✦'}</div><p className="eyebrow">СЕССИЯ ЗАВЕРШЕНА</p><h1>{mastered ? 'Тема освоена!' : english ? 'Корзина полнее!' : 'Башня растёт!'}</h1><p className="summary-copy">{mastered ? english ? 'Ты уверенно узнаёшь слова и фразы в контексте.' : 'Ты научился доказывать написание слов.' : english ? 'Каждый выбранный перевод превращается в полезную языковую привычку.' : 'Каждая попытка делает следующий этаж крепче.'}</p>{english ? <BasketStack progress={progress} topicId={topicId} /> : <Tower floors={progress.floors} target={progress.targetFloors} damaged={repairs > 0} modules={progress.modules} />}<div className="result-grid"><div><strong>+{sessionFloors}</strong><small>{english ? `${productLabel(sessionFloors)} сегодня` : `${floorLabel(sessionFloors)} сегодня`}</small></div><div><strong>{repairs}</strong><small>{english ? 'на проверке' : 'этажей в ремонте'}</small></div><div><strong>{progress.attempts.length}</strong><small>попыток всего</small></div></div><button className="primary-button start-button" onClick={onAgain}>Ещё одна короткая игра <span>→</span></button><button className="secondary-button" onClick={onHome}>{english ? 'К бутикам' : 'На главную'}</button></main>
}

function Parent({ progress, onBack, onReset, onExport, onImport }: { progress: Progress; onBack: () => void; onReset: () => void; onExport: () => void; onImport: (file: File) => void }) {
  const [confirmReset, setConfirmReset] = useState(false)
  const independent = progress.attempts.filter((attempt) => attempt.firstAnswerCorrect && attempt.hintsUsed === 0).length
  const repairs = repairExerciseIds(progress).length
  return <main className="screen parent-screen"><button className="back-link" onClick={onBack}>← На главную</button><p className="eyebrow">КАБИНЕТ ВЗРОСЛОГО</p><h1>Как идёт обучение</h1><div className="parent-stat"><strong>{progress.floors} / {progress.targetFloors}</strong><span>этажей построено</span><div className="bar"><i style={{ width: Math.min(100, progress.floors / progress.targetFloors * 100) + '%' }} /></div></div><div className="stats-list"><div><span>Самостоятельные ответы</span><strong>{independent}</strong></div><div><span>Всего попыток</span><strong>{progress.attempts.length}</strong></div><div><span>Требуют ремонта</span><strong>{repairs}</strong></div><div><span>Сессий</span><strong>{progress.sessionsCompleted}</strong></div></div><p className="parent-note">Башня показывает игровой прогресс. Статус «тема освоена» появляется только после повторных самостоятельных проверок в разные дни.</p><div className="data-actions"><button className="secondary-button" onClick={onExport}>Скачать прогресс</button><label className="secondary-button file-button">Загрузить прогресс<input type="file" accept="application/json,.json" onChange={(event) => { const file = event.target.files?.[0]; if (file) onImport(file); event.currentTarget.value = '' }} /></label></div><button className="secondary-button danger-button" onClick={() => setConfirmReset(true)}>Удалить локальный прогресс</button>{confirmReset && <section className="reset-confirmation" role="alert" aria-label="Подтверждение сброса"><p>Начать с нуля? Все этажи, ответы и история повторений на этом устройстве будут удалены.</p><button className="secondary-button danger-button" onClick={onReset}>Да, начать с начала</button><button className="secondary-button" onClick={() => setConfirmReset(false)}>Оставить прогресс</button></section>}</main>
}

export default App
