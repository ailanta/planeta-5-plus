import { parseBreakfast, type BreakfastProgress } from './breakfast'
import { wordBlocks } from './word-blocks'
import { legacyWordBlocks } from './legacy-word-blocks'
export type Item = { id: string; en: string; ru: string; kind: string; color: string; price: number; example: string }
export type Shop = { id: string; name: string; subtitle: string; mission: string; color: string; items: Item[]; question: string; reply: string; wrong: string[] }
export const shops: Shop[] = [
 { id:'atelier', name:'The Atelier', subtitle:'Одежда и стиль', mission:'Наряд для неспешного выходного',color:'#b76c59',items:[
 {id:'skirt',en:'a red skirt',ru:'красная юбка',kind:'skirt',color:'#c95853',price:30,example:'I would like a red skirt.'},
 {id:'sweater',en:'a cream sweater',ru:'кремовый свитер',kind:'sweater',color:'#e9d6b8',price:40,example:'This cream sweater is soft.'},
 {id:'bag',en:'a brown bag',ru:'коричневая сумка',kind:'bag',color:'#9b633f',price:35,example:'I need a brown bag.'},
 {id:'dress',en:'a green dress',ru:'зелёное платье',kind:'dress',color:'#558570',price:50,example:'Do you have a green dress?'}],question:'What colour would you like?',reply:'I would like a red skirt, please.',wrong:['I would like a blue skirt, please.','I would like a red bag, please.']},
 {id:'market',name:'Green Market',subtitle:'Продукты и покупки',mission:'Всё для завтрака дома',color:'#688c62',items:[
 {id:'apple',en:'a green apple',ru:'зелёное яблоко',kind:'apple',color:'#87a65d',price:15,example:'I would like a green apple.'},
 {id:'bread',en:'fresh bread',ru:'свежий хлеб',kind:'bread',color:'#d2a05e',price:20,example:'Do you have fresh bread?'},
 {id:'milk',en:'a bottle of milk',ru:'бутылка молока',kind:'bottle',color:'#e8e5d9',price:20,example:'I need a bottle of milk.'},
 {id:'tea',en:'a cup of tea',ru:'чашка чая',kind:'cup',color:'#7c9c87',price:25,example:'A cup of tea, please.'}],question:'What would you like?',reply:'I would like a green apple, please.',wrong:['I would like a red apple, please.','I would like a cup of tea, please.']},
 {id:'home',name:'Maison & Co.',subtitle:'Дом и уют',mission:'Уютный уголок для чтения',color:'#b38a50',items:[
 {id:'lamp',en:'a table lamp',ru:'настольная лампа',kind:'lamp',color:'#d4a35e',price:45,example:'I need a table lamp.'},
 {id:'plant',en:'a small plant',ru:'небольшое растение',kind:'plant',color:'#719275',price:25,example:'This is a small plant.'},
 {id:'book',en:'a new book',ru:'новая книга',kind:'book',color:'#8d7470',price:30,example:'I am reading a new book.'},
 {id:'mug',en:'a blue mug',ru:'синяя кружка',kind:'cup',color:'#7c9db5',price:25,example:'I would like a blue mug.'}],question:'Can I help you?',reply:'I would like a table lamp, please.',wrong:['I would like a small plant, please.','I would like a blue mug, please.']}
 ,{id:'cafe',name:'Little Pause',subtitle:'Кафе и напитки',mission:'Перерыв на кофе',color:'#aa7852',items:[
 {id:'croissant',en:'a fresh croissant',ru:'свежий круассан',kind:'croissant',color:'#c9954d',price:20,example:'I would like a fresh croissant.'},
 {id:'coffee',en:'a cup of coffee',ru:'чашка кофе',kind:'coffee',color:'#e7d9bd',price:20,example:'A cup of coffee, please.'},
 {id:'juice',en:'a glass of orange juice',ru:'стакан апельсинового сока',kind:'juice',color:'#e4ae52',price:25,example:'Can I have a glass of orange juice?'},
 {id:'water',en:'a bottle of water',ru:'бутылка воды',kind:'water',color:'#90aebb',price:15,example:'I need a bottle of water.'}],question:'What would you like to eat?',reply:'A fresh croissant, please.',wrong:['A cup of coffee, please.','A bottle of water, please.']},
 {id:'travel',name:'Away & Co.',subtitle:'Путешествия',mission:'Собираемся в поездку',color:'#819378',items:[
 {id:'suitcase',en:'a small suitcase',ru:'маленький чемодан',kind:'suitcase',color:'#849779',price:45,example:'I need a small suitcase.'},
 {id:'backpack',en:'a brown backpack',ru:'коричневый рюкзак',kind:'backpack',color:'#9e7354',price:40,example:'This brown backpack is light.'},
 {id:'sunglasses',en:'black sunglasses',ru:'чёрные солнцезащитные очки',kind:'sunglasses',color:'#323a36',price:30,example:'I would like black sunglasses.'},
 {id:'map',en:'a city map',ru:'карта города',kind:'map',color:'#d0ccb1',price:15,example:'Do you have a city map?'}],question:'What size suitcase do you need?',reply:'I need a small suitcase, please.',wrong:['I need a large suitcase, please.','I need a brown backpack, please.']},
 {id:'care',name:'Daily Ritual',subtitle:'Уход за собой',mission:'Всё для утренних привычек',color:'#9ba58b',items:[
 {id:'soap',en:'a bar of soap',ru:'кусок мыла',kind:'soap',color:'#e6d9b9',price:15,example:'I need a bar of soap.'},
 {id:'shampoo',en:'a bottle of shampoo',ru:'бутылка шампуня',kind:'shampoo',color:'#8a9c7e',price:25,example:'I would like a bottle of shampoo.'},
 {id:'perfume',en:'a bottle of perfume',ru:'флакон духов',kind:'perfume',color:'#c3a064',price:45,example:'This bottle of perfume is a gift.'},
 {id:'toothbrush',en:'a new toothbrush',ru:'новая зубная щётка',kind:'toothbrush',color:'#b7c1a3',price:20,example:'I need a new toothbrush.'}],question:'What are you looking for?',reply:'A bar of soap, please.',wrong:['A bottle of shampoo, please.','A new toothbrush, please.']},
 {id:'tech',name:'Everyday Tech',subtitle:'Электроника',mission:'Полезные вещи на каждый день',color:'#7c8981',items:[
 {id:'headphones',en:'wireless headphones',ru:'беспроводные наушники',kind:'headphones',color:'#343c38',price:45,example:'I would like wireless headphones.'},
 {id:'keyboard',en:'a white keyboard',ru:'белая клавиатура',kind:'keyboard',color:'#e9e7dd',price:35,example:'I need a white keyboard.'},
 {id:'phone',en:'a new phone',ru:'новый телефон',kind:'phone',color:'#404842',price:55,example:'I am looking for a new phone.'},
 {id:'camera',en:'a digital camera',ru:'цифровой фотоаппарат',kind:'camera',color:'#333d38',price:50,example:'Do you have a digital camera?'}],question:'Would you like wired or wireless headphones?',reply:'Wireless headphones, please.',wrong:['Wired headphones, please.','A white keyboard, please.']}
]

export const levelCount = 9
export const levelMode = (level:number) => (level - 1) % 3 + 1
export function lessonShop(shop:Shop, level:number):Shop {
 const blockIndex=Math.floor((level-1)/3)-1
 const block=wordBlocks[shop.id]?.[blockIndex]
 if(!block)return shop
 const items=block.words.map(([key,en,ru,example])=>({
  id:`${shop.id}:v3:${key}`,kind:`${shop.id}:${key}`,color:shop.color,
  price:shop.id==='market'||shop.id==='cafe'?25:40,en,ru,example
 }))
 return {...shop,mission:block.title,items,question:'What would you like?',reply:`I would like ${items[0].en}, please.`,wrong:items.slice(1,3).map(item=>`I would like ${item.en}, please.`)}
}
export function allShopItems(shop:Shop) {return [1,4,7].flatMap(level=>lessonShop(shop,level).items)}
// Retired expressions remain available only to owners, never in new lessons.
export function catalogShopItems(shop:Shop):Item[] {
 const legacy=legacyWordBlocks[shop.id].flatMap((block,index)=>block.words.map(([base,en,ru,example])=>({
  ...shop.items.find(item=>item.id===base)!,id:`${shop.id}:block${index+2}:${base}`,en,ru,example
 })))
 return [...allShopItems(shop),...legacy]
}
export function dialogueId(shopId:string,level:number) {const block=Math.floor((level-1)/3);return block===0?`${shopId}:dialogue`:`${shopId}:v3:block${block+1}:dialogue`}
export function levelLabel(shop:Shop,level:number) {return `${Math.floor((level-1)/3)+1}. ${lessonShop(shop,level).mission} · ${['Слова','На слух','Фразы'][levelMode(level)-1]}`}

export function shuffle<T>(values: T[]): T[] { const copy=[...values]; for(let i=copy.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[copy[i],copy[j]]=[copy[j],copy[i]]} return copy }
export type Session = {shopId:string;level:number;stage:'learn'|'play';card:number;step:number;selected:string;feedback:'good'|'bad'|null;options:string[];tokens:number[];failed:string[];audioText:boolean}
export type Save = {breakfast?:BreakfastProgress; version:1; contentRevision?:3; coins:number; owned:string[]; completed:string[]; review:string[]; learned:string[]; placement:string[];session:Session|null}
export const emptySave:Save={version:1,contentRevision:3,coins:0,owned:[],completed:[],review:[],learned:[],placement:[],session:null}
const itemIds = new Set(shops.flatMap(shop=>catalogShopItems(shop).map(item=>item.id)))
const activeIds = shops.flatMap(shop=>allShopItems(shop).map(item=>item.id))
const skillIds = new Set([...activeIds,...shops.flatMap(shop=>[1,4,7].map(level=>dialogueId(shop.id,level)))])
export function parseSave(raw:string|null):Save {
 try {
  const value=JSON.parse(raw||'null')
  if(value?.version!==1) return {...emptySave}
  const strings=(key:string,allowed:Set<string>)=>Array.isArray(value[key])?[...new Set<string>(value[key].filter((id:unknown)=>typeof id==='string'&&allowed.has(id)))]:[]
  const owned=strings('owned',itemIds)
  const completed=shops.flatMap(shop=>{const result:string[]=[];for(let level=1;level<=(value.contentRevision===3?levelCount:3);level++){const id=`${shop.id}:${level}`;if(!Array.isArray(value.completed)||!value.completed.includes(id))break;result.push(id)}return result})
  const save:Save={version:1,contentRevision:3,coins:Number.isSafeInteger(value.coins)&&value.coins>=0?value.coins:0,owned,completed,review:strings('review',skillIds),learned:strings('learned',skillIds),placement:strings('placement',new Set(owned)).slice(0,4),session:null}
  const s=value.session,base=shops.find(shop=>shop.id===s?.shopId),shop=base&&s?lessonShop(base,s.level):undefined
  if(shop&&s&&(value.contentRevision===3||s.level<=3)&&Number.isInteger(s.level)&&s.level>=1&&s.level<=levelCount&&(s.level===1||completed.includes(`${shop.id}:${s.level-1}`))&&['learn','play'].includes(s.stage)&&Number.isInteger(s.card)&&s.card>=0&&s.card<4&&Number.isInteger(s.step)&&s.step>=0&&s.step<=4&&typeof s.selected==='string'&&[null,'good','bad'].includes(s.feedback)&&Array.isArray(s.options)&&s.options.every((v:unknown)=>typeof v==='string')&&Array.isArray(s.tokens)&&s.tokens.every((v:unknown)=>Number.isInteger(v)&&Number(v)>=0&&Number(v)<s.options.length)&&new Set(s.tokens).size===s.tokens.length&&Array.isArray(s.failed)&&s.failed.every((v:unknown)=>typeof v==='string'&&skillIds.has(v))&&typeof s.audioText==='boolean') {
   const expected=s.step===4?[shop.reply,...shop.wrong]:levelMode(s.level)===3?shop.items[s.step].en.split(' '):shop.items.map(item=>item.en)
   const optionsValid=s.stage==='learn'||JSON.stringify([...s.options].sort())===JSON.stringify([...expected].sort())
   const answer=levelMode(s.level)===3&&s.step<4?s.tokens.map((i:number)=>s.options[i]).join(' '):s.selected
   const feedbackValid=s.feedback!=='good'||answer===(s.step===4?shop.reply:shop.items[s.step].en)
   if(optionsValid&&feedbackValid)save.session={...s,failed:[...new Set<string>(s.failed)]}
  }
  const breakfast=parseBreakfast(value.breakfast)
  if(breakfast)save.breakfast=breakfast
  return save
 }catch{return {...emptySave}}
}
export function readSave():Save {try{return parseSave(localStorage.getItem('lingua-gallery:v1'))}catch{return {...emptySave}}}
