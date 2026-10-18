import { shops, catalogShopItems, type Save } from './content'

export const storageSections = [
  {shopId:'atelier',name:'Гардероб',location:'в гардеробе'},
  {shopId:'market',name:'Продукты',location:'в разделе «Продукты»'},
  {shopId:'home',name:'Дом и уют',location:'в разделе «Дом и уют»'},
  {shopId:'cafe',name:'Из кафе',location:'в разделе «Из кафе»'},
  {shopId:'travel',name:'Для путешествий',location:'в разделе «Для путешествий»'},
  {shopId:'care',name:'Уход за собой',location:'в разделе «Уход за собой»'},
  {shopId:'tech',name:'Техника',location:'в разделе «Техника»'},
]
export function storageLocation(itemId:string) {
  const shop=shops.find(shop=>catalogShopItems(shop).some(item=>item.id===itemId))
  return storageSections.find(section=>section.shopId===shop?.id)?.location || 'в вашей коллекции'
}

// Display is independent of ownership: taking an item off the shelf never deletes it.
export function setOnDisplay(save:Save,itemId:string,display:boolean):Save {
  if(!save.owned.includes(itemId))return save
  if(!display)return {...save,placement:save.placement.filter(id=>id!==itemId)}
  if(save.placement.includes(itemId)||save.placement.length>=4)return save
  return {...save,placement:[...save.placement,itemId]}
}
