import { useRef, useState } from 'react'
import { shops } from './content'
import { sceneStyle } from './scenes'

export function ShopCarousel({ index, onChange }: { index:number; onChange:(index:number)=>void }) {
  const start = useRef<{x:number;y:number}|null>(null)
  const [direction,setDirection] = useState(1)
  const shop=shops[index]
  function select(next:number) {
    if(next<0 || next>=shops.length || next===index)return
    setDirection(next>index?1:-1)
    onChange(next)
  }
  return <section className="shop-carousel" aria-roledescription="карусель" aria-label="Магазины галереи" tabIndex={0}
    onKeyDown={event=>{if(event.key==='ArrowLeft'||event.key==='ArrowRight'){event.preventDefault();select(index+(event.key==='ArrowLeft'?-1:1))}}}>
    <div className="gallery-visual" data-panels={index < 3 ? 3 : 4}
      onTouchStart={event=>{if(event.touches.length!==1||(event.target as HTMLElement).closest('button')){start.current=null;return}start.current={x:event.touches[0].clientX,y:event.touches[0].clientY}}}
      onTouchCancel={()=>{start.current=null}}
      onTouchEnd={event=>{const origin=start.current;start.current=null;if(!origin)return;const dx=event.changedTouches[0].clientX-origin.x,dy=event.changedTouches[0].clientY-origin.y;if(Math.abs(dx)>50&&Math.abs(dx)>Math.abs(dy)*1.4)select(index+(dx<0?1:-1))}}>
      <div key={shop.id} className={`panorama carousel-scene ${direction>0?'from-right':'from-left'}`} style={sceneStyle(shop.id)} aria-hidden="true" />
      <div className="visual-fade" />
      <button className="shop-arrow previous" aria-label={index?`Предыдущий магазин: ${shops[index-1].subtitle}`:'Первый магазин'} disabled={!index} onClick={()=>select(index-1)}>←</button>
      <div className="shop-caption" aria-live="polite" aria-atomic="true"><span>{index+1} из {shops.length} · {shop.name}</span><strong>{shop.subtitle}</strong></div>
      <button className="shop-arrow next" aria-label={index<shops.length-1?`Следующий магазин: ${shops[index+1].subtitle}`:'Последний магазин'} disabled={index===shops.length-1} onClick={()=>select(index+1)}>→</button>
    </div>
    <div className="shop-pagination" aria-label="Перейти к магазину">{shops.map((shop,i)=><button key={shop.id} aria-label={shop.subtitle} aria-current={i===index?'true':undefined} onClick={()=>select(i)}><span /></button>)}</div>
    <p className="carousel-hint">Листайте магазины стрелками или свайпом</p>
  </section>
}
