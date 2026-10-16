/// <reference types="vite/client" />
const sheet = `${import.meta.env.BASE_URL}assets/products-editorial-v2.png`
const extensionSheet = `${import.meta.env.BASE_URL}assets/products-extension-v1.png`

// Explicit frames avoid neighbouring sprites and preserve each object's proportions.
const frames: Record<string, [number, number, number, number]> = {
  skirt: [32, 50, 320, 355],
  sweater: [374, 65, 368, 328],
  bag: [752, 75, 340, 318],
  dress: [1130, 55, 295, 353],
  apple: [40, 430, 325, 312],
  bread: [382, 455, 375, 283],
  bottle: [790, 410, 279, 333],
  cup: [1125, 411, 320, 328],
  lamp: [45, 748, 292, 323],
  plant: [385, 744, 350, 327],
  book: [749, 783, 350, 272],
  mug: [1148, 782, 293, 275],
}

const extensionFrames: Record<string, [number, number, number, number]> = {
  croissant:[15,45,315,265], coffee:[337,52,294,262], juice:[673,38,261,278], water:[1006,12,190,302],
  suitcase:[40,315,238,310], backpack:[337,314,292,312], sunglasses:[631,388,304,188], map:[940,353,298,272],
  soap:[20,659,305,254], shampoo:[380,627,190,305], perfume:[661,631,261,303], toothbrush:[968,624,254,309],
  headphones:[23,936,289,303], keyboard:[325,989,313,223], phone:[661,939,254,298], camera:[933,977,304,244],
}

export function hasArt(kind:string) { return kind in frames || kind in extensionFrames }

export function Art({ kind, color }: { kind: string; color: string }) {
  const extension = kind in extensionFrames
  const frame = extension ? extensionFrames[kind] : frames[kind === 'cup' && color === '#7c9db5' ? 'mug' : kind]
  if (!frame) return null
  return <svg viewBox={frame.join(' ')} aria-hidden="true" className="product-art" focusable="false">
    <image href={extension ? extensionSheet : sheet} width={extension ? 1254 : 1448} height={extension ? 1254 : 1086} />
  </svg>
}
