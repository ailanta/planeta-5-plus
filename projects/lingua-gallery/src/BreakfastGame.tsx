import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react'
import type { Save } from './content'
import { breakfastActions, updateBreakfast, type BreakfastEvent } from './breakfast'
import './breakfast.css'

const asset=(name:string)=>`${import.meta.env.BASE_URL}assets/${name}`
export function BreakfastScene({index,done=false,label}:{index:number;done?:boolean;label?:string}) {
 return <div className="breakfast-scene" role={label?'img':undefined} aria-label={label} aria-hidden={label?undefined:true}
  style={{backgroundImage:`url('${asset('breakfast-actions-v1.png')}')`,backgroundPosition:`${index*100/3}% ${done?100:0}%`}} />
}
export function Breakfast({save,setSave,onExit,onShopping}:{save:Save;setSave:Dispatch<SetStateAction<Save>>;onExit:()=>void;onShopping:()=>void}) {
 const day=save.breakfast,s=day?.session
 const [hint,setHint]=useState(false)
 const [audioError,setAudioError]=useState(false)
 const heading=useRef<HTMLHeadingElement>(null)
 const lesson=s?.phase==='learn',done=s?.phase==='done'
 const index=lesson?s.card:(s?.step??0)%4,item=breakfastActions[index]
 const mode=Math.floor((s?.step??0)/4)
 const correct=s?.feedback==='good'
 const dispatch=(event:BreakfastEvent)=>setSave(current=>updateBreakfast(current,event))
 useEffect(()=>{setHint(false);setAudioError(false);window.speechSynthesis?.cancel();heading.current?.focus({preventScroll:true})},[s?.phase,s?.step,s?.card])
 useEffect(()=>()=>window.speechSynthesis?.cancel(),[])
 function showHint(){setHint(true);if(!lesson)dispatch({type:'hint'})}
 function speak(text:string){
  if(!('speechSynthesis' in window)){setAudioError(true);showHint();return}
  window.speechSynthesis.cancel()
  const voice=new SpeechSynthesisUtterance(text);voice.lang='en-GB';voice.rate=.85
  voice.onerror=e=>{if(e.error==='canceled'||e.error==='interrupted')return;setAudioError(true);showHint()}
  window.speechSynthesis.speak(voice)
 }
 const speakButton=(text:string)=><button className="day-sound" onClick={()=>speak(text)} aria-label={`Послушать: ${lesson||mode!==1?text:'действие'}`}>♫ Послушать</button>
 if(!s)return <main className="day-page">
  <div className="day-top"><button className="text-button" onClick={onExit}>← В галерею</button><span>Мой день · первая история</span></div>
  <section className="day-intro"><img src={asset('breakfast-kitchen-v1.png')} alt="Солнечная кухня с чаем, хлебом и молоком" />
   <div className="day-intro-copy"><span className="eyebrow">Знакомые вещи. Новые действия.</span><h1 ref={heading} tabIndex={-1}>Завтрак дома.</h1><p>Приготовим чай, нарежем хлеб, нальём молоко и вымоем чашку — по-английски.</p>
    <div className="day-facts"><span>4 действия</span><span>3 этапа · 12 заданий</span><span>180 монет за первый полный круг</span></div>
    <button className="primary" onClick={()=>dispatch({type:'start'})}>Начать утро →</button><small>Всё необходимое уже на кухне. Покупки не обязательны.</small>
   </div>
  </section>
 </main>
 if(done)return <main className="day-page day-finish">
  <img className="day-finish-image" src={asset('breakfast-kitchen-v1.png')} alt="Готовый завтрак в солнечной кухне" />
  <span className="eyebrow">Мой день · завтрак дома</span><h1 ref={heading} tabIndex={-1}>Утро получилось.</h1>
  <p>Вы прошли все 12 заданий: узнали действия, услышали их и собрали фразы.</p>
  <div className="day-reward">{day?.lastReward?`+${day.lastReward} монет в общий кошелёк`:'Награда за эту историю уже получена'}</div>
  {Boolean(day?.review.length)&&<p className="day-review">Ещё стоит повторить: {breakfastActions.filter(x=>day?.review.includes(x.id)).map(x=>x.en).join(', ')}.</p>}
  <button className="primary" onClick={onShopping}>Выбрать покупки →</button>
  <div className="day-finish-links"><button className="text-button" onClick={()=>dispatch({type:'start'})}>Повторить историю</button><button className="text-button" onClick={onExit}>В галерею</button></div>
 </main>
 const ready=mode===2?s.tokens.length===s.options.length:Boolean(s.selected)
 return <main className="day-page">
  <div className="day-top"><button className="text-button" onClick={onExit}>← Сохранить и выйти</button><span>{lesson?`Знакомство · ${s.card+1} / 4`:`${s.step+1} / 12 · ${['Узнаём','Слушаем','Собираем'][mode]}`}</span></div>
  {!lesson&&<div className="day-steps" aria-label={`Этап ${mode+1} из 3`}>{['Узнаём действия','Слушаем','Собираем фразы'].map((name,i)=><span key={name} aria-current={i===mode?'step':undefined} className={i<=mode?'active':''}>{i+1}. {name}</span>)}</div>}
  <section className={`day-lesson ${correct?'is-correct':''}`}>
   <div className="day-picture">
    {mode===1&&!lesson&&!correct?<div className="day-listen-cover"><img src={asset('breakfast-kitchen-v1.png')} alt="Кухня — послушайте и выберите действие" /><span>Какое действие вы услышали?</span></div>:<BreakfastScene index={index} done={correct} label={correct?item.result:`Действие: ${item.ru}`} />}
    {correct&&<span className="day-scene-result">✓ {item.result}</span>}
   </div>
   <div className="day-task">
    <span className="eyebrow">Завтрак дома</span>
    <h1 ref={heading} tabIndex={-1} lang={lesson?'en':'ru'}>{lesson?item.en:mode===1?'Слушаем действие':mode===2?item.translation:item.ru}</h1>
    {lesson?<><p className="day-translation">{item.ru}</p>{speakButton(item.en)}<p className="day-verb">{item.verb}</p><div className="day-example"><span lang="en">{item.sentence}</span><small>{item.translation}</small></div><button className="primary" onClick={()=>dispatch({type:'next'})}>{s.card<3?'Следующее действие':'Попробовать →'}</button></>:<>
     <p className="day-instruction">{mode===0?'Выберите выражение по-английски':mode===1?'Послушайте и выберите подходящую сцену':'Нажимайте на слова в правильном порядке'}</p>
     {mode===1&&<>{speakButton(item.en)}<button className="text-button" onClick={showHint}>Показать текст</button>{(hint||s.assisted)&&<p className="day-hint" lang="en">{item.en}</p>}{audioError&&<p role="status">Озвучка недоступна — продолжайте с текстом.</p>}</>}
     {mode<2?<div className={mode===1?'day-picture-options':'answers'}>{s.options.map(id=>{const action=breakfastActions.find(x=>x.id===id)!;return <button key={id} disabled={correct} aria-pressed={s.selected===id} className={s.selected===id?'selected':''} onClick={()=>dispatch({type:'select',value:id})}>{mode===1&&<BreakfastScene index={breakfastActions.findIndex(x=>x.id===id)} />}<span lang={mode===0?'en':'ru'}>{mode===0?action.en:action.ru}</span></button>})}</div>:<div className="phrase-task"><div className="sentence-builder" aria-live="polite">{s.tokens.length?s.tokens.map(i=><button key={i} disabled={correct} onClick={()=>dispatch({type:'token',index:i})}>{s.options[i]}</button>):<span>Соберите предложение здесь</span>}</div><div className="tokens">{s.options.map((word,i)=><button key={i} disabled={correct||s.tokens.includes(i)} onClick={()=>dispatch({type:'token',index:i})}>{word}</button>)}</div></div>}
     <div className={`feedback ${s.feedback??''}`} role="status">{correct?'Верно — действие выполнено.':s.feedback==='bad'?<><span>Можно исправить</span><small lang="en">{mode===2?item.sentence:item.en}</small></>:null}</div>
     <button className="primary" disabled={!correct&&!ready} onClick={()=>dispatch({type:correct?'next':'check'})}>{correct?s.step===11?'Завершить завтрак':s.step===3||s.step===7?'Следующий этап →':'Дальше →':'Проверить'}</button>
    </>}
   </div>
  </section>
  {!lesson&&<p className="day-save-note">Место сохранено. Награда — после всех трёх этапов.</p>}
 </main>
}
