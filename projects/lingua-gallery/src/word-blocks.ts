// Each new expression has its own illustration. Never reuse an ID for a different object.
export type WordBlock = {title:string; words:[string,string,string,string][]}
export const wordBlocks: Record<string, WordBlock[]> = {
 atelier: [
  {title:"Выбираем материалы",words:[
   ["cotton-shirt","a cotton T-shirt","хлопковая футболка","I would like a cotton T-shirt, please."],
   ["wool-scarf","a wool scarf","шерстяной шарф","I would like a wool scarf, please."],
   ["leather-boots","leather ankle boots","кожаные ботильоны","I would like leather ankle boots, please."],
   ["linen-shirt","a linen shirt","льняная рубашка","I would like a linen shirt, please."],
  ]},
  {title:"Фактуры и фасоны",words:[
   ["denim-jacket","a denim jacket","джинсовая куртка","I would like a denim jacket, please."],
   ["pleated-skirt","a pleated skirt","юбка в складку","I would like a pleated skirt, please."],
   ["satin-dress","a satin dress","атласное платье","I would like a satin dress, please."],
   ["canvas-trainers","canvas trainers","тканевые кеды","I would like canvas trainers, please."],
  ]},
 ],
 market: [
  {title:"Свежие продукты",words:[
   ["bananas","a bunch of bananas","связка бананов","I would like a bunch of bananas, please."],
   ["strawberries","a punnet of strawberries","лоток клубники","I would like a punnet of strawberries, please."],
   ["eggs","a carton of eggs","упаковка яиц","I would like a carton of eggs, please."],
   ["cheese","a piece of cheese","кусок сыра","I would like a piece of cheese, please."],
  ]},
  {title:"Запасы для кухни",words:[
   ["honey","a jar of honey","банка мёда","I would like a jar of honey, please."],
   ["rice","a bag of rice","пакет риса","I would like a bag of rice, please."],
   ["olive-oil","a bottle of olive oil","бутылка оливкового масла","I would like a bottle of olive oil, please."],
   ["tuna","a tin of tuna","банка тунца","I would like a tin of tuna, please."],
  ]},
 ],
 home: [
  {title:"Материалы в интерьере",words:[
   ["vase","a ceramic vase","керамическая ваза","I would like a ceramic vase, please."],
   ["cushion","a linen cushion","льняная декоративная подушка","I would like a linen cushion, please."],
   ["blanket","a wool blanket","шерстяной плед","I would like a wool blanket, please."],
   ["frame","a wooden picture frame","деревянная рамка для картины","I would like a wooden picture frame, please."],
  ]},
  {title:"Детали уютного дома",words:[
   ["candle-holder","a glass candle holder","стеклянный подсвечник","I would like a glass candle holder, please."],
   ["clock","a wall clock","настенные часы","I would like a wall clock, please."],
   ["basket","a woven basket","плетёная корзина","I would like a woven basket, please."],
   ["tray","a serving tray","сервировочный поднос","I would like a serving tray, please."],
  ]},
 ],
 cafe: [
  {title:"Перекус и десерт",words:[
   ["sandwich","a cheese sandwich","сэндвич с сыром","I would like a cheese sandwich, please."],
   ["muffin","a blueberry muffin","черничный маффин","I would like a blueberry muffin, please."],
   ["cake","a slice of chocolate cake","кусочек шоколадного торта","I would like a slice of chocolate cake, please."],
   ["cocoa","a cup of hot chocolate","чашка горячего шоколада","I would like a cup of hot chocolate, please."],
  ]},
  {title:"Обед в кафе",words:[
   ["soup","a bowl of tomato soup","миска томатного супа","I would like a bowl of tomato soup, please."],
   ["salad","a green salad","зелёный салат","I would like a green salad, please."],
   ["ice-cream","vanilla ice cream","ванильное мороженое","I would like vanilla ice cream, please."],
   ["iced-coffee","a glass of iced coffee","стакан кофе со льдом","I would like a glass of iced coffee, please."],
  ]},
 ],
 travel: [
  {title:"Комфорт в пути",words:[
   ["pillow","a travel pillow","дорожная подушка","I would like a travel pillow, please."],
   ["sleep-mask","a sleep mask","маска для сна","I would like a sleep mask, please."],
   ["reusable-bottle","a reusable water bottle","многоразовая бутылка для воды","I would like a reusable water bottle, please."],
   ["umbrella","a folding umbrella","складной зонт","I would like a folding umbrella, please."],
  ]},
  {title:"Готовы к прогулке",words:[
   ["hat","a sun hat","шляпа от солнца","I would like a sun hat, please."],
   ["hiking-boots","hiking boots","походные ботинки","I would like hiking boots, please."],
   ["wash-bag","a wash bag","дорожная косметичка","I would like a wash bag, please."],
   ["luggage-tag","a luggage tag","багажная бирка","I would like a luggage tag, please."],
  ]},
 ],
 care: [
  {title:"Утренний уход",words:[
   ["toothpaste","a tube of toothpaste","тюбик зубной пасты","I would like a tube of toothpaste, please."],
   ["hairbrush","a wooden hairbrush","деревянная щётка для волос","I would like a wooden hairbrush, please."],
   ["towel","a cotton towel","хлопковое полотенце","I would like a cotton towel, please."],
   ["hand-cream","a tube of hand cream","тюбик крема для рук","I would like a tube of hand cream, please."],
  ]},
  {title:"Забота о себе",words:[
   ["sunscreen","a tube of sunscreen","тюбик солнцезащитного крема","I would like a tube of sunscreen, please."],
   ["lip-balm","a lip balm","бальзам для губ","I would like a lip balm, please."],
   ["mirror","a hand mirror","ручное зеркало","I would like a hand mirror, please."],
   ["electric-toothbrush","an electric toothbrush","электрическая зубная щётка","I would like an electric toothbrush, please."],
  ]},
 ],
 tech: [
  {title:"Рабочее место",words:[
   ["mouse","a wireless mouse","беспроводная мышь","I would like a wireless mouse, please."],
   ["laptop","a laptop","ноутбук","I would like a laptop, please."],
   ["cable","a charging cable","кабель для зарядки","I would like a charging cable, please."],
   ["speaker","a portable speaker","портативная колонка","I would like a portable speaker, please."],
  ]},
  {title:"Техника для увлечений",words:[
   ["tablet","a tablet","планшет","I would like a tablet, please."],
   ["watch","a smartwatch","умные часы","I would like a smartwatch, please."],
   ["earbuds","wireless earbuds","беспроводные наушники-вкладыши","I would like wireless earbuds, please."],
   ["tripod","a camera tripod","штатив для фотоаппарата","I would like a camera tripod, please."],
  ]},
 ],
}
