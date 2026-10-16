import { describe, it, expect } from 'vitest'
import { shops, allShopItems, lessonShop, levelMode, levelCount, dialogueId, emptySave, parseSave, type Session } from './content'
import { availableLevel, recommendedRoute, finishMission } from './progress'
import { storageLocation } from './possessions'
import { hasArt } from './Art'

describe('themed word blocks',()=>{
 it('provides 84 stable illustrated expressions in short, distinct sets',()=>{
  const all=shops.flatMap(allShopItems)
  expect(all).toHaveLength(84)
  expect(new Set(all.map(item=>item.id)).size).toBe(84)
  for(const shop of shops){
   expect(allShopItems(shop)).toHaveLength(12)
   for(let level=1;level<=levelCount;level++){
    const lesson=lessonShop(shop,level)
    expect(lesson.items).toHaveLength(4)
    expect(new Set(lesson.items.map(item=>item.en)).size).toBe(4)
    expect(new Set([lesson.reply,...lesson.wrong]).size).toBe(3)
    for(const item of lesson.items){expect(hasArt(item.kind)).toBe(true);expect(item.example.toLowerCase()).toContain(item.en.replace(/^(a|an) /,''))}
   }
  }
 })
 it('repeats each set through recognition, listening and phrase building',()=>{
  for(const start of [1,4,7]){
   expect([start,start+1,start+2].map(levelMode)).toEqual([1,2,3])
   expect(lessonShop(shops[0],start).items).toEqual(lessonShop(shops[0],start+2).items)
  }
  const completed=['atelier:1','atelier:2','atelier:3']
  expect(availableLevel({...emptySave,completed},'atelier')).toBe(4)
  expect(parseSave(JSON.stringify({...emptySave,completed})).completed).toEqual(completed)
 })
 it('restores a new-block session, purchases and errors without losing old purchases',()=>{
  const lesson=lessonShop(shops[0],4),id=lesson.items[0].id
  const session:Session={shopId:'atelier',level:4,stage:'play',card:0,step:4,selected:lesson.reply,feedback:'good',options:[lesson.reply,...lesson.wrong].reverse(),tokens:[],failed:[id,dialogueId('atelier',4)],audioText:false}
  const save=parseSave(JSON.stringify({...emptySave,completed:['atelier:1','atelier:2','atelier:3'],owned:['skirt',id],review:[id],session}))
  expect(save.session).toEqual(session)
  expect(save.owned).toEqual(['skirt',id])
  expect(storageLocation(id)).toBe('в гардеробе')
  expect(recommendedRoute({...save,session:null})).toEqual({shop:0,level:4})
  const result=finishMission(save,'atelier',4)
  expect(result.reward).toBe(60)
  expect(parseSave(JSON.stringify(result.save)).completed).toContain('atelier:4')
 })
 it('rejects a locked new block and a mismatched old answer set',()=>{
  const session:Session={shopId:'atelier',level:4,stage:'play',card:0,step:0,selected:'',feedback:null,options:shops[0].items.map(item=>item.en),tokens:[],failed:[],audioText:false}
  expect(parseSave(JSON.stringify({...emptySave,session})).session).toBeNull()
  expect(parseSave(JSON.stringify({...emptySave,completed:['atelier:1','atelier:2','atelier:3'],session})).session).toBeNull()
 })
})
