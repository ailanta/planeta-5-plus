import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { exercises, totalFloorCapacity } from './content'
import { answerIsCorrect, applyAttempt, chooseExercise, createAttempt, floorRewardForAttempt, repairExerciseIds, topicMastery, letterChoices } from './game'
import { clearProgress, loadProgress, migrateProgress, requestPersistentStorage, saveProgress } from './storage'
import { initialProgress, type BuildingModule, type Exercise, type Progress } from './types'
import { floorSlotsFromModules, layoutBuilding, stageForProgress } from './world'

type Screen = 'home' | 'play' | 'summary' | 'parent'
type Feedback = 'correct' | 'repair' | 'revealed' | null
const WORLD_ASSET_BASE = `${import.meta.env.BASE_URL}assets/world/russian/`
const WORLD_ASSET_ROOT = `${import.meta.env.BASE_URL}assets/world/`
// Plaza scene: the foreground is a quiet building site rather than a roadway,
// so the foundation has a clear visual place to stand.  The same scene is used
// for the horizontal street so the world does not switch back to asphalt.
const CITY_BACKGROUND = WORLD_ASSET_ROOT + 'city-background-plaza-v1.jpg'
const CITY_STREET_BACKGROUND = WORLD_ASSET_ROOT + 'city-street-continuous-v2.png'
const FOUNDATION_ASSET = WORLD_ASSET_ROOT + 'russian/foundation-v1.png'

function floorLabel(count: number): string {
  const mod10 = count % 10
  const mod100 = count % 100
  if (mod10 === 1 && mod100 !== 11) return 'этаж'
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'этажа'
  return 'этажей'
}

function App() {
  const [progress, setProgress] = useState<Progress>({ ...initialProgress, targetFloors: totalFloorCapacity })
  const [screen, setScreen] = useState<Screen>('home')
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

  useEffect(() => {
    loadProgress().then((stored) => {
      if (stored) setProgress(stored)
      setLoading(false)
      requestPersistentStorage()
    })
  }, [])

  useEffect(() => {
    if (!loading) void saveProgress(progress)
  }, [progress, loading])

  useEffect(() => {
    progressRef.current = progress
  }, [progress])

  const mastered = useMemo(() => topicMastery(progress), [progress])
  const repairCount = repairExerciseIds(progress).length
  const sessionFloors = Math.max(0, progress.floors - sessionStartFloors)

  function beginSession() {
    const id = crypto.randomUUID?.() ?? String(Date.now())
    setSessionId(id)
    setSessionCount(0)
    setSessionExerciseIds([])
    sessionExerciseIdsRef.current = []
    setSessionStartFloors(progress.floors)
    setScreen('play')
    loadNext(progressRef.current, [], id)
  }

  function loadNext(current: Progress, excluded: string[], id = sessionId) {
    const next = chooseExercise(current, Date.now(), excluded)
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
    setLastRepair(repairExerciseIds(current).includes(next.id))
    if (!id) setSessionId(crypto.randomUUID?.() ?? String(Date.now()))
  }

  function commitAttempt(finalCorrect: boolean, initiallyCorrect: boolean) {
    if (!exercise) return
    const attempt = createAttempt(exercise, sessionId, initiallyCorrect, finalCorrect, hintsUsed, confidence)
    setProgress((current) => {
      const updated = applyAttempt(current, attempt)
      const reward = floorRewardForAttempt(current, attempt)
      if (reward > 0) updated.floors = Math.min(updated.targetFloors, updated.floors + reward)
      return updated
    })
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
    setProgress((current) => ({ ...current, sessionsCompleted: current.sessionsCompleted + 1 }))
    setScreen('summary')
  }

  async function resetAll() {
    await clearProgress()
    const fresh = { ...initialProgress, targetFloors: totalFloorCapacity }
    progressRef.current = fresh
    sessionExerciseIdsRef.current = []
    setProgress(fresh)
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
      {screen === 'home' && <Home progress={progress} repairCount={repairCount} mastered={mastered} onStart={beginSession} />}
      {screen === 'play' && exercise && <Play exercise={exercise} progress={progress} sessionCount={sessionCount} sessionFloors={sessionFloors} lastRepair={lastRepair} word={word} selectedErrorWord={selectedErrorWord} feedback={feedback} hintIndex={hintIndex} confidence={confidence} onWordChange={setWord} onSelectedErrorWord={setSelectedErrorWord} onNeedHint={requestHint} onSubmit={submit} onReveal={revealAndContinue} onNext={nextExercise} onFinish={finishSession} />}
      {screen === 'summary' && <Summary progress={progress} sessionFloors={sessionFloors} mastered={mastered} onAgain={beginSession} onHome={() => setScreen('home')} />}
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
    viewport.scrollTo({ left: Math.max(0, Math.min(2, page + direction)) * viewport.clientWidth, behavior: 'smooth' })
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

function Home({ progress, repairCount, mastered, onStart }: { progress: Progress; repairCount: number; mastered: boolean; onStart: () => void }) {
  return (
    <main className="screen home-screen">
      <section className="hero planet-hero" style={{ backgroundImage: `linear-gradient(90deg, #101c50ed, #2536728a), url(${CITY_BACKGROUND})` }}><p className="eyebrow">ТВОЯ ПЛАНЕТА ВОЗМОЖНОСТЕЙ</p><h1>Строй. Играй.<br /><em>Учись.</em></h1><p className="hero-copy">Строй свой город.<br />Улучшай знания.</p><span className="hero-orbit" aria-hidden="true">5<span>+</span></span></section>
      <CityStreet progress={progress} repairCount={repairCount} />
      <section className="topic-card"><div><span className="topic-icon">А</span><div><strong>Проверяемые гласные</strong><small>Русский язык · 5–8 минут</small></div></div><span className={'status-pill ' + (mastered ? 'done' : '')}>{mastered ? 'Освоено' : repairCount ? repairCount + ' в ремонте' : 'В работе'}</span></section>
      <button className="primary-button start-button" onClick={onStart}>{repairCount ? 'Начать ремонт' : mastered ? 'Потренироваться ещё' : progress.floors ? 'Продолжить стройку' : 'Начать игру'} <span>→</span></button>
      <section className="district-preview" aria-label="Будущие районы"><p className="eyebrow">ДАЛЬШЕ — БОЛЬШЕ</p><h2>Новые районы</h2><p>Другой пейзаж. Новые здания. Ещё больше открытий.</p><div className="district-preview-grid"><article><span aria-hidden="true">∑</span><strong>Математика</strong><small>Научная набережная · скоро</small></article><article><span aria-hidden="true">✳</span><strong>Окружающий мир</strong><small>Зелёный квартал · скоро</small></article></div></section>
    </main>
  )
}

function Prompt({ exercise }: { exercise: Exercise }) {
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

function Play(props: { exercise: Exercise; progress: Progress; sessionCount: number; sessionFloors: number; lastRepair: boolean; word: string; selectedErrorWord: string; feedback: Feedback; hintIndex: number; confidence: 'sure' | 'unsure' | null; onWordChange: (value: string) => void; onSelectedErrorWord: (value: string) => void; onNeedHint: () => void; onSubmit: () => void; onReveal: () => void; onNext: () => void; onFinish: () => void }) {
  const { exercise, progress, sessionCount, sessionFloors, lastRepair, word, selectedErrorWord, feedback, hintIndex } = props
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
  const letters = letterChoices(exercise.testedLetter)
  const canSubmit = exercise.level === 1 ? Boolean(word) : Boolean(selectedErrorWord && word)
  const instruction = exercise.level === 1 ? 'Вставь пропущенную букву' : selectedErrorWord ? 'Исправь найденное слово' : 'Нажми на слово с ошибкой'
  return (
    <main className="screen play-screen immersive-play">
      <div className="play-world"><Tower floors={progress.floors} target={progress.targetFloors} damaged={lastRepair} modules={progress.modules} immersive /></div>
      <div className="play-overlay">
        <div className="play-top"><button className="close-button" onClick={props.onFinish} aria-label="Закончить">×</button><div className="session-progress"><span style={{ width: Math.min(100, sessionCount * 10) + '%' }} /></div><span className="floor-counter">+{sessionFloors} {floorLabel(sessionFloors)}</span></div>
        {lastRepair && <div className="repair-banner"><span aria-hidden="true">🔧</span><div><strong>Чиним знакомый этаж</strong><small>Вернёмся к слову, которое было трудным.</small></div></div>}
        <button className="scene-toggle" type="button" aria-expanded={!viewingTower} aria-controls="active-exercise" onClick={() => setViewingTower((value) => !value)}>{viewingTower ? 'Вернуться к заданию' : 'Рассмотреть башню'} <span aria-hidden="true">{viewingTower ? '↩' : '⤢'}</span></button>
        <section ref={exerciseCardRef} id="active-exercise" hidden={viewingTower} style={{ minHeight: feedback ? questionHeight : undefined }} className={'exercise-card level-' + exercise.level + (feedback ? ' has-feedback feedback-state-' + feedback : '')}>
        <div className="level-label">УРОВЕНЬ ×{exercise.level} <span>{exercise.level === 1 ? 'разминка' : 'найди ошибку'}</span></div>
        {feedback === 'correct' && sessionCount > 0 && sessionCount % 10 === 0 && <p className="session-milestone">{sessionCount} заданий выполнено · +{sessionFloors} этажей. Можно продолжить или сделать перерыв кнопкой ×.</p>}
        {(feedback === 'correct' || feedback === 'revealed') && <h2 className="result-word">{exercise.targetWord}</h2>}
        <div className="exercise-inputs" hidden={feedback === 'correct' || feedback === 'revealed'}>
        <p className="task-instruction">{instruction}</p>
        {exercise.level === 1 && <h2 className="word-display"><Prompt exercise={exercise} /></h2>}
        {exercise.level === 2 && <SentenceWords exercise={exercise} selected={selectedErrorWord} onSelect={props.onSelectedErrorWord} />}
        {exercise.level === 1 && <div className="choice-grid">{letters.map((letter) => <button key={letter} type="button" className={'choice ' + (word === letter ? 'selected' : '')} onClick={() => props.onWordChange(letter)}>{letter}</button>)}</div>}
        {exercise.level === 2 && selectedErrorWord && <div className="answer-fields"><label>Исправленное слово<input value={word} onChange={(event) => props.onWordChange(event.target.value)} autoCapitalize="none" autoCorrect="off" /></label></div>}
        <div className="hint-row"><button type="button" className="hint-button" onClick={props.onNeedHint}>💡 Нужна подсказка</button>{hintIndex >= 0 && !feedback && <span>Подсказка {hintIndex + 1} из {exercise.hintSteps.length}: {exercise.hintSteps[hintIndex]}</span>}</div>
        </div>
        <div aria-live="polite">
          {feedback && <div className={'feedback ' + (feedback === 'correct' ? 'feedback-good' : 'feedback-help')}><div className="feedback-title">{feedback === 'correct' ? 'Отлично, этаж построен!' : feedback === 'revealed' ? 'Вот как проверить' : 'Почти — давай починим этаж'}</div><p>{exercise.explanation}</p>{hintIndex >= 0 && feedback !== 'correct' && <p className="hint">Подсказка: {exercise.hintSteps[hintIndex]}</p>}{feedback === 'repair' && <button className="text-button" onClick={props.onReveal}>Показать способ проверки</button>}{feedback === 'revealed' && <button className="text-button" onClick={props.onReveal}>Понятно, восстановить этаж</button>}</div>}
        </div>
        {!feedback && <button className="primary-button answer-button" disabled={!canSubmit} onClick={props.onSubmit}>Проверить ответ <span>✓</span></button>}
        {!feedback && exercise.level === 2 && !selectedErrorWord && <p className="select-error-note">Сначала выбери слово — потом появится поле для исправления.</p>}
        {feedback === 'repair' && <button className="secondary-button retry-button" onClick={props.onSubmit}>Проверить исправление</button>}
        {feedback === 'correct' && <button className="primary-button answer-button" onClick={props.onNext}>Следующее задание <span>→</span></button>}
        </section>
      </div>
    </main>
  )
}

function Summary({ progress, sessionFloors, mastered, onAgain, onHome }: { progress: Progress; sessionFloors: number; mastered: boolean; onAgain: () => void; onHome: () => void }) {
  const repairs = repairExerciseIds(progress).length
  return <main className="screen summary-screen"><div className="summary-icon">{mastered ? '★' : '✦'}</div><p className="eyebrow">СЕССИЯ ЗАВЕРШЕНА</p><h1>{mastered ? 'Тема освоена!' : 'Башня растёт!'}</h1><p className="summary-copy">{mastered ? 'Ты научился доказывать написание слов.' : 'Каждая попытка делает следующий этаж крепче.'}</p><Tower floors={progress.floors} target={progress.targetFloors} damaged={repairs > 0} modules={progress.modules} /><div className="result-grid"><div><strong>+{sessionFloors}</strong><small>этажей сегодня</small></div><div><strong>{repairs}</strong><small>этажей в ремонте</small></div><div><strong>{progress.attempts.length}</strong><small>попыток всего</small></div></div><button className="primary-button start-button" onClick={onAgain}>Ещё одна короткая игра <span>→</span></button><button className="secondary-button" onClick={onHome}>На главную</button></main>
}

function Parent({ progress, onBack, onReset, onExport, onImport }: { progress: Progress; onBack: () => void; onReset: () => void; onExport: () => void; onImport: (file: File) => void }) {
  const [confirmReset, setConfirmReset] = useState(false)
  const independent = progress.attempts.filter((attempt) => attempt.firstAnswerCorrect && attempt.hintsUsed === 0).length
  const repairs = repairExerciseIds(progress).length
  return <main className="screen parent-screen"><button className="back-link" onClick={onBack}>← На главную</button><p className="eyebrow">КАБИНЕТ ВЗРОСЛОГО</p><h1>Как идёт обучение</h1><div className="parent-stat"><strong>{progress.floors} / {progress.targetFloors}</strong><span>этажей построено</span><div className="bar"><i style={{ width: Math.min(100, progress.floors / progress.targetFloors * 100) + '%' }} /></div></div><div className="stats-list"><div><span>Самостоятельные ответы</span><strong>{independent}</strong></div><div><span>Всего попыток</span><strong>{progress.attempts.length}</strong></div><div><span>Требуют ремонта</span><strong>{repairs}</strong></div><div><span>Сессий</span><strong>{progress.sessionsCompleted}</strong></div></div><p className="parent-note">Башня показывает игровой прогресс. Статус «тема освоена» появляется только после повторных самостоятельных проверок в разные дни.</p><div className="data-actions"><button className="secondary-button" onClick={onExport}>Скачать прогресс</button><label className="secondary-button file-button">Загрузить прогресс<input type="file" accept="application/json,.json" onChange={(event) => { const file = event.target.files?.[0]; if (file) onImport(file); event.currentTarget.value = '' }} /></label></div><button className="secondary-button danger-button" onClick={() => setConfirmReset(true)}>Удалить локальный прогресс</button>{confirmReset && <section className="reset-confirmation" role="alert" aria-label="Подтверждение сброса"><p>Начать с нуля? Все этажи, ответы и история повторений на этом устройстве будут удалены.</p><button className="secondary-button danger-button" onClick={onReset}>Да, начать с начала</button><button className="secondary-button" onClick={() => setConfirmReset(false)}>Оставить прогресс</button></section>}</main>
}

export default App
