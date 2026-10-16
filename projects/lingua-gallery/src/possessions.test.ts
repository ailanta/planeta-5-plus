import { expect, it } from 'vitest'
import { emptySave, parseSave } from './content'
import { setOnDisplay, storageLocation } from './possessions'

it('taking a skirt off the shelf keeps it owned after reloading',()=>{
  const save={...emptySave,coins:30,owned:['skirt'],placement:['skirt']}
  const next=parseSave(JSON.stringify(setOnDisplay(save,'skirt',false)))
  expect(next.placement).toEqual([])
  expect(next.owned).toEqual(['skirt'])
  expect(next.coins).toBe(30)
  expect(storageLocation('skirt')).toBe('в гардеробе')
  expect(setOnDisplay(next,'skirt',true).placement).toEqual(['skirt'])
})

it('display changes cannot add unowned items, duplicate them or overflow the shelf',()=>{
  const save={...emptySave,owned:['skirt','sweater','bag','dress','apple'],placement:['skirt','sweater','bag','dress']}
  expect(setOnDisplay(save,'apple',true)).toEqual(save)
  expect(setOnDisplay(save,'skirt',true)).toEqual(save)
  expect(setOnDisplay({...save,placement:[]},'phone',true).placement).toEqual([])
  expect(setOnDisplay(save,'apple',false).owned).toEqual(save.owned)
})
