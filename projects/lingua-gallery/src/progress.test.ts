import { describe, expect, it } from 'vitest'
import { shops, emptySave, parseSave, type Save, type Session } from './content'
import { availableLevel, recommendedRoute, recordAnswer, purchaseItem, finishMission } from './progress'
import { hasArt } from './Art'

const fresh = ():Save => structuredClone(emptySave)
const draft = ():Session => ({shopId:'atelier',level:1,stage:'play',card:0,step:0,selected:'',feedback:null,options:shops[0].items.map(item=>item.en),tokens:[],failed:[],audioText:false})

describe('content quality',()=>{
 it('every shop has four distinct, illustrated phrases and an unambiguous answer set',()=>{
  expect(shops.length).toBe(7)
  const items=shops.flatMap(shop=>shop.items)
  expect(new Set(items.map(item=>item.id)).size).toBe(items.length)
  for(const shop of shops){
   expect(shop.items).toHaveLength(4)
   expect(new Set(shop.items.map(item=>item.en)).size).toBe(4)
   expect(new Set(shop.items.map(item=>item.ru)).size).toBe(4)
   expect(new Set([shop.reply,...shop.wrong]).size).toBe(3)
   for(const item of shop.items){expect(hasArt(item.kind)).toBe(true);expect(item.price).toBeGreaterThan(0);expect(item.price).toBeLessThanOrEqual(60);expect(item.example.toLowerCase()).toContain(item.en.replace(/^(a|an) /,''))}
  }
 })
})

describe('save recovery',()=>{
 it('keeps old v1 progress without a session',()=>{
  const save=parseSave(JSON.stringify({version:1,coins:30,owned:['skirt'],placement:['skirt'],completed:['atelier:1'],review:['skirt'],learned:['skirt']}))
  expect(save.coins).toBe(30);expect(save.owned).toEqual(['skirt']);expect(save.session).toBeNull()
 })
 it('resumes a shuffled answer and remembered mistake',()=>{
  const session={...draft(),options:[...draft().options].reverse(),selected:'a red skirt',feedback:'good' as const,failed:['skirt']}
  expect(parseSave(JSON.stringify({...fresh(),session})).session).toEqual(session)
 })
 it('does not resume a broken or out-of-range question',()=>{
  expect(parseSave(JSON.stringify({...fresh(),session:{...draft(),step:99}})).session).toBeNull()
  expect(parseSave(JSON.stringify({...fresh(),session:{...draft(),options:['missing']}})).session).toBeNull()
 })
 it('recovers safely from corrupt data and filters impossible inventory',()=>{
  expect(parseSave('{bad json')).toEqual(emptySave)
  const save=parseSave(JSON.stringify({...fresh(),coins:-5,owned:['skirt','skirt','unknown'],placement:['phone','skirt'],completed:['atelier:3']}))
  expect(save.coins).toBe(0);expect(save.owned).toEqual(['skirt']);expect(save.placement).toEqual(['skirt']);expect(save.completed).toEqual([])
 })
})

describe('learning and rewards',()=>{
 it('retains an assisted correction until an independent later answer',()=>{
  const mistake=recordAnswer(fresh(),'skirt',false,false)
  const corrected=recordAnswer(mistake,'skirt',true,true)
  expect(corrected.review).toContain('skirt')
  expect(recordAnswer(corrected,'skirt',true,false).review).not.toContain('skirt')
 })
 it('awards only after all three stages and persists each transition',()=>{
  let save=fresh()
  for(let level=1;level<=3;level++){
    const session={...draft(),level,step:4,feedback:'good' as const,selected:shops[0].reply,options:[shops[0].reply,...shops[0].wrong]}
    const result=finishMission({...save,session},'atelier',level)
    expect(result.reward).toBe(level===3?180:0)
    save=parseSave(JSON.stringify(result.save))
    expect(save.completed).toContain(`atelier:${level}`)
    if(level<3){
      expect(save.session?.level).toBe(level+1)
      expect(save.session?.step).toBe(0)
      expect(save.session?.feedback).toBeNull()
      expect(recommendedRoute(save)).toEqual({shop:0,level:level+1})
    }else expect(save.session).toBeNull()
  }
  expect(save.coins).toBe(180)
  expect(finishMission(save,'atelier',3).save.coins).toBe(180)
 })
 it('cannot bypass earlier stages to get a block reward',()=>{
  const session={...draft(),level:3,step:4,feedback:'good' as const}
  expect(finishMission({...fresh(),session},'atelier',3).reward).toBe(0)
 })
 it('buys several different items, preserving balance and duplicate protection',()=>{
  let save={...fresh(),coins:100}
  save=purchaseItem(save,shops[0].items[0])
  save=purchaseItem(save,shops[0].items[1])
  expect(save.coins).toBe(30)
  expect(save.owned).toEqual(['skirt','sweater'])
  expect(purchaseItem(save,shops[0].items[0])).toBe(save)
  expect(purchaseItem(save,shops[0].items[2])).toBe(save)
  expect(parseSave(JSON.stringify(save)).owned).toEqual(save.owned)
 })
 it('cannot finish an unanswered mission or charge for a duplicate purchase',()=>{
  expect(finishMission({...fresh(),session:draft()},'atelier',1).reward).toBe(0)
  const item=shops[0].items[0],save=purchaseItem({...fresh(),coins:60},item)
  expect(purchaseItem(save,item).coins).toBe(30)
  expect(purchaseItem(fresh(),item).owned).toEqual([])
 })
 it('keeps collecting when the shelf is full',()=>{
  const save={...fresh(),coins:100,owned:['skirt','sweater','bag','dress'],placement:['skirt','sweater','bag','dress']}
  const result=purchaseItem(save,shops[1].items[0])
  expect(result.owned).toContain('apple');expect(result.placement).toHaveLength(4)
 })
 it('prioritises a saved session, then review, then new shops',()=>{
  const save={...fresh(),completed:['atelier:1']}
  expect(recommendedRoute(save)).toEqual({shop:1,level:1})
  expect(availableLevel(save,'atelier')).toBe(2)
  expect(recommendedRoute({...save,review:['skirt']})).toEqual({shop:0,level:1})
  expect(recommendedRoute({...save,review:['skirt'],session:{...draft(),shopId:'tech'}})).toEqual({shop:6,level:1})
 })
})
