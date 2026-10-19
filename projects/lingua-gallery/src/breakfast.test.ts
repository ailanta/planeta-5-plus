import { describe,it,expect } from 'vitest'
import { emptySave,parseSave,type Save } from './content'
import { breakfastActions,updateBreakfast,parseBreakfast,breakfastOptions } from './breakfast'

function start(save:Save={...emptySave}):Save {
 save=updateBreakfast(save,{type:'start'})
 for(let i=0;i<4;i++)save=updateBreakfast(save,{type:'next'})
 return save
}
function answer(save:Save):Save {
 const s=save.breakfast!.session!
 if(s.step<8)save=updateBreakfast(save,{type:'select',value:breakfastActions[s.step%4].id})
 else for(const word of breakfastActions[s.step%4].sentence.split(' '))save=updateBreakfast(save,{type:'token',index:s.options.indexOf(word)})
 return updateBreakfast(save,{type:'check'})
}
describe('breakfast prototype',()=>{
 it('runs all 12 tasks, saves every transition and rewards only once',()=>{
  let save=start({...emptySave,coins:30,owned:['skirt'],placement:['skirt']})
  for(let i=0;i<12;i++){
   expect(save.breakfast?.session?.step).toBe(i)
   save=answer(save)
   expect(save.coins).toBe(30)
   save=updateBreakfast(save,{type:'next'})
   expect(parseSave(JSON.stringify(save))).toEqual(save)
  }
  expect(save.coins).toBe(210)
  expect(save.breakfast?.session?.phase).toBe('done')
  expect(save.owned).toEqual(['skirt'])
  expect(updateBreakfast(save,{type:'next'})).toBe(save)
  save=start(save)
  for(let i=0;i<12;i++)save=updateBreakfast(answer(save),{type:'next'})
  expect(save.coins).toBe(210)
  expect(save.breakfast?.lastReward).toBe(0)
 })
 it('does not let empty or wrong answers advance',()=>{
  const save=start()
  expect(updateBreakfast(save,{type:'next'})).toBe(save)
  expect(updateBreakfast(save,{type:'check'})).toBe(save)
  const wrong=updateBreakfast(updateBreakfast(save,{type:'select',value:'cut-bread'}),{type:'check'})
  expect(wrong.breakfast?.review).toEqual(['make-tea'])
  expect(updateBreakfast(wrong,{type:'next'})).toBe(wrong)
  expect(answer(wrong).breakfast?.review).toContain('make-tea')
 })
 it('keeps hint usage and mistakes after reload, clears them after independent practice',()=>{
  let save=updateBreakfast(start(),{type:'hint'})
  save=parseSave(JSON.stringify(save))
  expect(save.breakfast?.session?.assisted).toBe(true)
  expect(save.breakfast?.review).toContain('make-tea')
  save=start(save)
  expect(answer(save).breakfast?.review).not.toContain('make-tea')
 })
 it('preserves shopping progress and validates malformed day saves separately',()=>{
  const save={...emptySave,coins:85,completed:['atelier:1'],owned:['skirt']}
  expect(parseSave(JSON.stringify({...save,breakfast:{version:1,completed:'yes'}}))).toEqual(save)
  const day=start(save).breakfast!
  expect(parseBreakfast({...day,session:{...day.session,step:999}})?.session).toBeNull()
  expect(parseBreakfast({...day,session:{...day.session,feedback:'good'}})?.session).toBeNull()
  expect(parseBreakfast({...day,session:{...day.session,options:['fake']}})?.session).toBeNull()
  expect(parseSave(JSON.stringify(start(save))).completed).toEqual(save.completed)
 })
 it('has distinct actions, translations, and sentence tokens for all stages',()=>{
  expect(new Set(breakfastActions.map(a=>a.en)).size).toBe(4)
  for(let i=0;i<12;i++)expect(breakfastOptions(i).length).toBeGreaterThanOrEqual(3)
 })
})
