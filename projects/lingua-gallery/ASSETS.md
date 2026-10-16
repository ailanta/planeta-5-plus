# Графика Lingua Gallery

Все четыре актуальных PNG созданы встроенным `image_gen` (не CLI). Панорамы непрозрачные; атласы товаров имеют прозрачный фон. Потребители: `src/scenes.ts`, `src/Art.tsx`. Рамки атласа заданы явно, чтобы соседние предметы не попадали в карточки. Семантически важные цвета (red skirt, green apple, blue mug) проверены визуально.

| Файл в `public/assets/` | Назначение |
| --- | --- |
| `gallery-editorial-v2.png` | Одежда, продукты, дом |
| `products-editorial-v2.png` | 12 предметов первых трёх магазинов |
| `gallery-extension-v1.png` | Кафе, путешествия, уход, электроника |
| `products-extension-v1.png` | 16 предметов новых магазинов |

## Промпты новых тем

### gallery-extension-v1.png

Reference: gallery-editorial-v2.png. Transparent background: false.

Create a NEW matching production background for a language shopping game. Attached image is ONLY the style reference: same warm ivory architecture, deep sage shop frames, natural wood, honey-gold lights, softly dimensional premium illustration. Wide 3:1 panoramic scene of FOUR adjoining storefronts, all equally wide, aligned frontal perspective, one continuous shopping arcade floor: left to right a cozy CAFE with pastry display and espresso machine, a TRAVEL ACCESSORIES store with suitcases and backpacks, a BEAUTY store with skincare bottles and soaps, an ELECTRONICS boutique with headphones phones and cameras. Exactly four stores in order, cohesive with the attached arcade. Calm upscale uncluttered adult-neutral illustration, arched architecture, no people. No lettering, text, logos, price tags, UI, watermarks. Everything within image, generous floor in lower quarter. All stores should be visually identifiable by products.

### products-extension-v1.png

Reference: gallery-editorial-v2.png. Transparent background: true.

Create a NEW production sprite atlas matching the attached arcade illustration style: refined cozy semi-realistic dimensional objects, warm soft upper-left light, tactile matte materials, clean isolated shapes. Exactly 4 columns and 4 rows, 16 equal square cells in a regular SQUARE grid. Transparent background, no borders, no text, no labels. One object per cell entirely within central 70% with generous equal transparent padding. Row1 left-to-right: golden croissant, cup of black coffee in cream ceramic cup, glass of orange juice, clear bottle of water with blue cap. Row2: small sage-green wheeled suitcase, brown fabric backpack, black sunglasses, folded paper street map without readable text. Row3: cream bar of soap, tall sage-green shampoo bottle with a blank label, amber perfume bottle with gold cap, white toothbrush with sage handle. Row4: over-ear black wireless headphones, compact white computer keyboard, modern smartphone with dark screen, compact black camera with lens. All objects complete, no extra props, no hands, each centered precisely in its grid cell, non-overlapping; critical sprite sheet layout. Same premium warm material style as reference.

## Направление первых иллюстраций

Галерея: три соседних магазина, айвори, хвойный зелёный, шалфей, терракота, тёплый свет, фронтальная перспектива, без надписей и персонажей. Атлас: 4 колонки × 3 ряда, красная юбка, кремовый свитер, коричневая сумка, зелёное платье; зелёное яблоко, хлеб, молоко, чай; лампа, растение, книга, синяя кружка. Материалы и освещение согласованы с панорамой.
