import type { Save } from './content'

export const breakfastActions = [
 {id:'make-tea',en:'make tea',ru:'приготовить чай',sentence:'I make tea.',translation:'Я готовлю чай.',result:'Чай заварен.',verb:'make — готовить, делать'},
 {id:'cut-bread',en:'cut bread',ru:'нарезать хлеб',sentence:'I cut bread.',translation:'Я нарезаю хлеб.',result:'Хлеб нарезан.',verb:'cut — резать'},
 {id:'pour-milk',en:'pour milk',ru:'налить молоко',sentence:'I pour milk.',translation:'Я наливаю молоко.',result:'Молоко в стакане.',verb:'pour — наливать'},
 {id:'wash-cup',en:'wash a cup',ru:'вымыть чашку',sentence:'I wash a cup.',translation:'Я мою чашку.',result:'Чашка чистая.',verb:'wash — мыть'},
] as const
export type BreakfastSession = {
 phase:'learn'|'play'|'done'; card:number; step:number; options:string[];
 selected:string; tokens:number[]; feedback:null|'good'|'bad'; assisted:boolean;
}
export type BreakfastProgress = {version:1; completed:boolean; review:string[]; session:BreakfastSession|null; lastReward:number}
const ids=breakfastActions.map(item=>item.id) as string[]
export const freshBreakfast=():BreakfastProgress=>({version:1,completed:false,review:[],session:null,lastReward:0})
function mix<T>(items:readonly T[]):T[]{const result=[...items];for(let i=result.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[result[i],result[j]]=[result[j],result[i]]}return result}
export function breakfastOptions(step:number):string[]{return step>=8?breakfastActions[step%4].sentence.split(' '):ids}
function question(step:number):BreakfastSession{return {phase:'play',card:0,step,options:mix(breakfastOptions(step)),selected:'',tokens:[],feedback:null,assisted:false}}
export function breakfastAnswer(s:BreakfastSession){return s.step>=8?s.tokens.map(index=>s.options[index]).join(' '):s.selected}
export function breakfastCorrect(s:BreakfastSession){return breakfastAnswer(s)===(s.step>=8?breakfastActions[s.step%4].sentence:ids[s.step%4])}

// Optional, isolated save extension: never overwrite the current shopping session.
export function parseBreakfast(value:unknown):BreakfastProgress|undefined {
 if(!value||typeof value!=='object')return undefined
 const v=value as Partial<BreakfastProgress>
 if(v.version!==1||typeof v.completed!=='boolean')return undefined
 const result:BreakfastProgress={version:1,completed:v.completed,review:Array.isArray(v.review)?[...new Set(v.review.filter(id=>ids.includes(id)))]:[],session:null,lastReward:v.completed&&v.lastReward===180?180:0}
 const s=v.session
 if(!s||!['learn','play','done'].includes(s.phase)||!Number.isInteger(s.card)||s.card<0||s.card>3||!Number.isInteger(s.step)||s.step<0||s.step>11)return result
 if(!Array.isArray(s.options)||!s.options.every(x=>typeof x==='string')||!Array.isArray(s.tokens)||!s.tokens.every(x=>Number.isInteger(x)&&x>=0&&x<s.options.length)||new Set(s.tokens).size!==s.tokens.length)return result
 if(typeof s.selected!=='string'||typeof s.assisted!=='boolean'||![null,'good','bad'].includes(s.feedback))return result
 if(s.phase!=='learn'&&JSON.stringify([...s.options].sort())!==JSON.stringify([...breakfastOptions(s.step)].sort()))return result
 if(s.feedback==='good'&&!breakfastCorrect(s))return result
 if(s.phase==='done'&&(!v.completed||s.step!==11||s.feedback!=='good'))return result
 result.session={phase:s.phase,card:s.card,step:s.step,options:[...s.options],selected:s.selected,tokens:[...s.tokens],feedback:s.feedback,assisted:s.assisted}
 return result
}
export type BreakfastEvent={type:'start'|'next'|'check'|'hint'}|{type:'select';value:string}|{type:'token';index:number}
export function updateBreakfast(save:Save,event:BreakfastEvent):Save {
 const day=save.breakfast??freshBreakfast(),s=day.session
 const commit=(next:BreakfastProgress,coins=save.coins):Save=>({...save,coins,breakfast:next})
 if(event.type==='start')return commit({...day,lastReward:0,session:{...question(0),phase:'learn'}})
 if(!s||s.phase==='done')return save
 if(event.type==='next'){
  if(s.phase==='learn')return commit({...day,session:s.card<3?{...s,card:s.card+1}:question(0)})
  if(s.feedback!=='good')return save
  if(s.step<11)return commit({...day,session:question(s.step+1)})
  const reward=day.completed?0:180
  return commit({...day,completed:true,lastReward:reward,session:{...s,phase:'done'}},save.coins+reward)
 }
 if(s.phase!=='play'||s.feedback==='good')return save
 if(event.type==='select')return s.options.includes(event.value)?commit({...day,session:{...s,selected:event.value,feedback:null}}):save
 if(event.type==='token'){
  if(!Number.isInteger(event.index)||event.index<0||event.index>=s.options.length)return save
  const tokens=s.tokens.includes(event.index)?s.tokens.filter(i=>i!==event.index):[...s.tokens,event.index]
  return commit({...day,session:{...s,tokens,feedback:null}})
 }
 const id=ids[s.step%4]
 if(event.type==='hint')return commit({...day,review:[...new Set([...day.review,id])],session:{...s,assisted:true}})
 if(event.type==='check'){
  if(s.step>=8?s.tokens.length!==s.options.length:!s.selected)return save
  const good=breakfastCorrect(s)
  return commit({...day,review:good&&!s.assisted?day.review.filter(x=>x!==id):[...new Set([...day.review,id])],session:{...s,feedback:good?'good':'bad',assisted:s.assisted||!good}})
 }
 return save
}
