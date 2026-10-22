import { useEffect, useRef, useState } from 'react'
import { shops, shuffle, readSave, lessonShop, levelMode, dialogueId } from './content'
import { availableLevel, recommendedRoute, recordAnswer, purchaseItem, finishMission } from './progress'
import { sceneStyle } from './scenes'
import { Art } from './Art'
import { ShopCarousel } from './ShopCarousel'
import { Collection } from './Collection'
import { Breakfast } from './BreakfastGame'
import { storageLocation } from './possessions'
import './interface.css'
import './navigation-collection.css'

type Page = 'gallery' | 'learn' | 'play' | 'result' | 'room' | 'breakfast'
const levelNames = ['Узнаём слова', 'Слушаем', 'Собираем фразы']

export function Icon({ name }: { name: 'sound' | 'bag' | 'arrow' | 'close' | 'check' }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {name === 'sound' && <><path d="M11 5 6 9H3v6h3l5 4Z" /><path d="M15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14" /></>}
    {name === 'bag' && <><path d="M5 8h14l2 13H3Z" /><path d="M8 9V6a4 4 0 0 1 8 0v3" /></>}
    {name === 'arrow' && <path d="M5 12h14m-5-5 5 5-5 5" />}
    {name === 'close' && <path d="m6 6 12 12M6 18 18 6" />}
    {name === 'check' && <path d="m5 12 4 4L19 6" />}
  </svg>
}

export default function App() {
  const [save, setSave] = useState(readSave)
  const [route, setRoute] = useState(() => recommendedRoute(readSave()))
  const [page, setPage] = useState<Page>('gallery')
  const [card, setCard] = useState(0)
  const [step, setStep] = useState(0)
  const [selected, setSelected] = useState('')
  const [feedback, setFeedback] = useState<'good' | 'bad' | null>(null)
  const [options, setOptions] = useState<string[]>([])
  const [tokens, setTokens] = useState<number[]>([])
  const [notice, setNotice] = useState('')
  const [storageError, setStorageError] = useState('')
  const [audioText, setAudioText] = useState(false)
  const [reward, setReward] = useState(0)
  const [purchaseId, setPurchaseId] = useState('')
  const [purchaseMessage, setPurchaseMessage] = useState('')
  const heading = useRef<HTMLHeadingElement>(null)
  const failed = useRef(new Set<string>())
  const rewarded = useRef(false)
  const level = route.level
  const shop = lessonShop(shops[route.shop], level)
  const mode = levelMode(level)
  const item = shop.items[step % 4]
  const challenge = step === 4
  const purchase = shop.items.find(item => item.id === purchaseId) || shop.items[0]
  const resumable = save.session?.shopId === shop.id && save.session.level === level ? save.session : null

  useEffect(() => {
    try { localStorage.setItem('lingua-gallery:v1', JSON.stringify(save)); setStorageError('') }
    catch { setStorageError('Не удалось сохранить прогресс. Проверьте свободное место на устройстве.') }
  }, [save])
  useEffect(() => {
    if (page !== 'learn' && page !== 'play') return
    setSave(current => ({...current, session: {shopId:shop.id, level, stage:page, card, step, selected, feedback, options, tokens, failed:[...failed.current], audioText}}))
  }, [page, shop.id, level, card, step, selected, feedback, options, tokens, audioText])
  useEffect(() => { window.scrollTo(0, 0); heading.current?.focus({ preventScroll: true }); window.speechSynthesis?.cancel() }, [page])
  useEffect(() => { if (!notice) return; const timer = window.setTimeout(() => setNotice(''), 4000); return () => window.clearTimeout(timer) }, [notice])

  function speak(text: string) {
    if (!('speechSynthesis' in window)) { showAudioText(); setNotice('Озвучка недоступна. Можно продолжить с текстом.'); return }
    window.speechSynthesis.cancel()
    const voice = new SpeechSynthesisUtterance(text)
    voice.lang = 'en-GB'; voice.rate = .85
    voice.onerror = event => { if(event.error === 'canceled' || event.error === 'interrupted') return; showAudioText(); setNotice('Можно продолжить с текстовой подсказкой.') }
    window.speechSynthesis.speak(voice)
  }
  function showAudioText() {
    if (page === 'play' && mode === 2 && !challenge) {
      failed.current.add(item.id)
      setSave(current => recordAnswer(current, item.id, false, true))
    }
    setAudioText(true)
  }
  function prepare(nextStep: number) {
    window.speechSynthesis?.cancel()
    setStep(nextStep); setSelected(''); setTokens([]); setFeedback(null); setAudioText(false)
    setOptions(shuffle(nextStep === 4 ? [shop.reply, ...shop.wrong] : mode === 3 ? shop.items[nextStep].en.split(' ') : shop.items.map(item => item.en)))
  }
  function startMission() { failed.current.clear(); rewarded.current = false; setNotice(''); prepare(0); setPage('play') }
  function begin() {
    setNotice('')
    if (resumable) {
      failed.current = new Set(resumable.failed); rewarded.current = false
      setCard(resumable.card); setStep(resumable.step); setSelected(resumable.selected)
      setFeedback(resumable.feedback); setOptions(resumable.options); setTokens(resumable.tokens)
      setAudioText(resumable.audioText); setPage(resumable.stage); return
    }
    setCard(0); setStep(0); setSelected(''); setFeedback(null); setTokens([]); setOptions([]); setAudioText(false); failed.current.clear()
    if (mode === 1) setPage('learn'); else startMission()
  }
  function check() {
    const id = challenge ? dialogueId(shop.id, level) : item.id
    const answer = mode === 3 && !challenge ? tokens.map(index => options[index]).join(' ') : selected
    if (answer === (challenge ? shop.reply : item.en)) {
      setFeedback('good')
      setSave(current => recordAnswer(current, id, true, failed.current.has(id)))
    } else {
      failed.current.add(id); setFeedback('bad')
      setSave(current => recordAnswer(current, id, false, true))
    }
  }
  function next() {
    if (step < 4) { prepare(step + 1); return }
    if (rewarded.current) return
    const result = finishMission(save, shop.id, level)
    if (result.save === save) return
    setSave(result.save)
    if (result.save.session) {
      const session=result.save.session
      window.speechSynthesis?.cancel()
      failed.current.clear()
      setRoute(current=>({...current,level:session.level}))
      setCard(0); setStep(0); setSelected(''); setTokens([]); setFeedback(null); setAudioText(false)
      setOptions(session.options)
      setNotice(`Этап ${levelMode(session.level)} из 3 · ${levelNames[levelMode(session.level)-1]}`)
      return
    }
    rewarded.current = true
    setReward(result.reward)
    setPurchaseId((shop.items.find(item => !save.owned.includes(item.id) && item.price <= result.save.coins) || shop.items[0]).id)
    setPurchaseMessage(''); setPage('result')
  }
  function returnHome() { setRoute(recommendedRoute(save)); setNotice(''); setPage('gallery') }
  function buy() {
    if (save.owned.includes(purchase.id) || save.coins < purchase.price) return
    setSave(current => purchaseItem(current, purchase))
    setPurchaseMessage(`«${purchase.ru}» — покупка сохранена ${storageLocation(purchase.id)}. Можно выбрать следующую вещь.`)
  }
  function changeShop(index: number) { setRoute({ shop: index, level: availableLevel(save, shops[index].id) }) }
  const answerReady = challenge || mode !== 3 ? !!selected : tokens.length === options.length
  const canBuy = !save.owned.includes(purchase.id) && save.coins >= purchase.price
  const pictureStyle = sceneStyle(shop.id)

  return <div className={`app page-${page}`}>
    <header className="app-header">
      <button className="brand" aria-label="Lingua Gallery — на главную" onClick={returnHome}><span className="brand-mark"><Icon name="bag" /><i /></span><span>lingua gallery</span></button>
      <div className="header-actions">{save.coins > 0 && <span className="wallet" aria-label={`${save.coins} игровых монет`}><span aria-hidden="true">✦</span> {save.coins}</span>}<button className="collection-link" onClick={() => { setNotice(''); if (page === 'room') returnHome(); else setPage('room') }}><Icon name="bag" /><span>{page === 'room' ? 'В галерею' : 'Мои покупки'}</span></button></div>
    </header>
    {storageError && <p className="storage-error" role="alert">{storageError}</p>}{notice && <p className="toast" role="status">{notice}</p>}

    {page === 'gallery' && <main className="home">
      <section className="home-shopping" aria-label="Магазины">
        <h1 className="home-title" ref={heading} tabIndex={-1}>Учи английский за покупками</h1>
        <ShopCarousel index={route.shop} onChange={changeShop} />
        <div className="home-shop-action">
          <button className="primary" onClick={begin}>{resumable ? 'Продолжить покупки' : 'Начать покупки'}<Icon name="arrow" /></button>
          {resumable && <p className="start-note">{resumable.stage === 'play' ? `Задание ${(mode - 1) * 5 + resumable.step + 1} из 15` : `Знакомство со словами · ${resumable.card + 1} из 4`}</p>}
        </div>
      </section>
      <section className="home-day" aria-labelledby="home-day-title">
        <h2 id="home-day-title">Мой день</h2>
        <button className="day-entry" onClick={()=>setPage('breakfast')}><img src={`${import.meta.env.BASE_URL}assets/breakfast-kitchen-v1.png`} alt="" /><span><strong>Завтрак дома</strong>{save.breakfast?.session && <small>Продолжить историю</small>}</span><span aria-hidden="true">→</span></button>
      </section>
    </main>}

    {page === 'learn' && <main className="focused-page"><div className="lesson-meta"><button className="text-button" onClick={returnHome}>← Назад</button><span>Знакомимся со словами · {card + 1} / 4</span><span className="meta-spacer" /></div><section className="learning-card"><div className="art-well"><Art kind={shop.items[card].kind} color={shop.items[card].color} /></div><div className="word-copy"><div className="word-title"><h1 ref={heading} tabIndex={-1} lang="en">{shop.items[card].en}</h1><button className="icon-button sound-button" aria-label={`Послушать ${shop.items[card].en}`} onClick={() => speak(shop.items[card].en)}><Icon name="sound" /></button></div><p className="translation">{shop.items[card].ru}</p><p className="example" lang="en">{shop.items[card].example}</p><button className="primary" onClick={() => card < 3 ? setCard(card + 1) : startMission()}>{card < 3 ? 'Дальше' : 'За покупками'}<Icon name="arrow" /></button></div></section><button className="text-button skip-link" onClick={startMission}>Уже знаю — к заданиям</button></main>}

    {page === 'play' && <main className="game-page">
      <div className="game-world" aria-hidden="true"><div className="panorama" style={pictureStyle} /><div className="world-wash" /><div className="world-label">{shop.name}</div></div>
      <section className="task-card"><div className="task-meta"><button className="icon-button" aria-label="Выйти из миссии" onClick={returnHome}><Icon name="close" /></button><span>{challenge ? 'Разговор с продавцом' : levelNames[mode - 1]}</span><span>{(mode - 1) * 5 + step + 1} / 15</span></div><div className="progress" aria-label={`Задание ${(mode - 1) * 5 + step + 1} из 15`}><i style={{ width: `${((mode - 1) * 5 + step + 1) / 15 * 100}%` }} /></div>
        <div className="question"><p>{challenge ? `Попросите: ${shop.items[0].ru}` : mode === 2 ? 'Послушайте и выберите перевод' : mode === 3 ? 'Соберите по-английски' : 'Как сказать по-английски?'}</p>{mode === 2 && !challenge && <button className="audio-button" aria-label="Послушать выражение" onClick={() => speak(item.en)}><Icon name="sound" /></button>}<h1 ref={heading} tabIndex={-1} lang={challenge ? 'en' : 'ru'}>{challenge ? shop.question : mode === 2 ? 'Что вы услышали?' : item.ru}</h1>{mode === 2 && !challenge && <><button className="text-button audio-hint" onClick={() => audioText ? setAudioText(false) : showAudioText()}>{audioText ? 'Скрыть подсказку' : 'Показать текст'}</button>{audioText && <span className="audio-text" lang="en">{item.en}</span>}</>}</div>
        {mode === 3 && !challenge ? <div className="phrase-task"><div className="sentence-builder" aria-live="polite">{tokens.length ? tokens.map(index => <button key={index} disabled={feedback === 'good'} onClick={() => { setTokens(tokens.filter(value => value !== index)); setFeedback(null) }}>{options[index]}</button>) : <span>Нажимайте на слова по порядку</span>}</div><div className="tokens">{options.map((word, index) => <button key={index} disabled={feedback === 'good' || tokens.includes(index)} onClick={() => { setTokens([...tokens, index]); setFeedback(null) }}>{word}</button>)}</div></div> : <div className={`answers ${challenge ? 'sentence-answers' : ''}`}>{options.map(option => <button key={option} disabled={feedback === 'good'} aria-pressed={selected === option} className={selected === option ? 'selected' : ''} onClick={() => { setSelected(option); setFeedback(null) }}>{mode === 2 && !challenge ? shop.items.find(item => item.en === option)?.ru : option}{selected === option && <span className="answer-dot" />}</button>)}</div>}
        <div className={`feedback ${feedback || ''}`} aria-live="polite">{feedback === 'good' ? <><Icon name="check" /><span>{challenge ? 'Вы договорились!' : 'Верно!'}</span></> : feedback === 'bad' ? <><span>Попробуйте ещё раз</span><small lang="en">{challenge ? shop.reply : `${item.ru} — ${item.en}`}</small></> : null}</div><button className="primary task-action" disabled={feedback !== 'good' && !answerReady} onClick={feedback === 'good' ? next : check}>{feedback === 'good' ? challenge ? mode === 3 ? 'Завершить набор' : 'Следующий этап' : 'Дальше' : 'Проверить'}<Icon name="arrow" /></button>
      </section>
      <div className="basket" aria-label={`В корзине ${Math.min(step + (feedback === 'good' && !challenge ? 1 : 0), 4)} из 4 вещей`}><div className="basket-label"><Icon name="bag" /><span>Ваша корзина</span></div><div className="basket-items">{shop.items.map((item, index) => <div key={item.id} className="basket-slot">{index < step || (index === step && feedback === 'good') ? <Art kind={item.kind} color={item.color} /> : <span />}</div>)}</div></div>
    </main>}

    {page === 'result' && <main className="result-page"><span className="success-seal"><Icon name="check" /></span>
      <h1 ref={heading} tabIndex={-1}>Набор пройден!</h1>
      <p>{reward ? `Все три этапа завершены. +${reward} монет на покупки.` : 'Повторение завершено. Награда за этот набор уже получена.'}</p>
      <section className="purchase-card">
        <p className="shopping-balance" aria-live="polite">Ваш баланс: {save.coins} монет</p>
        <div className="purchase-art"><Art kind={purchase.kind} color={purchase.color} /></div>
        <h2>{purchase.ru}</h2><span lang="en">{purchase.en}</span>
        <div className="item-picker" aria-label="Выберите покупки">{shop.items.map(item => <button key={item.id} aria-label={`${item.ru}, ${item.price} монет${save.owned.includes(item.id) ? ', уже куплено' : ''}`} aria-pressed={purchase.id === item.id} className={purchase.id === item.id ? 'picked' : ''} onClick={() => setPurchaseId(item.id)}><Art kind={item.kind} color={item.color} />{save.owned.includes(item.id) && <i><Icon name="check" /></i>}</button>)}</div>
        <button className="primary" disabled={!canBuy} onClick={buy}>{save.owned.includes(purchase.id) ? 'Уже куплено' : `Купить за ${purchase.price} монет`}<Icon name="bag" /></button>
        {!save.owned.includes(purchase.id) && !canBuy && <small>Не хватает {purchase.price-save.coins} монет. Можно выбрать другую вещь.</small>}
        <p role="status">{purchaseMessage || 'Можно купить несколько разных вещей — выбирайте их по очереди.'}</p>
      </section>
      <button className="text-button skip-link" onClick={returnHome}>Завершить покупки →</button>
    </main>}

    {page === 'breakfast' && <Breakfast save={save} setSave={setSave} onExit={returnHome} onShopping={()=>{
      setRoute({shop:1,level:1});setReward(save.breakfast?.lastReward??0);setPurchaseId('apple');setPurchaseMessage('');setPage('result')
    }} />}

    {page === 'room' && <Collection save={save} setSave={setSave} onContinue={returnHome} speak={speak} />}

  </div>
}
