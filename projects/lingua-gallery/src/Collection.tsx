import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react'
import { Art } from './Art'
import { shops, allShopItems, type Save } from './content'
import { setOnDisplay, storageLocation, storageSections } from './possessions'

const items=shops.flatMap(allShopItems)
export function Collection({save,setSave,onContinue,speak}:{save:Save;setSave:Dispatch<SetStateAction<Save>>;onContinue:()=>void;speak:(text:string)=>void}) {
  const [selected,setSelected]=useState<string|null>(null)
  const dialog=useRef<HTMLDialogElement>(null)
  const title=useRef<HTMLHeadingElement>(null)
  const item=items.find(item=>item.id===selected)
  const displayed=!!item&&save.placement.includes(item.id)
  const full=save.placement.length>=4
  useEffect(()=>{title.current?.focus({preventScroll:true})},[])
  useEffect(()=>{if(selected)dialog.current?.showModal();else dialog.current?.close()},[selected])
  return <main className="collection-page possessions-page">
    <h1 ref={title} tabIndex={-1}>Мои покупки.</h1>
    <p>{save.owned.length?'Все ваши вещи здесь. Нажмите на любую, чтобы рассмотреть.':'После первой покупки здесь появится ваша коллекция.'}</p>
    {save.owned.length>0&&<>
      <section className="display-section" aria-labelledby="display-title">
        <div className="collection-section-title"><h2 id="display-title">Любимые вещи</h2><span>{save.placement.length} / 4 на полке</span></div>
        <div className="room" aria-label="Полка с любимыми вещами"><div className="room-window" /><div className="shelf">{[0,1,2,3].map(index=>{const item=items.find(item=>item.id===save.placement[index]);return <div className="shelf-slot" key={index}>{item?<button aria-label={`Рассмотреть: ${item.ru}`} onClick={()=>setSelected(item.id)}><Art kind={item.kind} color={item.color}/></button>:<span/>}</div>})}</div>{!save.placement.length&&<p className="shelf-empty">Выберите вещь ниже и поставьте её на полку</p>}</div>
        <p className="display-help">Полка — для любимых находок. Все покупки хранятся ниже.</p>
      </section>
      <div className="owned-sections">{storageSections.map(section=>{
        const owned=allShopItems(shops.find(shop=>shop.id===section.shopId)!).filter(item=>save.owned.includes(item.id))
        if(!owned.length)return null
        return <section className={`owned-section ${section.shopId==='atelier'?'wardrobe':''}`} key={section.shopId} aria-labelledby={`storage-${section.shopId}`}>
          <div className="collection-section-title"><h2 id={`storage-${section.shopId}`}>{section.name}</h2><span>{owned.length}</span></div>
          <div className="owned-grid">{owned.map(item=><button key={item.id} className="owned-item" aria-label={`Открыть: ${item.ru}`} onClick={()=>setSelected(item.id)}><Art kind={item.kind} color={item.color}/><strong>{item.ru}</strong><span lang="en">{item.en}</span><small>{save.placement.includes(item.id)?'Также на полке':'В коллекции'}</small></button>)}</div>
        </section>
      })}</div>
    </>}
    <button className="primary" onClick={onContinue}>За покупками →</button>
    <dialog ref={dialog} className="shop-dialog item-dialog" aria-labelledby="owned-item-title" onCancel={()=>setSelected(null)} onClose={()=>setSelected(null)}>
      {item&&<><div className="dialog-top"><span>Ваша покупка</span><button className="icon-button" aria-label="Закрыть карточку вещи" onClick={()=>setSelected(null)}>×</button></div><div className="owned-preview"><Art kind={item.kind} color={item.color}/></div><h2 id="owned-item-title">{item.ru}</h2><button className="text-button item-pronunciation" onClick={()=>speak(item.en)} aria-label={`Послушать: ${item.en}`}><span lang="en">{item.en}</span> ♫</button><p className="item-location">Хранится {storageLocation(item.id)}.</p><p className="item-example" lang="en">{item.example}</p>
      <button className="primary" disabled={!displayed&&full} onClick={()=>setSave(current=>setOnDisplay(current,item.id,!displayed))}>{displayed?'Убрать с полки':'Поставить на полку'}</button><p className="item-reassurance" aria-live="polite">{displayed?'Вещь выставлена на полке и остаётся в коллекции.':full?'Полка заполнена. Сначала уберите с неё другую вещь.':'Вещь в коллекции. Можно вернуть на полку в любой момент.'}</p></>}
    </dialog>
  </main>
}
