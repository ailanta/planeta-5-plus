import { shops, shuffle, levelMode, levelCount, lessonShop, dialogueId, type Save, type Item } from './content'

export function availableLevel(save: Save, shopId: string) {
  for (let level = 1; level <= levelCount; level++) if (!save.completed.includes(`${shopId}:${level}`)) return level
  return levelCount
}

export function recommendedRoute(save: Save) {
  if (save.session) {
    const shop = shops.findIndex(shop => shop.id === save.session!.shopId)
    if (shop >= 0) return {shop, level: save.session.level}
  }
  for (let index=0;index<shops.length;index++) {
    const shop=shops[index]
    for(const level of [1,4,7]) {
      if(lessonShop(shop,level).items.some(item=>save.review.includes(item.id))||save.review.includes(dialogueId(shop.id,level)))return {shop:index,level}
    }
  }
  // Visit every shop before increasing the difficulty of the whole route.
  for (let level = 1; level <= levelCount; level++) {
    const shop = shops.findIndex(shop => !save.completed.includes(`${shop.id}:${level}`))
    if (shop >= 0) return { shop, level }
  }
  return {shop:0,level:levelCount}
}

export function recordAnswer(save:Save,id:string,correct:boolean,assisted:boolean):Save {
  if(!correct) return {...save,review:[...new Set([...save.review,id])]}
  return {...save,learned:[...new Set([...save.learned,id])],review:assisted?save.review:save.review.filter(value=>value!==id)}
}

export function purchaseItem(save:Save,item:Item):Save {
  if(save.owned.includes(item.id)||save.coins<item.price)return save
  return {...save,coins:save.coins-item.price,owned:[...save.owned,item.id],placement:save.placement.length<4?[...save.placement,item.id]:save.placement}
}

export function finishMission(save:Save,shopId:string,level:number):{save:Save;reward:number} {
  if(!save.session||save.session.shopId!==shopId||save.session.level!==level||save.session.stage!=='play'||save.session.step!==4||save.session.feedback!=='good')return {save,reward:0}
  const base=shops.find(shop=>shop.id===shopId)
  if(!base||level<1||level>levelCount||(level>1&&!save.completed.includes(`${shopId}:${level-1}`)))return {save,reward:0}
  const key=`${shopId}:${level}`
  const last=levelMode(level)===3
  const reward=last&&!save.completed.includes(key)?180:0
  const nextShop=lessonShop(base,level+1)
  const session=last?null:{...save.session,level:level+1,card:0,step:0,selected:'',feedback:null,
    options:shuffle(levelMode(level+1)===3?nextShop.items[0].en.split(' '):nextShop.items.map(item=>item.en)),
    tokens:[],failed:[],audioText:false}
  return {save:{...save,session,coins:save.coins+reward,completed:[...new Set([...save.completed,key])]},reward}
}
