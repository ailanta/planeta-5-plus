import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { productFrames } from './product-frames'
import { allShopItems, shops } from './content'

describe('dedicated product artwork',()=>{
 it('maps every new product to a unique crop in an existing transparent PNG',()=>{
  const products=shops.flatMap(allShopItems).filter(item=>item.id.includes(':v3:'))
  expect(products).toHaveLength(56)
  const crops=new Set<string>()
  for(const item of products){
   const art=productFrames[item.kind]
   expect(art).toBeDefined()
   const png=readFileSync(new URL(`../public/assets/${art.sheet}`,import.meta.url))
   expect(png.readUInt32BE(16)).toBe(1774)
   expect(png.readUInt32BE(20)).toBe(887)
   // PNG colour type 6: RGB plus alpha, not a baked-in background.
   expect(png[25]).toBe(6)
   const [x,y,w,h]=art.frame
   expect(x).toBeGreaterThanOrEqual(0);expect(y).toBeGreaterThanOrEqual(0)
   expect(w).toBeGreaterThan(0);expect(h).toBeGreaterThan(0)
   expect(x+w).toBeLessThanOrEqual(1774);expect(y+h).toBeLessThanOrEqual(887)
   crops.add(`${art.sheet}:${art.frame.join(',')}`)
  }
  expect(crops.size).toBe(56)
 })
})
