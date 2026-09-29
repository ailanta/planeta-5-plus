import type { Exercise } from './types'

export type EnglishTopicId = 'english-clothes' | 'english-food' | 'english-toys' | 'english-home'

export type EnglishTopic = {
  id: EnglishTopicId
  title: string
  subtitle: string
  icon: string
  accent: string
}

export const englishTopics: EnglishTopic[] = [
  { id: 'english-clothes', title: 'Clothes', subtitle: 'Одежда и цвета', icon: '👗', accent: '#e86f9c' },
  { id: 'english-food', title: 'Food market', subtitle: 'Продукты и покупки', icon: '🍎', accent: '#4fbd8f' },
  { id: 'english-toys', title: 'Toys & hobbies', subtitle: 'Игрушки и увлечения', icon: '🧸', accent: '#728be8' },
  { id: 'english-home', title: 'Home & rooms', subtitle: 'Дом и комнаты', icon: '🛋️', accent: '#e3a45f' },
]

type TranslationCard = {
  id: string
  ru: string
  en: string
  choices: [string, string, string]
  emoji: string
  color: string
  kind?: string
  note?: string
  explanation?: string
}

type SentenceCard = TranslationCard & { explanation: string }

const clothesWords: TranslationCard[] = [
  { id: 'tshirt', ru: 'футболка', en: 'a T-shirt', choices: ['a T-shirt', 'a skirt', 'a hat'], emoji: '👕', color: '#6e9cf4', kind: 'tshirt' },
  { id: 'skirt', ru: 'юбка', en: 'a skirt', choices: ['a dress', 'a skirt', 'a shirt'], emoji: '👗', color: '#e97ba4', kind: 'skirt' },
  { id: 'red-skirt', ru: 'красная юбка', en: 'a red skirt', choices: ['a red skirt', 'a blue skirt', 'a red shirt'], emoji: '👗', color: '#ed6471', kind: 'skirt' },
  { id: 'jeans', ru: 'синие джинсы', en: 'blue jeans', choices: ['blue jeans', 'blue shorts', 'black jeans'], emoji: '👖', color: '#527dcc', kind: 'jeans' },
  { id: 'dress', ru: 'зелёное платье', en: 'a green dress', choices: ['a green dress', 'a green coat', 'a yellow dress'], emoji: '👗', color: '#55bd8b', kind: 'dress' },
  { id: 'coat', ru: 'тёплое пальто', en: 'a warm coat', choices: ['a warm coat', 'a long skirt', 'a warm hat'], emoji: '🧥', color: '#c9865b', kind: 'coat' },
  { id: 'jacket', ru: 'синяя куртка', en: 'a blue jacket', choices: ['a blue jacket', 'a black jacket', 'a blue T-shirt'], emoji: '🧥', color: '#597ed5', kind: 'jacket' },
  { id: 'hat', ru: 'чёрная шляпа', en: 'a black hat', choices: ['a black hat', 'a white hat', 'a black bag'], emoji: '👒', color: '#343746', kind: 'hat' },
  { id: 'trainers', ru: 'белые кроссовки', en: 'white trainers', choices: ['white trainers', 'white socks', 'brown boots'], emoji: '👟', color: '#e8edf7', kind: 'trainers' },
  { id: 'boots', ru: 'коричневые ботинки', en: 'brown boots', choices: ['brown boots', 'black trainers', 'brown socks'], emoji: '🥾', color: '#9b684c', kind: 'boots' },
  { id: 'socks', ru: 'жёлтые носки', en: 'yellow socks', choices: ['yellow socks', 'yellow shoes', 'green socks'], emoji: '🧦', color: '#e3b744', kind: 'socks' },
  { id: 'sweater', ru: 'фиолетовый свитер', en: 'a purple sweater', choices: ['a purple sweater', 'a pink sweater', 'a purple jacket'], emoji: '🧥', color: '#9070cf', kind: 'sweater' },
  { id: 'yellow-shirt', ru: 'жёлтая рубашка', en: 'a yellow shirt', choices: ['a yellow shirt', 'a yellow skirt', 'a green shirt'], emoji: '👕', color: '#e6c354', kind: 'tshirt' },
  { id: 'pink-dress', ru: 'розовое платье', en: 'a pink dress', choices: ['a pink dress', 'a pink coat', 'a purple dress'], emoji: '👗', color: '#e58bb2', kind: 'dress' },
  { id: 'long-skirt', ru: 'длинная юбка', en: 'a long skirt', choices: ['a long skirt', 'a short dress', 'a long coat'], emoji: '👗', color: '#8d78c9', kind: 'skirt' },
  { id: 'sports-bag', ru: 'спортивная сумка', en: 'a sports bag', choices: ['a sports bag', 'a school hat', 'a sports coat'], emoji: '🎒', color: '#4f9a9a' },
]

const clothesSentences: SentenceCard[] = [
  { id: 'wearing-skirt', ru: 'На ней красная юбка.', en: 'She is wearing a red skirt.', choices: ['She is wearing a red skirt.', 'She is wearing a blue shirt.', 'He is wearing a red skirt.'], emoji: '👗', color: '#e96783', kind: 'skirt', explanation: 'She is wearing… — «На ней надето…». Цвет ставим перед названием одежды: a red skirt.' },
  { id: 'need-trainers', ru: 'Мне нужны новые кроссовки.', en: 'I need new trainers.', choices: ['I need new trainers.', 'I have old trainers.', 'I need a new hat.'], emoji: '👟', color: '#e8edf7', kind: 'trainers', explanation: 'I need… — «Мне нужно…». Trainers употребляется во множественном числе.' },
  { id: 'jacket-big', ru: 'Эта синяя куртка слишком большая.', en: 'This blue jacket is too big.', choices: ['This blue jacket is too big.', 'These blue jeans are too small.', 'This black jacket is very warm.'], emoji: '🧥', color: '#526fc2', kind: 'jacket', explanation: 'This — «эта», too big — «слишком большая». Цвет стоит перед предметом: blue jacket.' },
]

const foodWords: TranslationCard[] = [
  { id: 'apple', ru: 'яблоко', en: 'an apple', choices: ['an apple', 'an orange', 'a tomato'], emoji: '🍎', color: '#e45d61' },
  { id: 'red-apple', ru: 'красное яблоко', en: 'a red apple', choices: ['a red apple', 'a green apple', 'a red tomato'], emoji: '🍎', color: '#da5057' },
  { id: 'bread', ru: 'хлеб', en: 'bread', choices: ['bread', 'rice', 'cheese'], emoji: '🍞', color: '#d8a65e' },
  { id: 'cheese', ru: 'сыр', en: 'cheese', choices: ['chicken', 'cheese', 'chocolate'], emoji: '🧀', color: '#edc74f' },
  { id: 'milk', ru: 'молоко', en: 'milk', choices: ['milk', 'juice', 'water'], emoji: '🥛', color: '#b7c9e8' },
  { id: 'juice', ru: 'апельсиновый сок', en: 'orange juice', choices: ['apple juice', 'orange juice', 'orange water'], emoji: '🧃', color: '#ef9e45' },
  { id: 'chicken', ru: 'курица', en: 'chicken', choices: ['chicken', 'cheese', 'rice'], emoji: '🍗', color: '#cf875f' },
  { id: 'rice', ru: 'рис', en: 'rice', choices: ['bread', 'rice', 'salad'], emoji: '🍚', color: '#e8dfc8' },
  { id: 'salad', ru: 'зелёный салат', en: 'a green salad', choices: ['a green salad', 'a fruit salad', 'green rice'], emoji: '🥗', color: '#66b978' },
  { id: 'cake', ru: 'шоколадный торт', en: 'a chocolate cake', choices: ['a chocolate cake', 'a chocolate bar', 'a fruit cake'], emoji: '🍰', color: '#a56d61' },
  { id: 'water', ru: 'бутылка воды', en: 'a bottle of water', choices: ['a cup of water', 'a bottle of water', 'a glass of milk'], emoji: '💧', color: '#62a9dc' },
  { id: 'tea', ru: 'чашка чая', en: 'a cup of tea', choices: ['a cup of tea', 'a glass of juice', 'a bottle of tea'], emoji: '☕', color: '#bd8063' },
  { id: 'banana', ru: 'банан', en: 'a banana', choices: ['a banana', 'an apple', 'a potato'], emoji: '🍌', color: '#e5c04d' },
  { id: 'tomato', ru: 'помидор', en: 'a tomato', choices: ['a tomato', 'a potato', 'an orange'], emoji: '🍅', color: '#dd625b' },
  { id: 'potato', ru: 'картошка', en: 'a potato', choices: ['a potato', 'a tomato', 'an onion'], emoji: '🥔', color: '#c39b6b' },
  { id: 'yogurt', ru: 'йогурт', en: 'yogurt', choices: ['yogurt', 'milk', 'cheese'], emoji: '🥣', color: '#dfb2c4' },
]

const foodSentences: SentenceCard[] = [
  { id: 'juice-glass', ru: 'Я хотел бы стакан апельсинового сока.', en: 'I would like a glass of orange juice.', choices: ['I would like a glass of orange juice.', 'I want a bottle of apple juice.', 'I would like a cup of tea.'], emoji: '🧃', color: '#ef9d42', explanation: 'I would like… — вежливое «Я хотел бы…». A glass of orange juice — стакан апельсинового сока.' },
  { id: 'bread-cheese', ru: 'У нас есть немного хлеба и сыра.', en: 'We have some bread and cheese.', choices: ['We have some bread and cheese.', 'We need an apple and some rice.', 'They have milk and chicken.'], emoji: '🧺', color: '#d2a45e', explanation: 'We have… — «У нас есть…». Some употребляется с неисчисляемыми bread и cheese.' },
  { id: 'buying-water', ru: 'Она покупает бутылку воды.', en: 'She is buying a bottle of water.', choices: ['She is buying a bottle of water.', 'He is drinking a glass of water.', 'She is buying a cup of tea.'], emoji: '💧', color: '#5aa6d9', explanation: 'She is buying… — «Она покупает…». A bottle of water — бутылка воды.' },
]

const toysWords: TranslationCard[] = [
  { id: 'ball', ru: 'мяч', en: 'a ball', choices: ['a ball', 'a doll', 'a kite'], emoji: '⚽', color: '#e65d65' },
  { id: 'doll', ru: 'кукла', en: 'a doll', choices: ['a doll', 'a robot', 'a ball'], emoji: '🪆', color: '#e88bad' },
  { id: 'toy-car', ru: 'игрушечная машинка', en: 'a toy car', choices: ['a toy car', 'a toy train', 'a bike'], emoji: '🚗', color: '#5f85df' },
  { id: 'puzzle', ru: 'пазл', en: 'a puzzle', choices: ['a puzzle', 'a board game', 'a book'], emoji: '🧩', color: '#d9a24f' },
  { id: 'book', ru: 'книга', en: 'a book', choices: ['a book', 'a comic', 'a puzzle'], emoji: '📘', color: '#5e82c8' },
  { id: 'bike', ru: 'велосипед', en: 'a bike', choices: ['a bike', 'a scooter', 'a toy car'], emoji: '🚲', color: '#58b79a' },
  { id: 'red-ball', ru: 'красный мяч', en: 'a red ball', choices: ['a red ball', 'a blue ball', 'a red kite'], emoji: '🏀', color: '#e46a55' },
  { id: 'board-game', ru: 'настольная игра', en: 'a board game', choices: ['a board game', 'a video game', 'a puzzle'], emoji: '🎲', color: '#8c70ce' },
  { id: 'musical-instrument', ru: 'музыкальный инструмент', en: 'a musical instrument', choices: ['a musical instrument', 'a sports bag', 'a board game'], emoji: '🎸', color: '#c58656' },
  { id: 'drawing', ru: 'рисование', en: 'drawing', choices: ['drawing', 'dancing', 'reading'], emoji: '🎨', color: '#ef8b67' },
  { id: 'swimming', ru: 'плавание', en: 'swimming', choices: ['swimming', 'skating', 'cycling'], emoji: '🏊', color: '#58a9d7' },
  { id: 'skating', ru: 'катание на коньках', en: 'ice skating', choices: ['ice skating', 'swimming', 'playing chess'], emoji: '⛸️', color: '#92bde0' },
]

const toysSentences: SentenceCard[] = [
  { id: 'play-ball', ru: 'Дети играют с красным мячом.', en: 'The children are playing with a red ball.', choices: ['The children are playing with a red ball.', 'The children are riding a bike.', 'The child is reading a book.'], emoji: '🏀', color: '#e46a55', explanation: 'Play with — «играть с». После with ставим предмет: a red ball.' },
  { id: 'likes-drawing', ru: 'Моя сестра любит рисовать.', en: 'My sister likes drawing.', choices: ['My sister likes drawing.', 'My brother likes swimming.', 'My sister is playing chess.'], emoji: '🎨', color: '#ef8b67', explanation: 'Likes drawing — «любит рисовать». После likes здесь используется название занятия.' },
  { id: 'new-puzzle', ru: 'У меня есть новый пазл.', en: 'I have a new puzzle.', choices: ['I have a new puzzle.', 'I need a new ball.', 'I have an old book.'], emoji: '🧩', color: '#d9a24f', explanation: 'I have — «у меня есть». New стоит перед предметом: a new puzzle.' },
]

const homeWords: TranslationCard[] = [
  { id: 'house', ru: 'дом', en: 'a house', choices: ['a house', 'a room', 'a garden'], emoji: '🏠', color: '#e3a45f' },
  { id: 'kitchen', ru: 'кухня', en: 'a kitchen', choices: ['a kitchen', 'a bedroom', 'a bathroom'], emoji: '🍽️', color: '#e89170' },
  { id: 'bedroom', ru: 'спальня', en: 'a bedroom', choices: ['a bedroom', 'a living room', 'a kitchen'], emoji: '🛏️', color: '#8a7bd2' },
  { id: 'bathroom', ru: 'ванная комната', en: 'a bathroom', choices: ['a bathroom', 'a bedroom', 'a balcony'], emoji: '🛁', color: '#72b9d1' },
  { id: 'living-room', ru: 'гостиная', en: 'a living room', choices: ['a living room', 'a dining room', 'a bedroom'], emoji: '🛋️', color: '#d89068' },
  { id: 'table', ru: 'стол', en: 'a table', choices: ['a table', 'a chair', 'a shelf'], emoji: '🪑', color: '#bb845b' },
  { id: 'chair', ru: 'стул', en: 'a chair', choices: ['a chair', 'a table', 'a bed'], emoji: '🪑', color: '#9e6c4f' },
  { id: 'big-bed', ru: 'большая кровать', en: 'a big bed', choices: ['a big bed', 'a small sofa', 'a big table'], emoji: '🛏️', color: '#788ad0' },
  { id: 'green-sofa', ru: 'зелёный диван', en: 'a green sofa', choices: ['a green sofa', 'a blue chair', 'a green bed'], emoji: '🛋️', color: '#62ad83' },
  { id: 'window', ru: 'окно', en: 'a window', choices: ['a window', 'a door', 'a wall'], emoji: '🪟', color: '#72b5d7' },
  { id: 'door', ru: 'дверь', en: 'a door', choices: ['a door', 'a window', 'a floor'], emoji: '🚪', color: '#a4775b' },
  { id: 'lamp', ru: 'лампа', en: 'a lamp', choices: ['a lamp', 'a mirror', 'a clock'], emoji: '💡', color: '#e4bd5e' },
]

const homeSentences: SentenceCard[] = [
  { id: 'in-kitchen', ru: 'Мама готовит на кухне.', en: 'Mum is cooking in the kitchen.', choices: ['Mum is cooking in the kitchen.', 'Dad is sleeping in the bedroom.', 'Mum is sitting in the living room.'], emoji: '🍽️', color: '#e89170', explanation: 'Is cooking — «готовит сейчас». In the kitchen — «на кухне».' },
  { id: 'new-lamp', ru: 'В моей комнате новая лампа.', en: 'There is a new lamp in my room.', choices: ['There is a new lamp in my room.', 'There is a big bed in the kitchen.', 'My room has a blue window.'], emoji: '💡', color: '#e4bd5e', explanation: 'There is — «есть, находится». In my room — «в моей комнате».' },
  { id: 'green-sofa', ru: 'В гостиной стоит зелёный диван.', en: 'There is a green sofa in the living room.', choices: ['There is a green sofa in the living room.', 'There is a blue chair in the bedroom.', 'The kitchen has a big table.'], emoji: '🛋️', color: '#62ad83', explanation: 'There is… in… помогает сказать, где находится предмет.' },
]

function makeExercise(topicId: EnglishTopicId, card: TranslationCard, level: 1 | 2): Exercise {
  const sentence = level === 2
  return {
    id: `${topicId}-${card.id}-x${level}`,
    topicId,
    skillId: `${topicId}-${card.id}`,
    familyId: card.id,
    level,
    prompt: card.ru,
    targetWord: card.en,
    root: topicId,
    testedLetter: card.en,
    stressedCheckWords: [],
    acceptedAnswers: { word: [card.en], checkWord: [] },
    explanation: sentence && card.explanation ? card.explanation : `${card.ru} — ${card.en}. Произнеси английский вариант вслух.`,
    hintSteps: sentence
      ? ['Найди, кто выполняет действие.', 'Обрати внимание на порядок слов и форму is + глагол-ing.', `Сравни ключевую часть с выражением «${card.en}».`]
      : ['Сначала вспомни главное слово.', 'Проверь цвет, артикль и число.', `Начало ответа: «${card.en.split(' ')[0]}…».`],
    tags: sentence ? ['english', 'sentence', 'context'] : ['english', 'vocabulary'],
    contentVersion: 1,
    taskType: sentence ? 'sentence-choice' : 'translation-choice',
    choices: card.choices,
    rewardItem: { emoji: card.emoji, label: card.en, color: card.color, kind: card.kind },
  }
}

export const englishExercises: Exercise[] = [
  ...clothesWords.map((card) => makeExercise('english-clothes', card, 1)),
  ...clothesSentences.map((card) => makeExercise('english-clothes', card, 2)),
  ...foodWords.map((card) => makeExercise('english-food', card, 1)),
  ...foodSentences.map((card) => makeExercise('english-food', card, 2)),
  ...toysWords.map((card) => makeExercise('english-toys', card, 1)),
  ...toysSentences.map((card) => makeExercise('english-toys', card, 2)),
  ...homeWords.map((card) => makeExercise('english-home', card, 1)),
  ...homeSentences.map((card) => makeExercise('english-home', card, 2)),
]

export function englishExercisesFor(topicId: EnglishTopicId): Exercise[] {
  return englishExercises.filter((exercise) => exercise.topicId === topicId)
}

export function englishCapacity(topicId: EnglishTopicId): number {
  return englishExercisesFor(topicId).reduce((sum, exercise) => sum + exercise.level, 0)
}
