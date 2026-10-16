// Four expressions per visit. Reuse matching object art; do not invent colours
// or quantities that contradict the illustration. IDs remain stable for saves.
export const wordBlocks: Record<string, {title:string; words:[string,string,string,string][] }[]> = {
 atelier:[
  {title:'Выбираем материалы',words:[['skirt','a cotton skirt','хлопковая юбка','This is a cotton skirt.'],['sweater','a wool sweater','шерстяной свитер','I need a wool sweater.'],['bag','a leather bag','кожаная сумка','I would like a leather bag.'],['dress','a summer dress','летнее платье','I am looking for a summer dress.']]},
  {title:'Стиль и удобство',words:[['skirt','a pleated skirt','юбка в складку','I would like a pleated skirt.'],['sweater','a warm sweater','тёплый свитер','I need a warm sweater.'],['bag','an everyday bag','повседневная сумка','I am looking for an everyday bag.'],['dress','a sleeveless dress','платье без рукавов','Do you have a sleeveless dress?']]}
 ],
 market:[
  {title:'Выбираем продукты',words:[['apple','a crisp apple','хрустящее яблоко','I would like a crisp apple.'],['bread','a loaf of bread','буханка хлеба','I need a loaf of bread.'],['milk','fresh milk','свежее молоко','Do you have fresh milk?'],['tea','hot tea','горячий чай','I would like hot tea.']]},
  {title:'Вкус и предпочтения',words:[['apple','a sour apple','кислое яблоко','This is a sour apple.'],['bread','crusty bread','хлеб с хрустящей корочкой','I would like crusty bread.'],['milk','whole milk','цельное молоко','I need whole milk.'],['tea','tea without sugar','чай без сахара','I would like tea without sugar.']]}
 ],
 home:[
  {title:'Детали интерьера',words:[['lamp','a bedside lamp','прикроватная лампа','I need a bedside lamp.'],['plant','a potted plant','растение в горшке','I would like a potted plant.'],['book','a hardcover book','книга в твёрдом переплёте','This is a hardcover book.'],['mug','a ceramic mug','керамическая кружка','I would like a ceramic mug.']]},
  {title:'Подарки для дома',words:[['lamp','a reading lamp','лампа для чтения','I am looking for a reading lamp.'],['plant','an indoor plant','комнатное растение','I need an indoor plant.'],['book','a book as a gift','книга в подарок','I would like a book as a gift.'],['mug','a mug for tea','кружка для чая','I need a mug for tea.']]}
 ],
 cafe:[
  {title:'Заказ в кафе',words:[['croissant','a buttery croissant','круассан со сливочным вкусом','I would like a buttery croissant.'],['coffee','hot coffee','горячий кофе','I would like hot coffee.'],['juice','freshly squeezed juice','свежевыжатый сок','Do you have freshly squeezed juice?'],['water','still water','негазированная вода','I would like still water.']]},
  {title:'Заказ по своему вкусу',words:[['croissant','a plain croissant','круассан без начинки','I would like a plain croissant.'],['coffee','coffee without sugar','кофе без сахара','I would like coffee without sugar.'],['juice','juice without ice','сок без льда','Can I have juice without ice?'],['water','cold water','холодная вода','I need cold water.']]}
 ],
 travel:[
  {title:'Удобно в дороге',words:[['suitcase','a wheeled suitcase','чемодан на колёсах','I need a wheeled suitcase.'],['backpack','a travel backpack','дорожный рюкзак','I would like a travel backpack.'],['sunglasses','a pair of sunglasses','пара солнцезащитных очков','I need a pair of sunglasses.'],['map','a paper map','бумажная карта','Do you have a paper map?']]},
  {title:'Готовы к поездке',words:[['suitcase','a lightweight suitcase','лёгкий чемодан','I am looking for a lightweight suitcase.'],['backpack','a backpack with pockets','рюкзак с карманами','I need a backpack with pockets.'],['sunglasses','sunglasses for driving','солнцезащитные очки для вождения','I need sunglasses for driving.'],['map','a map of the city centre','карта центра города','I would like a map of the city centre.']]}
 ],
 care:[
  {title:'Ежедневный уход',words:[['soap','hand soap','мыло для рук','I need hand soap.'],['shampoo','shampoo for dry hair','шампунь для сухих волос','I need shampoo for dry hair.'],['perfume','a floral perfume','духи с цветочным ароматом','I would like a floral perfume.'],['toothbrush','a soft toothbrush','мягкая зубная щётка','I need a soft toothbrush.']]},
  {title:'Выбираем для себя',words:[['soap','soap for sensitive skin','мыло для чувствительной кожи','I need soap for sensitive skin.'],['shampoo','shampoo for daily use','шампунь для ежедневного использования','I would like shampoo for daily use.'],['perfume','perfume as a gift','духи в подарок','I am looking for perfume as a gift.'],['toothbrush','a manual toothbrush','обычная неэлектрическая зубная щётка','I need a manual toothbrush.']]}
 ],
 tech:[
  {title:'Техника для работы',words:[['headphones','over-ear headphones','полноразмерные наушники','I would like over-ear headphones.'],['keyboard','a computer keyboard','компьютерная клавиатура','I need a computer keyboard.'],['phone','a smartphone','смартфон','I am looking for a smartphone.'],['camera','a camera with a lens','фотоаппарат с объективом','I need a camera with a lens.']]},
  {title:'Выбираем по задаче',words:[['headphones','headphones for music','наушники для музыки','I need headphones for music.'],['keyboard','a keyboard for work','клавиатура для работы','I would like a keyboard for work.'],['phone','a phone with a camera','телефон с камерой','I need a phone with a camera.'],['camera','a camera for travel','фотоаппарат для путешествий','I am looking for a camera for travel.']]}
 ]
}
